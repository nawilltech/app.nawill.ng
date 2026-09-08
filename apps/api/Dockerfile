# syntax=docker/dockerfile:1
# Build context is the monorepo root (see docker-compose.yml `build.context: .`),
# since this is a pnpm workspace — node_modules is hoisted at the repo root.

FROM node:20-slim AS base
RUN corepack enable
# node:20-slim ships without OpenSSL, so Prisma can't detect a libssl version and
# silently falls back to a mismatched engine binary (openssl-1.1.x) — install it
# here so `prisma generate` (below) targets what's actually on the image.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
# --ignore-scripts: package.json's postinstall runs `prisma generate`, which needs
# prisma/schema.prisma — not copied into this stage yet (only the build stage has
# the full apps/api tree). The build stage runs `npx prisma generate` explicitly
# once that's available, so skipping it here just avoids a doomed postinstall.
RUN pnpm install --frozen-lockfile=false --ignore-scripts

FROM deps AS build
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm run build

FROM node:20-slim AS runtime
RUN corepack enable
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
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
