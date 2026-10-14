@echo off
title ShopEase POS - Retail Billing Terminal
color 0B
cls

echo =====================================================================
echo                  🛍️  SHOPEASE POS RETAIL TERMINAL
echo               Retail Billing & Shop Management System
echo =====================================================================
echo.
echo  [1/2] Initializing Local Offline Server...
echo  [2/2] Opening POS Terminal in your Browser...
echo.

cd /d "%~dp0"

:: Start the backend server (serves both POS API and UI on port 5000)
start /min "ShopEase POS Server" cmd /c "node backend/server.js"

:: Wait 3 seconds for the local database and server to initialize
timeout /t 3 /nobreak >nul

:: Automatically launch default browser to the POS billing terminal
start http://localhost:5000/pos

echo.
echo  =====================================================================
echo   ✅ ShopEase POS is running successfully (100%% Offline)!
echo   👉 Terminal URL: http://localhost:5000
echo.
echo   NOTE: Keep this window minimized while billing in your shop.
echo   To shut down the terminal at the end of the day, close this window.
echo  =====================================================================
echo.
pause
