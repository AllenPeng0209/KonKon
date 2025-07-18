#!/usr/bin/env node

/**
 * Apple Client Secret JWT Generator
 * 
 * 这个脚本帮助生成 Apple Sign In 所需的 Client Secret JWT
 * 
 * 使用方法:
 * node scripts/generate-apple-client-secret.js
 * 
 * 环境变量:
 * - APPLE_TEAM_ID: 你的苹果开发者团队ID
 * - APPLE_KEY_ID: 你的苹果签名密钥ID
 * - APPLE_SERVICE_ID: 你的苹果服务ID
 * - APPLE_PRIVATE_KEY_PATH: 你的苹果私钥文件路径(.p8文件)
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// 从环境变量或命令行参数获取配置
const config = {
  teamId: process.env.APPLE_TEAM_ID || process.argv[2],
  keyId: process.env.APPLE_KEY_ID || process.argv[3],
  serviceId: process.env.APPLE_SERVICE_ID || process.argv[4],
  privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH || process.argv[5]
};

function generateClientSecret() {
  try {
    // 验证所有必需的参数
    if (!config.teamId || !config.keyId || !config.serviceId || !config.privateKeyPath) {
      console.error('❌ 缺少必需的参数！');
      console.log('\n使用方法:');
      console.log('node scripts/generate-apple-client-secret.js <TEAM_ID> <KEY_ID> <SERVICE_ID> <PRIVATE_KEY_PATH>');
      console.log('\n或者设置环境变量:');
      console.log('export APPLE_TEAM_ID=your_team_id');
      console.log('export APPLE_KEY_ID=your_key_id');
      console.log('export APPLE_SERVICE_ID=your_service_id');
      console.log('export APPLE_PRIVATE_KEY_PATH=path/to/your/private_key.p8');
      console.log('node scripts/generate-apple-client-secret.js');
      process.exit(1);
    }

    // 检查私钥文件是否存在
    if (!fs.existsSync(config.privateKeyPath)) {
      console.error(`❌ 私钥文件不存在: ${config.privateKeyPath}`);
      process.exit(1);
    }

    // 读取私钥文件
    const privateKey = fs.readFileSync(config.privateKeyPath, 'utf8');

    // 设置 JWT 的有效期（6个月）
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (6 * 30 * 24 * 60 * 60); // 6个月后过期

    // 创建 JWT payload
    const payload = {
      iss: config.teamId,
      iat: now,
      exp: exp,
      aud: 'https://appleid.apple.com',
      sub: config.serviceId
    };

    // 创建 JWT header
    const header = {
      alg: 'ES256',
      kid: config.keyId
    };

    // 生成 JWT
    const clientSecret = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: header
    });

    // 输出结果
    console.log('✅ Apple Client Secret JWT 生成成功！');
    console.log('\n📋 配置信息:');
    console.log(`Team ID: ${config.teamId}`);
    console.log(`Key ID: ${config.keyId}`);
    console.log(`Service ID: ${config.serviceId}`);
    console.log(`有效期: ${new Date(exp * 1000).toLocaleDateString()}`);
    console.log('\n🔑 Client Secret:');
    console.log(clientSecret);
    console.log('\n📌 请将上面的 Client Secret 复制到 Supabase Dashboard 的 Apple 认证配置中');
    console.log('⚠️  注意：Client Secret 会在6个月后过期，需要重新生成');

    return clientSecret;

  } catch (error) {
    console.error('❌ 生成 Client Secret 失败:', error.message);
    console.log('\n💡 常见问题解决:');
    console.log('1. 确保私钥文件格式正确（.p8 文件）');
    console.log('2. 确认 Team ID、Key ID、Service ID 是否正确');
    console.log('3. 检查私钥文件是否有读取权限');
    process.exit(1);
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  generateClientSecret();
}

module.exports = { generateClientSecret }; 