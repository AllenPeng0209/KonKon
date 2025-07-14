const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 添加对 .lottie 文件的支持
config.resolver.assetExts.push('lottie');

// 添加 web 环境的 AsyncStorage 别名
config.resolver.alias = {
  ...config.resolver.alias,
  '@react-native-async-storage/async-storage': require.resolve('@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.js'),
};

// 添加 web 环境的 polyfill
config.resolver.platforms = ['web', 'ios', 'android'];

module.exports = config; 