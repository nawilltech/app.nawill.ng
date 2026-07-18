# Nawill App

Client portal & operations platform for [Nawill Technology Ltd](https://nawill.ng) — the client dashboard and staff/admin backend that replaces the inquiry → project → invoice → payment → support lifecycle currently run over email/WhatsApp/Calendly.

This is a monorepo: a NestJS API (`apps/api`) and a Next.js client dashboard (`apps/web`).

**Full design docs live in [`docs/`](./docs):**

| Doc | Covers |
|---|---|
| [`docs/PRD.md`](./docs/PRD.md) | Functional requirements, actors, MVP scope |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Tech stack, database schema, module boundaries, frontend architecture |
| [`docs/TECHNICAL.md`](./docs/TECHNICAL.md) | API conventions, endpoint map, flow diagrams, deployment, branching/CI-CD |
| [`docs/QA.md`](./docs/QA.md) | Testing strategy, what's verified vs. known gaps |

If something here and something in `docs/` disagree, `docs/` is authoritative — this file is an entry point, not the source of truth.

## Quick Start

Needs: Node 20, pnpm 9, a local PostgreSQL server, a local Redis server.

```bash
make install                              # pnpm install, whole workspace
cp apps/api/.env.example apps/api/.env    # fill in DATABASE_URL etc.
cp apps/web/.env.local.example apps/web/.env.local
make migrate-deploy                       # apply migrations
make seed                                 # idempotent — countries, roles, services, super-admin, ...

make dev-api                              # terminal 1 — http://localhost:4000
make dev-web                              # terminal 2 — http://localhost:3000
```

Run `make help` for the full command list (tests, Prisma Studio, Docker, ...).

## Repo Structure

```
apps/
  api/     NestJS — auth, projects, invoices, payments, wallets, bank accounts,
           support, countries/administrative-divisions, analytics
  web/     Next.js (App Router) — the client dashboard
docs/      PRD, architecture, technical reference, QA — see table above
docker-compose.yml, apps/*/Dockerfile   Deployment (docs/TECHNICAL.md §6)
.github/workflows/                       CI + deploy (docs/TECHNICAL.md §8)
Makefile                                 make help
```

## Contributing

### Branching

- **`main`** is production. It only moves via a merged, reviewed pull request — direct pushes are blocked by branch protection.
- **`dev`** is the integration branch. All work lands here first. Not machine-enforced the way `main` is, but treat it the same way: branch off it, don't commit straight to it.

```
feat/<short-description>     new work
fix/<short-description>      a bug fix
hotfix/<short-description>   an urgent production bug — branches off main, not dev
```

Normal flow: branch off `dev` → PR into `dev` (CI must pass) → merge → repeat until `dev` is ready to ship → PR from `dev` into `main` → merge deploys to production.

Hotfix flow: branch off `main` → PR into `main` (deploys immediately once merged) → also merge the same fix into `dev` so the next normal release doesn't reintroduce it.

Full detail, including what CI runs and how deploys work: [`docs/TECHNICAL.md` §8](./docs/TECHNICAL.md#8-branching-model--cicd).

### Before opening a PR

```bash
make test          # API unit tests
make test-e2e       # API e2e tests — disposable Postgres + Redis, see docs/QA.md §3
make build          # both apps must build clean
```

CI runs the same checks; passing locally first just saves a round-trip.

### Conventions worth knowing before you write code

- **DRY, actually enforced** — before adding a new helper/pattern, check `common/` (API) or `components/`, `lib/` (web) for one that already does it. See `docs/ARCHITECTURE.md` §4 and §8.4 for the specific patterns already in place (shared access-control checks, one `ActionResult` shape for every form, etc.).
- **Money is always integer minor units** (kobo/cents), never floats — `docs/ARCHITECTURE.md` §4.5.
- **Soft deletes everywhere** (`deletedAt`), no hard deletes outside admin data-retention tooling.
- **Every response follows the standard envelope** (`{success, message, data, meta?}`) — `docs/TECHNICAL.md` §1.3.
- **Casing**: camelCase/PascalCase everywhere in application code. Existing Prisma enum values are the one intentional exception (kept `snake_case` on request) — new enum-like fields don't repeat that choice. See `docs/ARCHITECTURE.md` §4.

## License

Proprietary — © Nawill Technology Ltd (RC 1803154). All rights reserved.
