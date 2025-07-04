#!/usr/bin/env node

/**
 * 测试阿里百炼API连接
 * 运行: node scripts/test-bailian.js
 */

const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const API_KEY = process.env.EXPO_PUBLIC_BAILIAN_API_KEY;
const ENDPOINT = process.env.EXPO_PUBLIC_BAILIAN_ENDPOINT;
const WORKSPACE_ID = process.env.EXPO_PUBLIC_BAILIAN_WORKSPACE_ID;

console.log('🔍 测试阿里百炼API连接...\n');

// 检查环境变量
if (!API_KEY) {
  console.error('❌ 错误: EXPO_PUBLIC_BAILIAN_API_KEY 未设置');
  process.exit(1);
}

if (!ENDPOINT) {
  console.error('❌ 错误: EXPO_PUBLIC_BAILIAN_ENDPOINT 未设置');
  process.exit(1);
}

if (!WORKSPACE_ID) {
  console.error('❌ 错误: EXPO_PUBLIC_BAILIAN_WORKSPACE_ID 未设置');
  process.exit(1);
}

console.log('✅ 环境变量配置正确');
console.log(`   API Endpoint: ${ENDPOINT}`);
console.log(`   Workspace ID: ${WORKSPACE_ID}`);
console.log(`   API Key: ${API_KEY.substring(0, 8)}...`);
console.log('');

// 测试API调用
const testMessage = {
  model: 'qwen-turbo',
  input: {
    messages: [
      {
        role: 'user',
        content: '你好，这是一个测试消息。请简单回复。'
      }
    ]
  },
  parameters: {
    max_tokens: 100,
    temperature: 0.7
  }
};

const postData = JSON.stringify(testMessage);
const url = new URL(`${ENDPOINT}/api/v1/services/aigc/text-generation/generation`);

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('📡 发送测试请求...');

const req = https.request(options, (res) => {
  console.log(`📊 响应状态: ${res.statusCode}`);
  console.log(`📋 响应头: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📝 响应内容:');
    
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      
      if (response.output && response.output.text) {
        console.log('\n🎉 测试成功！');
        console.log(`🤖 AI回复: ${response.output.text}`);
      } else if (response.code) {
        console.log(`\n❌ API错误: ${response.code} - ${response.message}`);
      }
    } catch (e) {
      console.log('原始响应:', data);
      console.log(`\n❌ 解析响应失败: ${e.message}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ 请求错误: ${e.message}`);
});

req.write(postData);
req.end(); 