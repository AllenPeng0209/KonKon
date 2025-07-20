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

// 優化記憶體使用
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// 減少併發處理以降低記憶體使用
config.maxWorkers = 2;

// 啟用快取以減少重複處理
/* config.cacheStores = [
  {
    type: 'FileStore',
    root: require('path').join(__dirname, 'node_modules', '.cache', 'metro'),
  },
]; */

module.exports = config; 