#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 KonKon 内存监控器');
console.log('========================');

// 获取内存使用情况
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };
}

// 检查大文件
function checkLargeFiles() {
  const largeFiles = [];
  
  // 检查主要的大文件
  const filesToCheck = [
    'app/(tabs)/index.tsx',
    'lib/database.types.ts',
    'components/event/AddEventModal.tsx',
    'lib/bailian_omni_calendar.ts'
  ];
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const lines = fs.readFileSync(file, 'utf8').split('\n').length;
      if (lines > 500) {
        largeFiles.push({ file, lines, size: Math.round(stats.size / 1024) });
      }
    }
  });
  
  return largeFiles;
}

// 检查缓存大小
function checkCacheSize() {
  const cachePaths = ['.expo/cache', 'node_modules/.cache', '.metro'];
  const cacheInfo = [];
  
  cachePaths.forEach(cachePath => {
    if (fs.existsSync(cachePath)) {
      exec(`du -sh ${cachePath}`, (error, stdout) => {
        if (!error) {
          const size = stdout.split('\t')[0];
          cacheInfo.push({ path: cachePath, size });
        }
      });
    }
  });
  
  return cacheInfo;
}

// 主监控函数
function monitorMemory() {
  const memory = getMemoryUsage();
  const largeFiles = checkLargeFiles();
  
  console.log(`📊 当前内存使用:`);
  console.log(`   RSS: ${memory.rss}MB`);
  console.log(`   堆内存总量: ${memory.heapTotal}MB`);
  console.log(`   堆内存使用: ${memory.heapUsed}MB`);
  console.log(`   外部内存: ${memory.external}MB`);
  
  // 内存警告
  if (memory.heapUsed > 2000) {
    console.log('\n⚠️  内存使用过高警告!');
    console.log('   建议执行: npm run clean');
  }
  
  if (memory.heapUsed > 4000) {
    console.log('\n🚨 严重内存警告!');
    console.log('   建议执行: npm run clean:full');
  }
  
  // 大文件警告
  if (largeFiles.length > 0) {
    console.log('\n📄 发现大文件:');
    largeFiles.forEach(({ file, lines, size }) => {
      console.log(`   ${file}: ${lines} 行, ${size}KB`);
      if (lines > 1000) {
        console.log(`     ⚠️  建议拆分此文件`);
      }
    });
  }
  
  // 优化建议
  console.log('\n💡 优化建议:');
  console.log('   1. 定期运行: npm run clean');
  console.log('   2. 拆分大组件 (特别是 index.tsx)');
  console.log('   3. 使用 React.memo 和 useMemo 优化渲染');
  console.log('   4. 考虑懒加载不常用的组件');
}

// 启动监控
monitorMemory();

// 如果指定了持续监控
if (process.argv.includes('--watch')) {
  console.log('\n🔄 持续监控模式 (每30秒检查一次)...');
  setInterval(monitorMemory, 30000);
} 