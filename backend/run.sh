#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

echo "Installing dependencies..."
pip install -q -r requirements.txt

echo "Starting postgres and redis..."
docker compose up -d postgres redis

echo "Waiting for services..."
sleep 2

echo "Running migrations..."
if [ -z "$(ls -A alembic/versions/ 2>/dev/null)" ]; then
    PYTHONPATH=. alembic revision --autogenerate -m "initial"
fi
PYTHONPATH=. alembic upgrade head

echo ""
echo "Starting dev server at http://localhost:8000/docs"
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
