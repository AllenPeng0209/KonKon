# KonKon App

这是一个基于 React Native 和 Expo 的记账应用，集成了 AI 聊天功能。

## 功能特性

- 📱 现代化的 React Native 界面
- 🤖 AI 聊天助手，帮助分析消费习惯
- 📊 智能洞察和建议
- 🔐 用户认证和数据安全
- 💾 Supabase 后端支持

## 环境配置

1. 复制 `.env.example` 文件为 `.env.local`
2. 配置以下环境变量：

```env
# Supabase 配置
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 阿里百炼 API 配置
EXPO_PUBLIC_BAILIAN_API_KEY=your_bailian_api_key
EXPO_PUBLIC_BAILIAN_ENDPOINT=https://dashscope.aliyuncs.com
EXPO_PUBLIC_BAILIAN_WORKSPACE_ID=your_workspace_id
```

### 获取阿里百炼 API Key

1. 访问 [阿里百炼控制台](https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=https%3A%2F%2Fhelp.aliyun.com%2Fdocument_detail%2F2712576.html)
2. 创建应用并获取 API Key 和 Workspace ID
3. 将 API Key 和相关配置添加到环境变量中

📋 **快速入门**：查看 [阿里百炼快速入门](BAILIAN_QUICKSTART.md)  
📋 **详细配置指南**：请参考 [阿里百炼配置指南](docs/阿里百炼配置指南.md)

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm start
```

3. 在 Expo Go 应用中扫描二维码运行

## AI 聊天功能

洞察页面现在包含完整的 AI 聊天功能：

- **智能对话**：与 AI 助手进行自然对话
- **消费分析**：获取个性化的消费建议
- **快速建议**：预设的常用问题快速开始对话
- **流畅体验**：优化的键盘交互和动画效果

## 技术栈

- **React Native**: 跨平台移动应用开发
- **Expo**: 开发工具和平台
- **Supabase**: 后端即服务
- **阿里百炼**: AI 聊天功能（通义千问模型）
- **React Native Reanimated**: 动画效果
- **TypeScript**: 类型安全

## 项目结构

```
KonKon/
├── app/                    # 应用页面
│   ├── (tabs)/            # 标签页
│   └── ...
├── components/            # 可复用组件
│   ├── chat/             # 聊天相关组件
│   └── ...
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具函数和配置
├── contexts/             # React Context
└── ...
```

## 开发说明

### 聊天功能架构

- `useChat` Hook: 管理聊天状态和阿里百炼 API 交互
- `ChatContainer`: 聊天界面容器
- `KeyboardFriendlyScrollView`: 键盘友好的滚动视图
- `ChatToolbar`: 输入工具栏
- `UserMessage` / `AssistantMessage`: 消息组件
- `FirstSuggestions`: 首次建议组件
- `AnimatedLogo`: 动画 Logo 组件

### 环境变量安全

- 使用 `EXPO_PUBLIC_` 前缀的环境变量会被包含在客户端构建中
- 确保 API Key 的安全性，考虑使用后端代理来调用阿里百炼 API
- 生产环境中建议通过 Supabase Edge Functions 来处理 AI 请求

## 许可证

MIT License
