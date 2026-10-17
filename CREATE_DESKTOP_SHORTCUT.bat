@echo off
title ShopEase POS - Desktop Shortcut Creator
color 0A
cls

echo =====================================================================
echo          🛍️  SHOPEASE POS — Desktop Shortcut Creator
echo =====================================================================
echo.
echo  Creating desktop shortcut for ShopEase POS Retail Terminal...
echo.

cd /d "%~dp0"
set "TARGET_BAT=%~dp0START_SHOPEASE_POS.bat"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\ShopEase POS.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_BAT%'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'ShopEase POS Retail Billing System'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo  =====================================================================
    echo   ✅ Success! Shortcut created on your Desktop:
    echo   👉 "%SHORTCUT_PATH%"
    echo.
    echo   You can now launch ShopEase POS directly from your Desktop anytime!
    echo  =====================================================================
) else (
    echo  [!] Could not create shortcut automatically. You can right-click
    echo      "START_SHOPEASE_POS.bat" and choose "Send to -> Desktop (create shortcut)".
)

echo.
pause
