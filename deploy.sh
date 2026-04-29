#!/bin/bash

# Drift Sense Production Deployment Script (Non-Docker)
# This script builds the frontend and starts the backend server.

set -e

echo "🚀 Starting Production Deployment..."

# 1. Build Frontend
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Setup Backend
echo "🐍 Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 3. Start Application
echo "✨ Deployment Ready!"
echo "📡 Starting server on http://localhost:8000"

cd backend
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:.
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
