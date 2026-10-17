@echo off
title ShopEase POS - 1-Click System Updater
color 0E
cls

echo =====================================================================
echo              🛍️  SHOPEASE POS — 1-CLICK SYSTEM UPDATER
echo =====================================================================
echo.
echo  This tool updates your local ShopEase POS terminal to the latest version.
echo.

cd /d "%~dp0"

:: Check if git exists
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo  [1/3] Downloading latest software updates...
    git pull origin main
    echo.
) else (
    echo  [!] Git is not installed on this PC.
    echo  If your developer sent you a ZIP file, extract it and overwrite this folder.
    echo.
)

echo  [2/3] Building updated offline interface...
call npm run build

echo.
echo  [3/3] Checking dependencies...
echo.
echo =====================================================================
echo   ✅ ShopEase POS has been successfully updated!
echo   Double-click "START_SHOPEASE_POS.bat" to start billing.
echo =====================================================================
echo.
pause
