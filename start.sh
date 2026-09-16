#!/bin/bash
# mAifelZ AI Odoo Copilot — Frontend Startup Script

echo "🚀 Starting mAifelZ AI Odoo Copilot Frontend..."
cd "$(dirname "$0")"

# Install if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm packages..."
  npm install
fi

# Start dev server
echo "✅ Frontend starting at http://localhost:3000"
npm run dev
