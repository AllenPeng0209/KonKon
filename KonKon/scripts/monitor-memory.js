#!/usr/bin/env node

/**
 * 記憶體監控腳本
 * 用於監控 Expo 開發服務器的記憶體使用情況
 */

const { exec } = require('child_process');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getMemoryUsage() {
  return new Promise((resolve, reject) => {
    exec('ps aux | grep "expo\\|node.*metro" | grep -v grep', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      const processes = stdout.split('\n').filter(line => line.trim());
      const memoryInfo = processes.map(line => {
        const parts = line.split(/\s+/);
        if (parts.length >= 11) {
          const pid = parts[1];
          const cpu = parts[2];
          const mem = parts[3];
          const vsz = parseInt(parts[4]) * 1024; // VSZ in KB, convert to bytes
          const rss = parseInt(parts[5]) * 1024; // RSS in KB, convert to bytes
          const command = parts.slice(10).join(' ');
          
          return {
            pid,
            cpu: parseFloat(cpu),
            memPercent: parseFloat(mem),
            vsz,
            rss,
            command: command.length > 80 ? command.substring(0, 80) + '...' : command
          };
        }
        return null;
      }).filter(Boolean);

      resolve(memoryInfo);
    });
  });
}

function displayMemoryInfo(processes) {
  console.clear();
  console.log('🔍 KonKon 記憶體監控 - ' + new Date().toLocaleTimeString());
  console.log('=' .repeat(120));
  
  if (processes.length === 0) {
    console.log('❌ 沒有找到運行中的 Expo/Node 進程');
    return;
  }

  console.log('PID\t\tCPU%\tMEM%\tVSZ\t\tRSS\t\t命令');
  console.log('-'.repeat(120));

  let totalRSS = 0;
  processes.forEach(proc => {
    totalRSS += proc.rss;
    console.log(`${proc.pid}\t\t${proc.cpu}%\t${proc.memPercent}%\t${formatBytes(proc.vsz)}\t${formatBytes(proc.rss)}\t${proc.command}`);
  });

  console.log('-'.repeat(120));
  console.log(`📊 總記憶體使用: ${formatBytes(totalRSS)}`);
  
  // 警告檢查
  const maxRSS = Math.max(...processes.map(p => p.rss));
  const maxMemPercent = Math.max(...processes.map(p => p.memPercent));
  
  if (maxRSS > 2 * 1024 * 1024 * 1024) { // 2GB
    console.log('⚠️  警告: 有進程使用超過 2GB 記憶體');
  }
  
  if (maxMemPercent > 15) {
    console.log('⚠️  警告: 有進程使用超過 15% 系統記憶體');
  }

  console.log('\n💡 提示:');
  console.log('- 按 Ctrl+C 停止監控');
  console.log('- 如果記憶體使用過高，可以重啟 Expo 服務器');
  console.log('- 使用 npm run start 啟動已優化的服務器');
}

async function monitor() {
  try {
    const processes = await getMemoryUsage();
    displayMemoryInfo(processes);
  } catch (error) {
    console.error('監控錯誤:', error.message);
  }
}

// 立即運行一次
monitor();

// 每 5 秒更新一次
const interval = setInterval(monitor, 5000);

// 優雅退出
process.on('SIGINT', () => {
  console.log('\n👋 停止記憶體監控');
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(interval);
  process.exit(0);
}); 