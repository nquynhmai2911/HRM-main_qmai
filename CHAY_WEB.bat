@echo off
chcp 65001 >nul
title HRM - Chạy Website (API + Web)
color 0B

echo ========================================================
echo         DTS-HRM - KHỞI ĐỘNG HỆ THỐNG QUẢN LÝ
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Xác định thư mục mã nguồn
if exist "HRM-main\apps\api" (
    set "BASE_DIR=%~dp0HRM-main"
) else if exist "apps\api" (
    set "BASE_DIR=%~dp0"
) else (
    echo [LỖI] Không tìm thấy thư mục mã nguồn apps!
    pause
    exit /b 1
)

:: 2. Dọn dẹp tiến trình cũ và đóng cửa sổ trùng lặp
echo [1/3] Đang kiểm tra và giải phóng cổng 3002 & 5174...
taskkill /F /FI "WINDOWTITLE eq HRM Backend API*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq HRM Frontend Web*" >nul 2>&1

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /T /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /T /PID %%a >nul 2>&1
)

:: Chờ 2 giây để Windows giải phóng hoàn toàn socket
timeout /t 2 /nobreak >nul

:: 3. Khởi động Backend API
echo [2/3] Đang khởi động Backend API ở cổng 3002...
start "HRM Backend API (Port 3002)" /d "%BASE_DIR%\apps\api" cmd /k "npm run dev"

:: 4. Khởi động Frontend Web
echo [3/3] Đang khởi động Frontend Web ở cổng 5174...
start "HRM Frontend Web (Port 5174)" /d "%BASE_DIR%\apps\web" cmd /k "npm run dev"

echo.
echo Đang chờ website sẵn sàng trước khi mở trình duyệt...

:: 5. Chờ cổng 5174 thực sự lắng nghe (tối đa 30s)
node -e "const net=require('net');let count=0;function check(){const s=net.createConnection(5174,'127.0.0.1',()=>{s.end();process.exit(0);}).on('error',()=>{count++;if(count>=30){process.exit(1);}else{setTimeout(check,800);}});}check();" >nul 2>&1

echo.
echo Website đã sẵn sàng! Đang mở trình duyệt: http://localhost:5174 ...
start http://localhost:5174

echo.
echo ========================================================
echo   HỆ THỐNG ĐÃ KHỞI ĐỘNG THÀNH CÔNG!
echo   - Backend API: http://localhost:3002
echo   - Frontend Web: http://localhost:5174
echo.
echo   * Lưu ý: Giữ 2 cửa sổ đen đang mở để hệ thống hoạt động.
echo   * Khi muốn tắt web: chạy file DUNG_WEB.bat
echo ========================================================
echo.
pause
