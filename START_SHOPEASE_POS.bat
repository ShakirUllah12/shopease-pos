@echo off
title ShopEase POS - Retail Billing Terminal
color 0B
cls

echo =====================================================================
echo                  🛍️  SHOPEASE POS RETAIL TERMINAL
echo               Retail Billing & Shop Management System
echo =====================================================================
echo.

cd /d "%~dp0"

:: Check if production build exists
if not exist "frontend\dist\index.html" (
    echo  [!] Offline terminal assets not found. Compiling production bundle...
    call npm run build
)

echo  [1/2] Initializing Local Offline Server & Database...
start /min "ShopEase POS Server" cmd /c "node backend/server.js"

:: Wait 3 seconds for server to boot
timeout /t 3 /nobreak >nul

echo  [2/2] Opening POS Terminal in your Browser...
start http://localhost:5000/pos

echo.
echo  =====================================================================
echo   ✅ ShopEase POS is running successfully (100%% Offline)!
echo   👉 Terminal URL: http://localhost:5000
echo.
echo   Default Store Owner Login:
echo   • Username: owner
echo   • Password: Owner@123456
echo.
echo   NOTE: Keep this window minimized while billing in your shop.
echo   To shut down the terminal at the end of the day, close this window.
echo  =====================================================================
echo.
pause
