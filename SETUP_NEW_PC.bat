@echo off
title ShopEase POS - First-Time Computer Setup
color 0A
cls

echo =====================================================================
echo            🛍️  SHOPEASE POS — First-Time Computer Setup
echo =====================================================================
echo.
echo Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ❌ Node.js is not installed on this computer!
    echo  Please install Node.js from the included installer or from https://nodejs.org
    echo  Then run this setup file again.
    echo.
    pause
    exit /b
)

echo  ✅ Node.js is installed!
echo.
echo  Preparing local offline retail system...
cd /d "%~dp0"

echo  Checking production assets...
if not exist "frontend\dist\index.html" (
    echo  Building offline web terminal...
    call npm run build
)

echo.
echo =====================================================================
echo  🎉 Setup Complete!
echo  Double-click "START_SHOPEASE_POS.bat" to start billing!
echo =====================================================================
echo.
pause
