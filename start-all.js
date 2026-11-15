const { spawn, execSync } = require('child_process');
const path = require('path');
const net = require('net');
const fs = require('fs');

const rootDir = __dirname;
// Support both HRM-main/apps and apps structure
let appsDir = path.join(rootDir, 'HRM-main', 'apps');
if (!fs.existsSync(appsDir)) {
  appsDir = path.join(rootDir, 'apps');
}

const apiDir = path.join(appsDir, 'api');
const webDir = path.join(appsDir, 'web');

console.log('====================================================');
console.log('         DTS-HRM - KHỞI ĐỘNG HỆ THỐNG');
console.log('====================================================\n');

// 1. Kill any existing processes holding port 3002 or 5174
function freePort(port) {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid) && parseInt(pid) > 0) {
        console.log(`[Dọn dẹp] Giải phóng cổng ${port} (PID ${pid})...`);
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
        } catch (_) {}
      }
    }
  } catch (_) {
    // Port is already free
  }
}

console.log('[1/3] Đang kiểm tra và giải phóng cổng 3002 & 5174...');
freePort(3002);
freePort(5174);

// Chờ giải phóng socket
try {
  execSync('timeout /t 1 /nobreak >nul 2>&1', { shell: true });
} catch (_) {}

// 2. Start API & Web with auto-recovery
let apiProcess = null;
let webProcess = null;

function startApi() {
  freePort(3002);
  console.log('[2/3] Đang khởi động Backend API (Port 3002)...');
  apiProcess = spawn('cmd.exe', ['/c', 'npm run dev'], {
    cwd: apiDir,
    stdio: 'inherit',
    shell: true,
  });
  apiProcess.on('exit', (code) => {
    if (!isCleaningUp && code !== 0 && code !== null) {
      console.log(`\n[Tự phục hồi] Backend API dừng (mã ${code}). Tự động khởi động lại sau 2s...`);
      setTimeout(startApi, 2000);
    }
  });
}

function startWeb() {
  freePort(5174);
  console.log('[3/3] Đang khởi động Frontend Web (Port 5174)...');
  webProcess = spawn('cmd.exe', ['/c', 'npm run dev'], {
    cwd: webDir,
    stdio: 'inherit',
    shell: true,
  });
  webProcess.on('exit', (code) => {
    if (!isCleaningUp && code !== 0 && code !== null) {
      console.log(`\n[Tự phục hồi] Frontend Web dừng (mã ${code}). Tự động khởi động lại sau 2s...`);
      setTimeout(startWeb, 2000);
    }
  });
}

startApi();
startWeb();

// Clean exit handler
let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\nĐang tắt hệ thống HRM...');
  try {
    if (apiProcess && apiProcess.pid) execSync(`taskkill /F /T /PID ${apiProcess.pid}`, { stdio: 'ignore' });
    if (webProcess && webProcess.pid) execSync(`taskkill /F /T /PID ${webProcess.pid}`, { stdio: 'ignore' });
  } catch (_) {}
  freePort(3002);
  freePort(5174);
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Poll for port 5174 to be ready before launching browser
let attempts = 0;
const checkInterval = setInterval(() => {
  attempts++;
  const client = net.createConnection(5174, '127.0.0.1', () => {
    client.end();
    clearInterval(checkInterval);
    console.log('\n====================================================');
    console.log('  HỆ THỐNG ĐÃ SẴN SÀNG!');
    console.log('  - Website:  http://localhost:5174');
    console.log('  - API docs: http://localhost:3002/api');
    console.log('  Nhấn Ctrl + C để dừng hệ thống.');
    console.log('====================================================\n');
    try {
      execSync('start http://localhost:5174', { stdio: 'ignore' });
    } catch (_) {}
  });

  client.on('error', () => {
    if (attempts >= 40) {
      clearInterval(checkInterval);
      console.log('Không thể kết nối đến http://localhost:5174 sau 40 giây.');
    }
  });
}, 800);
