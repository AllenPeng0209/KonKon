# KonKon 项目配置指南

## 🚀 快速开始

### 1. 配置Supabase

1. **创建Supabase项目**
   - 访问 [https://supabase.com](https://supabase.com)
   - 点击 "Start your project"
   - 登录或注册账户
   - 点击 "New Project"
   - 选择组织，输入项目名称（如"konkon"）
   - 输入数据库密码（请记住此密码）
   - 选择区域（推荐选择离日本最近的区域）
   - 点击 "Create new project"

2. **获取API密钥**
   - 项目创建完成后，进入项目仪表板
   - 在左侧菜单点击 "Settings" > "API"
   - 复制以下信息：
     - Project URL (项目URL)
     - anon public key (匿名公钥)

3. **创建环境配置文件**
   在项目根目录（KonKon文件夹）创建 `.env` 文件：
   
   ```bash
   # 在终端中执行
   touch .env
   ```
   
   然后在 `.env` 文件中添加以下内容：
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://swpiqeccfvaibdzfkayr.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGlxZWNjZnZhaWJkemZrYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjU3MDMsImV4cCI6MjA2Njg0MTcwM30.T0zOhdKdNPKt60zDI26Jaksrdnu2O1d2Ji0hAeH9uoU
   ```
   
   **注意：** 以上是KonKon项目的实际Supabase配置，已经包含完整的数据库结构。

### 2. 启用邮箱认证

1. 在Supabase仪表板中，转到 "Authentication" > "Settings"
2. 确保 "Enable email confirmations" 已启用
3. 配置邮件模板（可选）

### 3. 测试应用

#### 方法1：Web浏览器（推荐开始测试）
```bash
# 在终端中按 'w' 键，或者直接访问
open http://localhost:8081
```

#### 方法2：移动设备
1. 下载 Expo Go 应用
   - iOS: App Store 搜索 "Expo Go"
   - Android: Google Play 搜索 "Expo Go"
2. 扫描终端中显示的QR码

#### 方法3：模拟器
```bash
# iOS模拟器（需要安装Xcode）
# 在终端中按 'i' 键

# Android模拟器（需要安装Android Studio）
# 在终端中按 'a' 键
```

## 🧪 测试功能

### 测试用户注册
1. 在应用中点击"注册"
2. 输入有效的邮箱地址和密码（至少6个字符）
3. 确认密码
4. 点击"注册"按钮
5. 检查邮箱中的确认邮件
6. 点击邮件中的确认链接

### 测试用户登录
1. 注册并确认邮箱后
2. 在登录页面输入邮箱和密码
3. 点击"登录"按钮
4. 应该会看到欢迎页面，显示您的邮箱地址

## 🛠 开发工具

### 有用的快捷键
- `r` - 重新加载应用
- `j` - 打开开发者工具
- `m` - 切换开发菜单
- `shift+m` - 更多工具选项
- `o` - 在编辑器中打开项目代码

### 调试技巧
1. **查看日志**：终端会显示应用的日志输出
2. **Chrome DevTools**：按 `j` 打开浏览器调试工具
3. **重新加载**：如果遇到问题，按 `r` 重新加载应用

## ❗ 常见问题

### 问题1：无法连接到Supabase
**解决方案：**
- 检查 `.env` 文件是否存在且配置正确
- 确认项目URL和API密钥无误
- 重启开发服务器：`Ctrl+C` 然后重新运行 `npm start`

### 问题2：注册后收不到确认邮件
**解决方案：**
- 检查垃圾邮件文件夹
- 确认Supabase项目中已启用邮件确认
- 使用真实的邮箱地址

### 问题3：应用在模拟器中无法打开
**解决方案：**
- 先尝试Web版本：访问 http://localhost:8081
- 确认模拟器已正确安装和启动
- 尝试重启Expo服务器

## 📱 下一步开发

完成基础配置和测试后，您可以开始开发更多功能：

1. **创建日历组件**
2. **添加事件管理功能**
3. **实现家庭组功能**
4. **集成AI功能**

## 🆘 获取帮助

如果遇到问题，可以：
1. 查看 [Expo文档](https://docs.expo.dev/)
2. 查看 [Supabase文档](https://supabase.com/docs)
3. 检查终端中的错误信息
4. 重启开发服务器

---

**现在就开始体验您的KonKon应用吧！** 🎉 