# 故障排除指南

## 问题1：无法找到 package.json 文件

### 症状
```
npm error code ENOENT
npm error path /Users/username/workdir/konkon/package.json
```

### 解决方案
确保你在正确的目录中运行命令。项目的 package.json 文件位于 `KonKon` 子目录中。

```bash
cd KonKon
npm start
```

## 问题2：AsyncStorage "window is not defined" 错误

### 症状
```
ReferenceError: window is not defined
at getValue (.../AsyncStorage.js:63:52)
```

### 解决方案
这个问题已通过以下文件修复：
- 创建了 `metro.config.js` 配置文件
- 创建了 `lib/asyncStorage.ts` 适配器
- 更新了 `lib/supabase.ts` 配置

### 启动项目的正确步骤

1. 进入项目目录：
```bash
cd KonKon
```

2. 安装依赖（如果还没有安装）：
```bash
npm install
```

3. 启动项目：
```bash
# 启动开发服务器
npm start

# 或者直接启动 web 版本
npm run web

# 或者启动 iOS 模拟器
npm run ios

# 或者启动 Android 模拟器
npm run android
```

## 配置 Supabase

在开始使用之前，请确保配置好 Supabase：

1. 创建 `.env` 文件（在 `KonKon` 目录中）：
```bash
touch .env
```

2. 添加你的 Supabase 配置：
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. 将实际的 Supabase URL 和 API 密钥替换到 `.env` 文件中

## 其他常见问题

### 清除缓存
如果遇到奇怪的错误，可以尝试清除缓存：
```bash
npm start -- --reset-cache
```

### 重置项目
如果需要重置项目到初始状态：
```bash
npm run reset-project
```

### 检查依赖
确保所有依赖都已正确安装：
```bash
npm install
```

### 端口冲突
如果 Metro 服务器端口被占用，可以指定不同的端口：
```bash
npm start -- --port 8082
``` 