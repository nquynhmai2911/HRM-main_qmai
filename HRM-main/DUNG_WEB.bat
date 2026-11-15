@echo off
chcp 65001 >nul
title HRM - Dừng Website
color 0C

echo ========================================================
echo         DTS-HRM - DỪNG HỆ THỐNG
echo ========================================================
echo.
echo Đang tắt các tiến trình và đóng các cửa sổ dịch vụ...

taskkill /F /FI "WINDOWTITLE eq HRM Backend API*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq HRM Frontend Web*" >nul 2>&1

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /T /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /T /PID %%a >nul 2>&1
)

:: Chờ 1 giây giải phóng cổng
timeout /t 1 /nobreak >nul

echo.
echo [ĐÃ XONG] Toàn bộ hệ thống HRM đã được dừng an toàn.
echo Cổng 3002 và 5174 đã được giải phóng hoàn toàn!
echo.
timeout /t 3
