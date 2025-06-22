#!/bin/bash

echo "🚀 RecapMCP Professional Setup - Mac/Linux"
echo "=========================================="
echo ""

# Exit on any error
set -e

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Running complete setup automation..."
npm run setup

echo ""
echo "✅ Setup complete! Next steps:"
echo "1. Restart Claude Desktop application"
echo "2. Ask Claude: 'Can you give me a recap of my recent work?'"
echo "3. Enjoy intelligent productivity insights!"
echo ""
echo "Press any key to continue..."
read -n 1 -s
