#!/bin/bash
set -euo pipefail
cd /opt/apps/app.nawill.ng
git pull origin dev
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f
