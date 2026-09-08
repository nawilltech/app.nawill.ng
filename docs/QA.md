# Nawill App — QA & Testing Strategy

**Document version:** 1.0 · **Date:** 18 July 2026
**Status:** Draft for review

Companion docs: [PRD](./PRD.md) · [Architecture & Database Schema](./ARCHITECTURE.md) · [Technical Docs & Flow Diagrams](./TECHNICAL.md)

---

## 1. Philosophy

Test depth is allocated by blast radius, not by lines of code. Nawill App moves real money in two places — invoice payments and wallet funding/spend — and enforces access control everywhere. Those get exhaustive, transaction-level e2e coverage against a real Postgres instance. CRUD-shaped modules (projects, support tickets, blog) get lighter coverage: enough to prove the standard response envelope, pagination, and RBAC guard are wired correctly, not exhaustive business-rule testing.

**Priority order for this build:**

1. **Wallet ledger integrity** — funding, spend, insufficient balance, idempotent retries, concurrent debits.
2. **Payment reconciliation** — webhook signature verification, idempotency, purpose-based side effects (invoice vs wallet).
3. **Auth & account security** — password hashing/verification/complexity, JWT issuance, Redis-backed login lockout, forgot/reset/change password, TOTP + email 2FA, permission-denied paths, row-level org scoping.
4. **Everything else** — smoke-level coverage of the response envelope and pagination on representative endpoints, plus the analytics aggregation endpoint (it's read-only but wrong numbers on a client's dashboard are a trust problem).

## 2. Test Layers

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Jest | Pure logic: money math (minor units), ledger direction/sign handling, DTO validation edge cases, JWT/argon2 helpers |
| e2e (API) | Jest + Supertest, real Nest app, real disposable Postgres | Full HTTP request → guard → service → Prisma → Postgres round trip for every sensitive flow below |

No mocking of Prisma or Postgres in e2e tests — the whole point is to catch the class of bug that only shows up against a real transaction (row locks, unique constraint races, `SELECT ... FOR UPDATE` behavior). Only the payment **processor** is mocked (§4), since it's a third party we don't control and have no sandbox credentials for yet.

## 3. Disposable Database — "Test and Erase"

Testcontainers (Docker) is the eventual CI-portable answer once a live Docker daemon is available (see decision log below), but this build targets what's actually runnable on this machine today: a real local Postgres server (already running, trust-auth as the local user) with a database that is **created fresh and destroyed** on every test run.

```
apps/api/test/setup/global-setup.ts       — dropdb (if exists) → createdb nawill_test →
                                              `prisma migrate deploy` against it →
                                              writes DATABASE_URL into process env for the run
apps/api/test/setup/global-teardown.ts    — dropdb nawill_test
```

Configured as Jest's `globalSetup` / `globalTeardown` in `apps/api/test/jest-e2e.json`, so:

- Every `pnpm test:e2e` run starts from an empty, freshly-migrated schema — no leftover rows from a previous run can make a test pass or fail for the wrong reason.
- Each test **file** additionally truncates every table in a `beforeEach` (via a small `resetDb()` helper) so tests within a run don't leak state into each other either — true per-test isolation, not just per-run.
- Nothing is left behind: teardown drops the database even if tests fail, so re-runs never collide with a half-finished previous run.
- The database name includes the Jest worker id (`nawill_test_w${workerId}`) so `--maxWorkers > 1` doesn't race two workers over the same database.

The same "test and erase" treatment applies to Redis, since auth security (§5.3) depends on it: `test/setup/global-setup.ts` and `global-teardown.ts` `FLUSHDB` an isolated Redis logical database (index 1, vs. dev's index 0) at the start and end of the run, and `test/utils/reset-redis.ts` gives the auth-security spec a per-test flush the same way `resetDb()` does for Postgres.

**CI note:** the same scripts work unchanged in GitHub Actions using a `postgres:16` service container (`services:` block) — no code path is Testcontainers-specific, so switching to Testcontainers later (for fully hermetic local runs without a pre-installed Postgres) is a drop-in change to `global-setup.ts` only.

**Decision log:** Docker was installed on the dev machine but the daemon wasn't running when this was built, and a local Postgres server already was — so local-Postgres create/migrate/drop was chosen over starting Docker Desktop, to avoid an unnecessary environment change. Revisit if the team standardizes on Testcontainers for CI parity.

## 4. Mock Payment Processor

`MockPaymentProcessorAdapter` implements the same `PaymentProcessorAdapter` interface a real Paystack/Flutterwave adapter would (`createLink`, `verify`, `parseWebhook`):

- `createLink()` returns a deterministic fake checkout URL and a generated `processorReference` — no network call.
- Webhook payloads are signed with HMAC-SHA256 using a test secret (`MOCK_PROCESSOR_WEBHOOK_SECRET`), so signature-verification logic is exercised for real, not stubbed out — a test can also send a **tampered** payload to prove invalid signatures are rejected.
- `verify()` looks up the fake transaction from an in-memory map seeded by `createLink`, so "verification before trust" (see [Technical doc §3.1](./TECHNICAL.md#31-payments--wallet-idempotency-webhooks-reconciliation-requery)) runs against something, rather than blindly trusting the webhook body.

This means the entire initiate → webhook → signature-check → verify → reconcile loop is tested end-to-end with no external dependency, and swapping in a real processor later only means writing a new adapter — none of the test suite for the surrounding logic should need to change.

## 5. Sensitive-Flow Coverage (e2e)

### 5.1 Wallet

| Test | Scenario |
|---|---|
| Fund wallet — happy path | Initiate funding → mock webhook fires → wallet balance credited exactly once, `wallet_transactions` row has correct `balanceAfterMinor` |
| Fund wallet — duplicate webhook | Same webhook delivered twice (processors do this) → balance credited only once, second delivery is a no-op |
| Fund wallet — invalid signature | Tampered payload → notification stored with `signatureValid=false`, balance untouched |
| Fund wallet — retried initiate | Same `Idempotency-Key` posted twice → single `payments` row, same payment link returned, no duplicate charge created |
| Pay invoice with wallet — happy path | Sufficient balance → wallet debited, invoice `paid`, ledger row references the invoice |
| Pay invoice with wallet — insufficient balance | Balance < invoice total → `422 UNPROCESSABLE`, no new ledger row written, invoice untouched |
| Pay invoice with wallet — duplicate request | Same `Idempotency-Key` posted twice (e.g. client retry after a timeout) → debited exactly once |
| Pay invoice with wallet — concurrent requests | Two simultaneous requests against a wallet whose balance covers the invoice only once → exactly one succeeds, the other gets a consistent insufficient-balance or already-processed response; final balance is never negative |
| Wallet — cross-user access | User A cannot read or spend User B's wallet (`GET /wallets/me` is always self-scoped; `GET /wallets/:userId` requires the `staff` or `admin` role) |

### 5.2 Payments (invoice via processor link)

| Test | Scenario |
|---|---|
| Initiate → webhook → reconcile | Full happy path marks the correct invoice `paid` and sets `reconciledAt` |
| Webhook for unknown/already-processed payment | Ignored safely, no exception, `processingStatus=ignored` recorded |
| Amount mismatch between webhook and `verify()` | Payment is **not** marked successful — reconciliation trusts `verify()`, not the raw webhook body |

### 5.3 Auth & RBAC

| Test | Scenario |
|---|---|
| Signup + login | Password is stored as an argon2id hash (never plaintext), login issues a valid JWT, wrong password is rejected |
| Guard denial | A `client`-type user calling a `staff`/`admin`-only route (e.g. `POST /projects`) gets `403 FORBIDDEN`, not a silent pass-through |
| Missing/expired token | Unauthenticated request to a protected route gets `401`, not a 500 or a leaked resource |
| Org-scoping | A client from Org A cannot fetch an invoice/project belonging to Org B by guessing its id |

### 5.4 Account Security — Password Policy, Lockout, Reset, 2FA

| Test | Scenario |
|---|---|
| Weak password rejected | Signup/reset/change with a password missing uppercase, lowercase, a number, or a special character → `400 VALIDATION_ERROR` naming the `password` field |
| Login lockout | 5 consecutive wrong-password attempts → the 6th attempt, **even with the correct password**, gets `429 ACCOUNT_LOCKED` with a Redis TTL of ≤ 15 minutes |
| Lockout boundary | 4 wrong attempts do **not** lock the account — the 5th (correct) succeeds normally |
| Lockout clears on success | A successful login deletes the failure counter — the next wrong attempt starts counting from 1, not 5 |
| Forgot/reset password | Reset token delivered via the dev mailbox; consuming it changes the password (old password stops working, new one works); an unknown/reused token is rejected; `forgot-password` returns the same message whether or not the email exists (no account enumeration) |
| Change password | Authenticated user changes their password by confirming the current one; wrong current password is rejected; new password works on next login |
| TOTP 2FA | `2fa/totp/setup` → `2fa/totp/enable` with a code generated by `otplib` against the returned secret enables it; login then returns a challenge instead of tokens; a wrong code at `2fa/verify` is rejected, the correct one (regenerated from the same secret) issues tokens |
| Email 2FA | `2fa/email/request-code` → `2fa/email/enable` with the code read from the dev mailbox enables it; login sends a **new** OTP (distinct from the setup code) to the mailbox; `2fa/verify` with that code issues tokens |
| Disable 2FA | Disabling requires the current password; login afterwards is single-factor again |

### 5.5 Bank Accounts

| Test | Scenario |
|---|---|
| Verify + add | Adding an account resolves the name via `PaystackAccountVerificationProvider` (mock resolution — no `PAYSTACK_SECRET_KEY` in test env) and stores it `isVerified=true` with the **resolved**, not client-supplied, name |
| First account is default | The first account a user adds is `isDefault=true` automatically; a second is not |
| Duplicate rejected | Adding the exact same `(bankCode, accountNumber)` twice for the same user → `409 CONFLICT` |
| Set default | `PATCH /bank-accounts/:id/set-default` flips exactly one account to default, un-defaulting the previous one, in a single transaction |
| Cross-user isolation | User B cannot see, set-default, or delete User A's bank account — `listMine` excludes it, and direct-id operations 404 rather than leaking existence via a 403 |
| Soft delete | A removed account disappears from `GET /bank-accounts/me` |

### 5.6 Countries & Administrative Divisions

| Test | Scenario |
|---|---|
| Flag is computed, not stored | Every country in a list response has a 2-codepoint regional-indicator flag emoji despite no `flag` column existing |
| Full detail present | Nigeria's record has `capital`, `currencyCode`, `iso2`/`iso3`, etc. all populated from the seed |
| Unknown country 404s | A random UUID against `GET /countries/:id` is a clean `404`, not a 500 |
| Tier filter | `?tier=1` on Nigeria's divisions returns exactly 37 rows (36 states + FCT), all `tier=1` |
| Parent → children, two ways | A state's LGAs come back identically whether fetched via `?parentId=<stateId>` on the divisions endpoint or via the dedicated `GET /divisions/:id/children` — same underlying query, two entry points |

### 5.7 Analytics

| Test | Scenario |
|---|---|
| Overview aggregation | `GET /analytics/me/overview` numbers match what direct queries against projects/invoices/wallet/tickets for that user return — seeded fixture data, exact-value assertions, not just "200 OK" |

### 5.8 Invoices — Multi-Item, Discount, VAT

| Test | Scenario |
|---|---|
| Multi-item + discount + VAT | 2 items summed, a flat discount subtracted, VAT computed on the *discounted* amount — exact-value assertions on `subtotalMinor`/`discountMinor`/`taxMinor`/`totalMinor`, not just "success" |
| VAT off | `vatEnabled: false` produces `taxMinor: '0'` even when a `vatRate` is also passed — confirms the flag, not just the rate's presence, gates VAT |
| Discount exceeds subtotal | Rejected with `400`, not silently clamped to zero |
| Cancelled item | Excluded from `subtotalMinor`/`totalMinor` but still present on `items[]` with `actualAmountMinor: '0'` and the original `unitAmountMinor` kept (for the PDF's struck-through display, §8.6) |

### 5.9 Support Tickets — Creation & Self-Service Close

| Test | Scenario |
|---|---|
| Create with opening message | `POST /support-tickets` returns a ticket whose `messages[]` already contains the one passed in the same call |
| Owner closes their own ticket | `POST /support-tickets/:id/close` as the raiser → `ticketStatus: 'closed'`, `resolvedAt` set |
| Staff closes any ticket | Same endpoint, staff token, ticket raised by a different user → succeeds |
| Cross-client rejection | A different client (not staff, not the raiser) gets `403` — same `assertSelfOrStaff` guard used for reading/replying to a ticket |

### 5.10 Seed Idempotency

Not an e2e HTTP test — verified operationally, since `test/setup/global-setup.ts` runs `prisma db seed` fresh on every `pnpm test:e2e` invocation, and every full local run of this suite during development ran the seed 3+ times against the same dev database (once per schema change) with row counts checked by hand each time (`250` countries, `63` divisions, `12` services, `1` admin — stable across reruns). Worth turning into an explicit assertion (e.g. a script that seeds twice and diffs row counts) if this becomes a recurring source of regressions; not done as a Jest test in this pass because it's a property of the seed script, not of the running API.

## 6. Running the Tests

```bash
# from apps/api
pnpm install
pnpm test           # unit tests, no database required
pnpm test:e2e        # spins up nawill_test_w<id>, runs migrations, runs e2e suite, drops the db
```

`pnpm test:e2e` requires a local Postgres server (trust-auth as the current OS user on `localhost:5432`, matching this machine's setup) **and** a local Redis server on `localhost:6379` — both auth-security tests (§5.4) and the app's global guards depend on Redis being reachable. No other setup is required — no Docker, no seed scripts to run by hand.

## 7. Known Gaps (explicitly out of scope for this pass)

- **Load/concurrency testing beyond the two-concurrent-requests wallet case** above — no load-test harness (k6/artillery) is included.
- **Requery cron job** — deferred to Phase 2 per the [PRD](./PRD.md#42-phase-2); nothing to test yet.
- **Live processor sandbox testing** (real Paystack/Flutterwave test keys) — the mock adapter proves our side of the contract; a real processor's actual webhook quirks are untested until Phase 2 credentials exist.
- **Fine-grained `(domain, action)` permission guard** — the `roles` / `permissions` / `role_permissions` / `user_roles` tables exist and are seeded (see [Architecture doc §7.2](./ARCHITECTURE.md#72-entity-relationship-diagram)), but this build enforces access with a coarser `@Roles('client' | 'staff' | 'admin')` guard on `users.userType` rather than the full permission-matrix guard described in [Technical doc §3.2](./TECHNICAL.md#32-rbac-design-supports-26). Swapping in the finer-grained guard later is additive — it doesn't require a schema or route change.
- **BullMQ** — not introduced in this build. Webhook reconciliation runs synchronously inside the HTTP handler (still wrapped in a single DB transaction, still idempotent — just not queued) instead of via a BullMQ worker. Cheap to add later per [Architecture doc §6](./ARCHITECTURE.md#6-scalability--extensibility-path) and not needed at current traffic (< 1 RPS peak, see [Architecture doc §5](./ARCHITECTURE.md#5-capacity-estimation)); tests assert on the transactional/idempotency guarantees, which don't change when a queue is introduced. Redis itself **is** live in this build, but scoped to auth security only (§5.4, [Architecture doc §7.7](./ARCHITECTURE.md#77-redis-backed-auth-security)) — general response caching and RBAC-permission caching are still deferred.
- **Stateless refresh tokens** — `POST /auth/refresh` re-verifies and re-signs a JWT rather than tracking/rotating refresh sessions in Redis as originally specified ([Architecture doc tech stack table](./ARCHITECTURE.md#1-tech-stack)). A leaked refresh token is valid until it expires (7 days) and can't be individually revoked — only a full secret rotation invalidates it. Session-tracked, revocable refresh tokens are a reasonable follow-up given Redis is now wired up for auth anyway.
- **No rate limiting beyond login lockout** — the login-lockout mechanism (§5.4) protects password guessing specifically; general API rate limiting (NFR-10) across all endpoints is not implemented.
- **Frontend/UI testing** — `apps/web` is now a fully built client dashboard (every client-facing API capability has a real form/action behind it — see [Architecture doc §8](./ARCHITECTURE.md#8-frontend-architecture)), but there's still no automated frontend test suite (no Playwright/Cypress/RTL). What exists instead is real, repeatable manual/`curl` verification, not just code review: all 22 routes build and render; every dashboard page was hit with an authenticated cookie and checked for zero silent error states (confirming every `apiFetch`/`apiFetchPage` call succeeds against live data); and four Server Actions covering every distinct "shape" in the app were invoked for real by replicating Next.js's Server Action wire protocol with `curl` (extracting the hidden `$ACTION_*` fields from a rendered form, POSTing multipart data) — `fundWallet` (money-initiating), `payInvoiceWithWallet` (money-completing: a seeded `pending` invoice went to `paid` and the wallet balance dropped by exactly the invoice total, both confirmed via direct API/DB checks), `updateProfile` (simple mutation, confirmed persisted via `GET /users/me`), and `createSupportTicket` (redirect-on-create, confirmed via a real `303` to the new ticket and the ticket existing via the API). The remaining ~11 actions (`changePassword`, bank account add/set-default/remove, `addTicketMessage`, `payInvoiceWithProcessor`, organization update, KYC submission, the four 2FA actions) reuse these same verified patterns against already-e2e-tested API endpoints and weren't individually `curl`-replicated — reasonable given the mechanism itself is proven, but worth knowing the difference between "this exact call was executed" and "this call uses an execution path that's proven." A real Playwright suite would close that gap and is the natural next investment once the app has actual users clicking through it.
- **Invoice PDF generation — build-verified and visually confirmed, not just code-reviewed.** `@react-pdf/renderer` installed successfully once network access returned (see [Architecture doc §8.6](./ARCHITECTURE.md#86-invoice-pdf-generation)). Beyond `pnpm build` passing, the actual `InvoiceDocument` component was rendered outside the browser (Node, using the library's own isomorphic `pdf()` API) with realistic sample data — including a cancelled line item and `vatEnabled` — and the resulting PDF was read back and visually inspected: navy header, Special Elite company name, periwinkle table header with alternating row shading, struck-through cancelled amount, rotated "PAID IN FULL" stamp, and the green `BALANCE DUE` bar all render correctly.
- **`amountPaidMinor` on the invoice PDF is derived, not stored** — computed client-side as `invoiceStatus === 'paid' ? totalMinor : 0`, which is exactly correct today because neither payment path (`payInvoiceWithWallet`, `payInvoiceWithProcessor`) supports partial payment — both settle the full total in one shot. If partial payments are ever built, this derivation needs to change to sum actual `Payment`/`WalletTransaction` records instead.
- **Referral program** — schema only (see [Architecture doc §7.6](./ARCHITECTURE.md#76-referral-program-schema-only--phase-3)), explicitly requested as structure-not-implementation. No service, route, or test exists, so there is nothing to QA yet.
- **Project milestones/change-history/status-requests, blog, file upload handling** — trimmed from this pass's MVP slice per [PRD §4.1](./PRD.md#41-mvp-phase-1) in favor of depth on money- and access-control-sensitive modules; untested because unbuilt, not because they were tested and cut. (Email verification, originally trimmed alongside these, was added later in this build — see the email-delivery bullet below. A lightweight Knowledge Base, also originally scoped as "FAQ" here, was likewise added later — see the next bullet.)
- **No admin authoring UI for Knowledge Base articles** — `GET /knowledge-base/*` (categories, category detail, article) is fully built and read-tested live against the running API, but there's no `POST`/`PATCH` route or admin page yet; content is managed via `prisma/seed.ts`'s `seedKnowledgeBase()` (idempotent — safe to extend and re-run) until a real authoring flow is built. Same shape as the "no admin UI for ticket assignment/KYC review" gap already noted in [Architecture doc §8.7](./ARCHITECTURE.md#87-whats-deliberately-not-built).
- **Real Gmail delivery was live-verified twice, not just code-reviewed** — with `GMAIL_USER`/`GMAIL_APP_PASSWORD` configured, `POST /auth/forgot-password` was called against a real Gmail address and confirmed to arrive (subject "Reset your Nawill password"), both before and after the plain-text-with-raw-token email was replaced by the shared branded HTML template (`renderEmailTemplate()`, §7.7) with a direct reset link. The e2e suite itself never exercises the real Gmail path — `test/setup/jest.setup-files.ts` force-clears both env vars so `signup()`-heavy test runs never perform real SMTP calls regardless of what's in a developer's local `.env`.
- **Docker build not verified end-to-end** — `apps/api/Dockerfile`, `apps/web/Dockerfile`, and `docker-compose.yml` (see [Technical doc §6](./TECHNICAL.md#6-deployment-docker)) were written against a working reference pattern, but the Docker daemon wasn't running on this machine when they were built, so `docker compose build && docker compose up` hasn't actually been run for either image. `pnpm build` for both apps — the same build step each Dockerfile runs, including web's `output: 'standalone'` step — was verified directly and produces the expected output (`.next/standalone/apps/web/server.js`, matching the Dockerfile's `CMD`), so the parts Docker wraps are known-good; the container packaging itself isn't.
- **CI/CD workflows not run** — `.github/workflows/ci.yml`, `deploy-dev.yml`, `deploy-prod.yml`, and `_deploy.yml` (see [Technical doc §8](./TECHNICAL.md#8-branching-model--cicd)) were written to a real, standard pattern (GitHub Actions service containers for Postgres/Redis in CI, SSH + env-file-from-secrets for deploy) but have never executed — there's no GitHub remote with Actions enabled yet at the time they were written, and the deploy workflows target hosts that don't exist. The CI workflow's Postgres service config (`POSTGRES_USER: runner` + trust auth, chosen specifically to match this project's local setup with zero code changes) is the one piece worth double-checking first, since it's the one CI-specific assumption in an otherwise-standard workflow.
- **Live Paystack account resolution untested** — same shape as the payment-processor gap above: no `PAYSTACK_SECRET_KEY` in this environment, so `PaystackAccountVerificationProvider` is exercised against its own mock branch (§5.5), never against Paystack's real `/bank/resolve` endpoint. The request/response shape is implemented from Paystack's documented API contract, not verified against a live call.
- **Nigeria's LGA/ward data is a verified sample, not a complete dataset** — 37 states (all correct) but only Lagos + FCT have their LGAs seeded (26 of Nigeria's 774); no wards are seeded for any state, though the schema and seed-loader support them. See [Architecture doc §7.9](./ARCHITECTURE.md#79-country--administrative-division-hierarchy) for why this was a deliberate accuracy/effort tradeoff rather than an oversight.
- **Swagger response schemas are generic** — the CLI plugin infers request DTOs well, but response shapes aren't individually annotated per route (`@ApiResponse`), so `/api/docs` shows accurate request bodies and auth requirements but a loose/generic response schema. See [Architecture doc §1](./ARCHITECTURE.md#1-tech-stack) tech stack table.

---

*End of QA doc — Nawill App v1.0.*
