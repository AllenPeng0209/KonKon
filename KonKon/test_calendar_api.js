// 快速测试新的日程API配置
const { processTextToCalendar, testOmniConnection } = require('./lib/bailian_omni_calendar');

async function testAPI() {
  console.log('🧪 测试日程API连接...\n');
  
  try {
    // 测试连接
    console.log('1. 测试API连接状态...');
    const connected = await testOmniConnection();
    console.log(`连接状态: ${connected ? '✅ 成功' : '❌ 失败'}\n`);
    
    if (connected) {
      // 测试文字转日程
      console.log('2. 测试文字转日程功能...');
      const testText = '明天下午3点开会';
      console.log(`输入文本: "${testText}"`);
      
      const result = await processTextToCalendar(testText);
      console.log('解析结果:');
      console.log(`- 事件数量: ${result.events.length}`);
      console.log(`- 摘要: ${result.summary}`);
      console.log(`- 置信度: ${Math.round(result.confidence * 100)}%`);
      
      if (result.events.length > 0) {
        console.log('- 第一个事件:');
        const event = result.events[0];
        console.log(`  标题: ${event.title}`);
        console.log(`  开始时间: ${event.startTime}`);
        console.log(`  结束时间: ${event.endTime}`);
        console.log(`  置信度: ${Math.round(event.confidence * 100)}%`);
      }
      
      console.log('\n✅ 测试完成！日程API配置正常工作');
    } else {
      console.log('❌ API连接失败，请检查配置');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAPI();