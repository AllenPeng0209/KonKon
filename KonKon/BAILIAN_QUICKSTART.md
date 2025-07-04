# 🚀 阿里百炼快速入门

## 快速配置步骤

### 1. 获取API密钥
1. 访问 [阿里百炼控制台](https://bailian.console.aliyun.com/)
2. 创建应用并获取：
   - API Key
   - Workspace ID

### 2. 配置环境变量
```bash
# 复制示例文件
cp .env.example .env.local

# 编辑配置文件
# EXPO_PUBLIC_BAILIAN_API_KEY=你的API密钥
# EXPO_PUBLIC_BAILIAN_ENDPOINT=https://dashscope.aliyuncs.com
# EXPO_PUBLIC_BAILIAN_WORKSPACE_ID=你的工作空间ID
```

### 3. 测试连接
```bash
npm run test-bailian
```

### 4. 启动应用
```bash
npm start
```

## 🎯 功能特性

- ✅ 智能对话：支持上下文理解
- ✅ 中文优化：专门为中文用户优化
- ✅ 消费分析：理财和记账建议
- ✅ 流畅体验：优化的用户界面

## 📱 使用方法

1. 打开应用
2. 切换到"洞察"标签
3. 输入消息或选择建议问题
4. 开始与AI对话

## 🔧 故障排除

### 常见问题

**Q: 提示配置错误**
- 检查 `.env.local` 文件是否存在
- 确认API密钥格式正确
- 重启开发服务器

**Q: 无法连接API**
- 运行 `npm run test-bailian` 测试连接
- 检查网络连接
- 验证API密钥有效性

**Q: 聊天无响应**
- 查看控制台错误信息
- 检查API使用配额
- 确认模型配置正确

## 💡 高级配置

### 修改AI模型
在 `lib/bailian.ts` 中修改：
```typescript
model: 'qwen-plus' // 或 qwen-max
```

### 调整响应参数
```typescript
parameters: {
  max_tokens: 1500,      // 增加响应长度
  temperature: 0.8,      // 调整创造性
  top_p: 0.9,           // 调整随机性
}
```

## 📋 支持文档

- [详细配置指南](docs/阿里百炼配置指南.md)
- [阿里百炼官方文档](https://help.aliyun.com/document_detail/2712576.html)

---

�� 配置完成后即可体验智能AI聊天功能！ 