#!/usr/bin/env bash
# Запуск на сервере после ssh, из клонированного репозитория:
#   ./scripts/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

git pull origin main
npm ci
npm run build
pm2 restart smmplaner
