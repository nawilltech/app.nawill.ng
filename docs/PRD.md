# Nawill App — Product Requirements Document (PRD)

**Company:** Nawill Technology Ltd (nawill.ng) · RC No. 1803154
**Document version:** 1.0 · **Date:** 18 July 2026
**Author:** Ushahemba Shir
**Status:** Draft for review

Companion docs: [Architecture & Database Schema](./ARCHITECTURE.md) · [Technical Docs & Flow Diagrams](./TECHNICAL.md)

---

## 1. Overview

### 1.1 Company Context

Nawill Technology Ltd (nawill.ng, Yaba, Lagos) is the technical partner for product founders who are past the idea stage — "Your Product. Our Team. Zero Compromise." The business runs on three service pillars:

| Pillar | Offering | Commercial model |
|---|---|---|
| **Build** | Dedicated development team — web apps, mobile apps, APIs, full platforms end-to-end | Project-based or ongoing retainer |
| **Consult** | Idea & product validation — market fit, technical feasibility, MVP scope, roadmap, stack recommendation | Charged per session |
| **Talent** | Technical hiring & team assembly from a vetted developer pool | Placement (one engineer or full team) |

Delivery process: Discovery call → proposal (team, scope, timeline, pricing) → milestone-based build, with support continuing beyond delivery (iteration, scaling, maintenance). Clients are both individuals (founders) and corporates, and budgets are quoted in NGN or USD. Today the funnel runs through the website inquiry form, Calendly, WhatsApp, and email.

### 1.2 What Nawill App Is

Nawill App is the client portal and operations platform that digitizes this entire lifecycle: it captures project inquiries from the website, onboards clients (individual or corporate), tracks projects from pre-project through delivery and maintenance with a transparent milestone/change history, issues invoices in NGN/USD, collects payments online, and provides structured support — replacing scattered email/WhatsApp threads with one dashboard for clients and one for staff. The testimonials on nawill.ng repeatedly praise responsiveness and on-time delivery; this platform is how that stays true as client volume grows.

### 1.3 Actors

| Actor | Description |
|---|---|
| **Client** | A founder (individual) or business (corporate) who signs up, tracks their projects, views/pays invoices, raises support tickets, books consultation sessions |
| **Staff** | Nawill team members (PMs, developers, finance, support) who manage projects, invoices, and tickets |
| **Admin** | Full access: analytics across all modules, staff management, configuration, blog/FAQ management |
| **System** | Scheduled jobs (webhook reconciliation, requery, alerts) and integrations (payment processors, email/WhatsApp) |

---

## 2. Functional Requirements

### 2.1 Client-facing

| ID | Requirement |
|---|---|
| FR-01 | Users can sign up with email, verify their email, and set up an account as an individual (founder) or corporate client — mirroring the website's client-type split. Passwords must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character. |
| FR-01b | A user locked out of their account by repeated failed logins (FR-01c) can recover access via "forgot password": request a reset link/token by email, then set a new password with it. Logged-in users can change their password directly by confirming their current one. |
| FR-01c | After 5 consecutive failed login attempts for an account, further login attempts are blocked for 15 minutes — even with the correct password — to slow down credential-stuffing/brute-force attempts. The counter resets on a successful login. |
| FR-01d | Users can enable two-factor authentication under account settings, choosing either an authenticator app (TOTP, e.g. Google/Microsoft Authenticator) or an email one-time code. Once enabled, login is a two-step process: password, then the second factor. Users can disable 2FA by re-confirming their password. |
| FR-02 | Users can update their profile (name, phone, avatar, organization details). |
| FR-03 | Corporate clients can complete business KYC (RC number, sector, head office, size range, documents); individual clients complete lightweight identity KYC. |
| FR-03b | Prospects can submit a project inquiry (from the website form or in-app): client type, project type (Website / Web App / Mobile App / API-Backend / Other), timeline, budget range (NGN/USD), description, preferred contact channel — creating a tracked lead that staff can convert into a project. |
| FR-04 | Users can view and track their projects, including current phase (pre-project → ongoing → post-project/maintenance), milestones (the "you stay in the loop at every milestone" promise), and change history. |
| FR-05 | Users can request a project status update (creates a tracked request routed to staff). |
| FR-05b | Users can view the accepted proposal attached to a project (scope, timeline, pricing) and book consultation sessions (per-session billed, Calendly link for scheduling initially). |
| FR-06 | Users can view invoices in NGN or USD, filter by status (paid, pending, cancelled), and see invoice line items. |
| FR-07 | Users can pay invoices online — a payment link is generated, processed via a payment processor, and the invoice auto-updates on successful payment. |
| FR-08 | Users can raise support tickets by type (Finance, Technical, Billing — failed payment), attach files, and track ticket progress to conclusion. |
| FR-09 | Users can access FAQ, documentation, and blog content. |
| FR-10 | Users can leave reviews / feedback on completed projects or services. |
| FR-23 | Users can load money into a personal wallet (NGN) via a payment processor, and view their current wallet balance and transaction history (credits/debits, running balance, status). |
| FR-24 | Users can pay an invoice using their wallet balance as an alternative to the processor payment link — instant, no processor round-trip — with the invoice auto-updating to paid on success and a clear error if the balance is insufficient. |
| FR-25 | Users can view a personal analytics overview (dashboard summary): project counts by phase, wallet balance, invoice totals by status (paid/pending/overdue) and outstanding amount, and support ticket counts by status — a single "at a glance" screen replacing the need to check each module separately. |
| FR-29 | Users can record one or more bank accounts against their profile, for cases where Nawill needs to pay them (refund, referral commission payout, contractor payment). Each account is verified by resolving the account name against the bank before it's trusted, and a user may mark one account as their default. |
| FR-30 | Users can browse a full country reference list (name, ISO2/ISO3, dial code, currency, capital, region) when filling forms that need one (onboarding, KYC, invoicing), and — where a country's administrative hierarchy is modeled (e.g. Nigeria) — drill from a top-level division (state) down through as many tiers as exist (local government, ward) for address-precision fields. |

### 2.2 Admin / Staff-facing

| ID | Requirement |
|---|---|
| FR-11 | Admin has a dashboard with overall system analytics: app performance, user activity, user analytics, project analytics, invoice analytics, payment analytics, wallet analytics (total float, funding volume, wallet-settled vs processor-settled invoice value). |
| FR-12 | Admin can manage staff (invite, assign roles, deactivate) with RBAC and well-defined roles. |
| FR-12b | Staff can manage the inquiry/lead pipeline: view incoming project inquiries, update lead status (new → contacted → proposal sent → won/lost), and convert a won inquiry into a client + project in one step. |
| FR-13 | Staff can create/update projects, define milestones, record project changes (with "changed by" audit trail), and update project phase. |
| FR-14 | Staff can create, read, update, and manage invoices and invoice items. |
| FR-15 | Staff/Admin can onboard and manage payment processors (Interswitch, Remita, Flutterwave, Paystack, etc.). |
| FR-16 | Staff can view, respond to, reassign, and close support tickets. |
| FR-17 | Admin can CRUD blog posts (seeded initially with FAQs); blog is admin-write, public-read. |
| FR-18 | Admin can manage the service catalogue (web development, mobile development, consultancy, domain, hosting, site maintenance, API integration). |
| FR-19 | All privileged actions are captured in an immutable change/audit log (id, domain, changed by, timestamp). |
| FR-26 | Finance/Admin can view any client's wallet and ledger, and record a manual adjustment (e.g. goodwill credit, correction) with a mandatory reason — captured in the audit log. |
| FR-31 | Admin can add countries and extend a country's administrative-division hierarchy (add a state, a local government under a state, a ward under that, and so on to any depth) without a code change — see [Architecture doc §7.9](./ARCHITECTURE.md#79-country--administrative-division-hierarchy). |

### 2.3 System

| ID | Requirement |
|---|---|
| FR-20 | The system receives payment webhooks, verifies signatures, reconciles them against payments, and requeries the processor for unresolved transactions. |
| FR-21 | The system manages file uploads (avatars, KYC docs, ticket attachments) with type/size validation. |
| FR-22 | The system sends transactional notifications (email first; extensible to SMS/WhatsApp). |
| FR-32 | The system verifies a bank account's registered name via Paystack before the account is marked verified/payout-eligible (FR-29). Every outbound call to a third party — payment processors, Paystack verification, and anything added later — lives in one dedicated external-services layer, so "what leaves our network" is auditable in one place. |

---

## 3. Non-Functional Requirements (Summary)

| # | Requirement | Target / Approach |
|---|---|---|
| NFR-01 | Structured logging | JSON-structured logs with correlation/request IDs; no PII in logs |
| NFR-02 | Health checks | `/health` reporting liveness + readiness of PostgreSQL, Redis, and each module |
| NFR-03 | Monitoring & alerting | Latency, error rate, throughput metrics; uptime monitoring; email/Slack alerts |
| NFR-04 | Availability | Aspirational 99.999%; committed SLO **99.9%** for MVP |
| NFR-05 | Consistency | Strong within transaction boundaries (payments/invoices); eventual elsewhere |
| NFR-06 | Latency | p95 < 300 ms reads, p95 < 800 ms writes (excluding third-party payment calls) |
| NFR-07 | Scalability | Stateless API, connection pooling, Redis caching, DB read replicas when needed |
| NFR-08 | Extensibility | Modular monolith → any module extractable to a microservice without API changes |
| NFR-09 | Usability | Responsive, mobile-first client dashboard, clear empty/error states, < 3 clicks to any core action |
| NFR-10 | Security | RBAC, JWT + refresh rotation, Redis-backed login lockout (5 fails → 15 min), optional TOTP/email 2FA, strong password policy, input validation, OWASP top-10 mitigations, encrypted secrets |
| NFR-11 | Auditability | Non-repudiable change log for all privileged mutations |
| NFR-12 | Data safety | Soft deletes everywhere (`deletedAt`); daily automated DB backups with restore runbook |

> **Honest note on 99.999%:** five nines = ~5.26 minutes of downtime/year, which realistically requires multi-region redundancy, zero-downtime everything, and 24/7 on-call. On a single hosting environment, 99.9% (≈ 8.7 h/year) is the achievable, honest SLO for MVP. The architecture is designed so availability can climb (LB + multiple app instances + managed HA Postgres) as revenue justifies it — see [Architecture doc](./ARCHITECTURE.md).

---

## 4. MVP Scope & Roadmap

### 4.1 MVP (Phase 1)

| Included | Notes |
|---|---|
| Signup / onboarding | Email signup + login, profile, individual/corporate client types, organization creation, strong password policy |
| Account security | Redis-backed login lockout (5 fails → 15 min); forgot/reset/change password; optional TOTP or email 2FA, settable under account settings |
| KYC | Organizations submit KYC document records; staff review → approve/reject, updating `Organization.kycStatus` |
| RBAC | Coarse `client`/`staff`/`admin` guard now; full `(domain, action)` permission matrix schema is in place for later — see [QA.md §7](./QA.md#7-known-gaps-explicitly-out-of-scope-for-this-pass) |
| Projects | Create/list/get/update phase (staff); list/get scoped to own organization (client) |
| Invoices — read + wallet pay | Clients view paid/pending invoices & items (creation staff-side, simple form); clients may settle an invoice instantly from wallet balance |
| Wallet | Fund via payment processor, view balance + ledger, pay invoices from balance; staff/admin can view any wallet and record manual adjustments |
| Customer analytics | `GET /analytics/me/overview` — project/invoice/wallet/ticket summary for the logged-in client |
| Support | Tickets + messages + seeded ticket types |
| Bank accounts | Add + Paystack-verify a payout account, list own, set default, remove; staff/admin actions deferred |
| Countries & hierarchy | 250-country reference table (currency, ISO codes, dial code, capital, region) + Nigeria's full state/LGA hierarchy as a working example of the generic, any-depth division model — see [Architecture doc §7.9](./ARCHITECTURE.md#79-country--administrative-division-hierarchy) |
| Ops baseline | Structured JSON logging (Pino, request-correlated), `/health`, audit log, Swagger/OpenAPI at `/api/docs` generated from the code |
| Web client | Fully built — Next.js App Router, cookie-based auth (incl. 2FA login step, forgot/reset password), and a real form or action behind every client-facing API capability: projects/invoices (view + pay both ways), wallet (fund + view), support (create + reply), organization + KYC submission, and settings (profile, password, 2FA setup incl. TOTP QR code, bank accounts). No admin UI — see [Architecture doc §8](./ARCHITECTURE.md#8-frontend-architecture). |
| Environments | Dev live locally against Postgres + Redis; Docker images + Compose stack for both apps (`apps/api/Dockerfile`, `apps/web/Dockerfile`, `docker-compose.yml`) — see [Technical doc §4](./TECHNICAL.md#4-environment-setup-dev--prod) |
| Branching & CI/CD | `dev` (base, all work lands here first) → `main` (production, PR-only, branch-protected); CI on every PR (`ci.yml`); push to `dev`/`main` deploys to the matching environment via SSH + secrets-to-`.env` (`deploy-dev.yml`/`deploy-prod.yml`) — see [Technical doc §8](./TECHNICAL.md#8-branching-model--cicd). Not yet exercised against real infrastructure — see [QA.md §7](./QA.md#7-known-gaps-explicitly-out-of-scope-for-this-pass). |

> This table reflects the actual build in this repository, not just the target design. A few items from the original Phase 1 scope were deliberately trimmed for this pass — email verification flow, milestones/change-history/status-request sub-resources, blog/FAQ, and file upload handling — in favor of going deep on the modules that carry money or access-control risk (auth, KYC, projects, invoices, support, payments, wallet). Nothing designed in the [Architecture doc](./ARCHITECTURE.md) was removed; these are sequencing choices, not scope cuts — see [QA.md §7](./QA.md#7-known-gaps-explicitly-out-of-scope-for-this-pass) for the full list.

### 4.2 Phase 2

Live payment processor keys (Paystack/Flutterwave/Interswitch/Remita) in place of the sandbox adapter · scheduled requery job for stuck payments · invoice PDFs & emails · admin analytics dashboards (incl. wallet float/funding analytics) · KYC review workflow · reviews/feedback · blog authoring.

> Payment link creation, webhook intake, signature verification, and synchronous reconciliation (for both invoice payments and wallet funding) ship in MVP against a mock/sandbox processor adapter — see [Architecture doc §7.5](./ARCHITECTURE.md#75-wallet--payments-relationship) and [Technical doc §3.1](./TECHNICAL.md#31-payments--wallet-idempotency-webhooks-reconciliation-requery). Only live processor credentials and the 15-minute requery cron are deferred to Phase 2.

### 4.3 Phase 3

Live chat support · notifications beyond email (in-app, WhatsApp) · third-party integrations (accounting, CRM) · read replicas / multi-instance scaling as usage grows · **referral program** (below).

#### Referral Program (structured now, not built)

| ID | Requirement |
|---|---|
| FR-27 | A client can generate a personal referral code/link, share it, and see the status of prospects they've referred (signed up → converted). |
| FR-28 | When a referred prospect's project converts to a paid invoice, the system computes a commission (percentage or fixed, per referral) for the referrer, payable — once approved by staff — as a wallet credit or bank transfer. |

This is deliberately **not** part of the MVP build. At the user's request it's modeled now rather than bolted on later: `ReferralCode`, `Referral`, and `ReferralCommission` tables exist in the schema ([Architecture doc §7.6](./ARCHITECTURE.md#76-referral-program-schema-only--phase-3)) and are included in migrations, but no service, controller, route, or test exists for them in this pass — there is nothing to call yet. When commission payout is built, `payoutMethod=wallet_credit` would post through the existing wallet ledger using the `adjustment` source (staff-recorded, per [Architecture doc §7.5](./ARCHITECTURE.md#75-wallet--payments-relationship)) unless a dedicated `wallet_transactions.source` value is added at that time.

---

*End of PRD — Nawill App v1.0.*
