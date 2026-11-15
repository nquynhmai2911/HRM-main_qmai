const { spawn, execSync } = require('child_process');
const path = require('path');
const net = require('net');
const fs = require('fs');

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

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
  if (isWin) {
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
  } else {
    try {
      const stdout = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
      const pids = stdout.trim().split('\n').filter(Boolean);
      for (const pid of pids) {
        if (!isNaN(pid)) {
          console.log(`[Dọn dẹp] Giải phóng cổng ${port} (PID ${pid})...`);
          try {
            process.kill(Number(pid), 'SIGKILL');
          } catch (_) {}
        }
      }
    } catch (_) {
      // Port is already free
    }
  }
}

console.log('[1/3] Đang kiểm tra và giải phóng cổng 3002 & 5174...');
freePort(3002);
freePort(5174);

// Wait briefly for ports to clear
function sleep(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch (_) {
    const end = Date.now() + ms;
    while (Date.now() < end) {}
  }
}
sleep(1000);

// 2. Start API & Web with auto-recovery
let apiProcess = null;
let webProcess = null;
let isCleaningUp = false;

function startApi() {
  freePort(3002);
  console.log('[2/3] Đang khởi động Backend API (Port 3002)...');
  const cmd = isWin ? 'cmd.exe' : 'npm';
  const args = isWin ? ['/c', 'npm run dev'] : ['run', 'dev'];

  apiProcess = spawn(cmd, args, {
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
  const cmd = isWin ? 'cmd.exe' : 'npm';
  const args = isWin ? ['/c', 'npm run dev'] : ['run', 'dev'];

  webProcess = spawn(cmd, args, {
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
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\nĐang tắt hệ thống HRM...');
  try {
    if (apiProcess && apiProcess.pid) {
      if (isWin) {
        execSync(`taskkill /F /T /PID ${apiProcess.pid}`, { stdio: 'ignore' });
      } else {
        process.kill(apiProcess.pid, 'SIGKILL');
      }
    }
    if (webProcess && webProcess.pid) {
      if (isWin) {
        execSync(`taskkill /F /T /PID ${webProcess.pid}`, { stdio: 'ignore' });
      } else {
        process.kill(webProcess.pid, 'SIGKILL');
      }
    }
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
      const openCmd = isWin ? 'start http://localhost:5174' : (isMac ? 'open http://localhost:5174' : 'xdg-open http://localhost:5174');
      execSync(openCmd, { stdio: 'ignore' });
    } catch (_) {}
  });

  client.on('error', () => {
    if (attempts >= 40) {
      clearInterval(checkInterval);
      console.log('Không thể kết nối đến http://localhost:5174 sau 40 giây.');
    }
  });
}, 800);
