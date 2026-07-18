.PHONY: help install dev dev-api dev-web build build-api build-web \
        test test-e2e migrate migrate-deploy seed studio adminer \
        docker-build docker-up docker-down docker-logs clean

help:
	@echo "Nawill App — common commands"
	@echo ""
	@echo "  make install          Install all workspace dependencies (pnpm)"
	@echo ""
	@echo "  make dev              Run the API in watch mode (alias of dev-api)"
	@echo "  make dev-api          Run the API in watch mode (needs local Postgres + Redis)"
	@echo "  make dev-web          Run the web app dev server (needs the API running)"
	@echo ""
	@echo "  make build            Build API + web"
	@echo "  make build-api        Build the API only"
	@echo "  make build-web        Build the web app only"
	@echo ""
	@echo "  make test             Run API unit tests"
	@echo "  make test-e2e         Run API e2e tests (disposable Postgres + Redis, see docs/QA.md)"
	@echo ""
	@echo "  make migrate          Create + apply a dev migration (prisma migrate dev)"
	@echo "  make migrate-deploy   Apply pending migrations non-interactively (prisma migrate deploy)"
	@echo "  make seed             Run the idempotent seed script"
	@echo "  make studio           Open Prisma Studio against the dev database"
	@echo "  make adminer          Serve Adminer at http://localhost:8080 (needs php on PATH)"
	@echo ""
	@echo "  make docker-build     Build the API's Docker image"
	@echo "  make docker-up        Run the full stack (api + postgres + redis) via Docker Compose"
	@echo "  make docker-down      Stop the Docker Compose stack"
	@echo "  make docker-logs      Tail logs from the Docker Compose stack"
	@echo ""
	@echo "  make clean            Remove build output and node_modules across the workspace"

install:
	pnpm install

dev: dev-api

dev-api:
	pnpm --filter @nawill/api start:dev

dev-web:
	pnpm --filter @nawill/web dev

build: build-api build-web

build-api:
	pnpm --filter @nawill/api build

build-web:
	pnpm --filter @nawill/web build

test:
	pnpm --filter @nawill/api test

test-e2e:
	pnpm --filter @nawill/api test:e2e

migrate:
	pnpm --filter @nawill/api prisma:migrate

migrate-deploy:
	pnpm --filter @nawill/api prisma:deploy

seed:
	pnpm --filter @nawill/api prisma:seed

studio:
	pnpm --filter @nawill/api exec prisma studio

adminer:
	@command -v php >/dev/null 2>&1 || { echo "php not found on PATH — install it first (brew install php)"; exit 1; }
	@echo "Adminer running at http://localhost:8080 — Ctrl+C to stop"
	@echo "System: PostgreSQL · Server: localhost · Username: $$(whoami) · Password: (leave blank) · Database: nawill_dev"
	php -S localhost:8080 -t tools/adminer

docker-build:
	docker compose build

docker-up:
	docker compose up

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

clean:
	rm -rf node_modules apps/api/node_modules apps/api/dist apps/api/coverage apps/web/node_modules apps/web/.next
