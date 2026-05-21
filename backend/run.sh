#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

echo "Starting postgres and redis..."
docker compose up -d postgres redis

echo "Waiting for services..."
sleep 2

echo "Running migrations..."
alembic upgrade head 2>/dev/null || echo "Skipping migrations (DB not ready or no migrations yet)"

echo ""
echo "Starting dev server at http://localhost:8000/docs"
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
