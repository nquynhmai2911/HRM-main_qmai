@echo off
chcp 65001 >nul
title HRM - Chay Website (Port 3002 & 5174)
color 0B
echo ========================================================
echo         DTS-HRM - KHOI DONG (PORT 3002 & 5174)
echo ========================================================
echo.

set "BASE_DIR=C:\Users\PC\Downloads\HRM-main\HRM-main"
if exist "%~dp0apps\api" set "BASE_DIR=%~dp0"

echo [1/2] Dang khoi dong Backend API o cong 3002...
start "HRM Backend API (Port 3002)" /d "%BASE_DIR%\apps\api" cmd /k "npm run dev"

echo [2/2] Dang khoi dong Frontend Web o cong 5174...
start "HRM Frontend Web (Port 5174)" /d "%BASE_DIR%\apps\web" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul
start http://localhost:5174
echo Da mo http://localhost:5174
