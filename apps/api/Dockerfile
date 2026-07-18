# syntax=docker/dockerfile:1
# Build context is the monorepo root (see docker-compose.yml `build.context: .`),
# since this is a pnpm workspace — node_modules is hoisted at the repo root.

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm run build

FROM node:20-slim AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
WORKDIR /app/apps/api

EXPOSE 3000

# Migrate + seed (idempotent — see prisma/seed.ts) before serving. Seeding runs via
# ts-node (see package.json `prisma.seed`), so dev deps stay in the runtime image
# rather than adding a second compiled-seed build step — a deliberate size-for-
# simplicity tradeoff, same shape as scripts/seed_countries.py in spending-advisor.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/src/main.js"]
