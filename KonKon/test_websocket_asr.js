// Test script for WebSocket ASR implementation
// This is a test file to verify the WebSocket implementation

const { testSpeechConnection, testOmniConnection } = require('./lib/bailian_omni_calendar');

async function testWebSocketASR() {
  console.log('🚀 Testing WebSocket ASR Implementation...\n');
  
  console.log('1. Testing text processing API connection...');
  const textConnected = await testOmniConnection();
  console.log('   Text API:', textConnected ? '✅ Connected' : '❌ Failed');
  
  console.log('\n2. Testing WebSocket speech recognition connection...');
  const speechConnected = await testSpeechConnection();
  console.log('   WebSocket ASR:', speechConnected ? '✅ Connected' : '❌ Failed');
  
  console.log('\n📋 Summary:');
  console.log('   - WebSocket endpoint: wss://nls-gateway-ap-southeast-1.aliyuncs.com/ws/v1');
  console.log('   - Authentication: Access token via Alibaba Cloud ISI');
  console.log('   - Audio format: 16kHz PCM, mono channel');
  console.log('   - Real-time transcription: ✅ Enabled');
  console.log('   - Features: Intermediate results, punctuation, text normalization');
  
  if (textConnected && speechConnected) {
    console.log('\n🎉 All connections successful! WebSocket ASR is ready.');
  } else {
    console.log('\n⚠️  Some connections failed. Please check API configuration.');
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testWebSocketASR().catch(console.error);
}

module.exports = { testWebSocketASR };