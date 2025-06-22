@echo off
echo 🚀 RecapMCP Professional Setup - Windows
echo ==========================================
echo.

echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Running complete setup automation...
call npm run setup
if errorlevel 1 (
    echo ❌ Setup failed
    pause
    exit /b 1
)

echo.
echo ✅ Setup complete! Next steps:
echo 1. Restart Claude Desktop application
echo 2. Ask Claude: "Can you give me a recap of my recent work?"
echo 3. Enjoy intelligent productivity insights!
echo.
pause
