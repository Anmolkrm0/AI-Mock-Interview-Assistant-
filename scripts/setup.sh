#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  Setting up AI Mock Interview Platform   "
echo "=========================================="

# 1. Setup Backend
echo "--> Initializing Python Virtual Environment..."
if [ ! -d "backend/.venv" ]; then
  python3 -m venv backend/.venv
fi

echo "--> Installing Backend Dependencies..."
backend/.venv/bin/pip install --upgrade pip
backend/.venv/bin/pip install -r backend/requirements.txt

if [ ! -f "backend/.env" ]; then
  echo "--> Creating backend/.env from .env.example..."
  cp backend/.env.example backend/.env
fi

# 2. Setup Frontend
echo "--> Installing Frontend Dependencies..."
cd frontend
npm install
if [ ! -f ".env.local" ]; then
  echo "--> Creating frontend/.env.local from .env.example..."
  cp .env.example .env.local
fi
cd ..

echo "=========================================="
echo "Setup complete!"
echo "To run backend:  cd backend && source .venv/bin/activate && uvicorn backend.app.main:app --reload"
echo "To run frontend: cd frontend && npm run dev"
echo "=========================================="
