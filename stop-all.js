const { execSync } = require('child_process');

const isWin = process.platform === 'win32';

console.log('====================================================');
console.log('         DTS-HRM - DỪNG HỆ THỐNG');
console.log('====================================================\n');

if (isWin) {
  try {
    execSync('taskkill /F /FI "WINDOWTITLE eq HRM Backend API*"', { stdio: 'ignore' });
    execSync('taskkill /F /FI "WINDOWTITLE eq HRM Frontend Web*"', { stdio: 'ignore' });
  } catch (_) {}
}

function freePort(port) {
  if (isWin) {
    try {
      const stdout = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && parseInt(pid) > 0) {
          console.log(`[Đã dừng] Đóng tiến trình cổng ${port} (PID ${pid})...`);
          try {
            execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
          } catch (_) {}
        }
      }
    } catch (_) {
      console.log(`Cổng ${port} đã được giải phóng.`);
    }
  } else {
    try {
      const stdout = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
      const pids = stdout.trim().split('\n').filter(Boolean);
      for (const pid of pids) {
        if (!isNaN(pid)) {
          console.log(`[Đã dừng] Đóng tiến trình cổng ${port} (PID ${pid})...`);
          try {
            process.kill(Number(pid), 'SIGKILL');
          } catch (_) {}
        }
      }
    } catch (_) {
      console.log(`Cổng ${port} đã được giải phóng.`);
    }
  }
}

freePort(3002);
freePort(5174);
console.log('\nĐã dừng hoàn toàn các dịch vụ (Port 3002 & 5174).');
