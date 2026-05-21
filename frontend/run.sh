#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Установка зависимостей..."
  npm install --legacy-peer-deps
fi

if [ ! -f ".env" ]; then
  echo "Копирую .env.example -> .env"
  cp .env.example .env
fi

echo "Запуск dev-сервера (Vite)..."
npm run dev
