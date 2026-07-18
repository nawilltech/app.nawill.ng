# syntax=docker/dockerfile:1
# Build context is the monorepo root (pnpm workspace — node_modules hoisted at root),
# same reasoning as apps/api/Dockerfile.

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY apps/web apps/web
WORKDIR /app/apps/web
# NAWILL_API_URL is baked in at build time for anything Next.js prerenders; the
# actual runtime value is still read from the environment for server-only code
# (Route Handlers, Server Actions) — see docs/ARCHITECTURE.md §8.
ARG NAWILL_API_URL
ENV NAWILL_API_URL=${NAWILL_API_URL}
RUN pnpm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Next.js standalone output already contains only the node_modules it needs —
# no separate node_modules copy from deps required, unlike the API image.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
