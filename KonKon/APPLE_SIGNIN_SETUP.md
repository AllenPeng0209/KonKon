# Apple 登录配置指南

## 1. Apple Developer 配置

### 1.1 创建 App ID
1. 登录 [Apple Developer Console](https://developer.apple.com/account/)
2. 进入 Certificates, Identifiers & Profiles
3. 点击 Identifiers，然后点击 "+"
4. 选择 "App IDs"，点击 Continue
5. 输入 Description（例如：KonKon App）
6. 输入 Bundle ID：`com.agenthub.konkon`
7. 在 Capabilities 中勾选 "Sign In with Apple"
8. 点击 Continue，然后点击 Register

### 1.2 创建 Service ID
1. 在 Identifiers 页面，点击 "+"
2. 选择 "Services IDs"，点击 Continue
3. 输入 Description（例如：KonKon Web Service）
4. 输入 Identifier（例如：`com.agenthub.konkon.service`）
5. 点击 Continue，然后点击 Register
6. 找到刚创建的 Service ID，点击进入配置
7. 勾选 "Sign In with Apple"
8. 点击 Configure
9. 在 Primary App ID 中选择之前创建的 App ID
10. 在 Web Domain 中输入您的域名（例如：`your-project.supabase.co`）
11. 在 Return URLs 中输入：`https://your-project.supabase.co/auth/v1/callback`
12. 点击 Save，然后点击 Continue，最后点击 Save

### 1.3 创建 Key
1. 在 Certificates, Identifiers & Profiles 页面，点击 Keys
2. 点击 "+"
3. 输入 Key Name（例如：KonKon Apple Sign In Key）
4. 勾选 "Sign In with Apple"
5. 点击 Configure
6. 选择之前创建的 Primary App ID
7. 点击 Save，然后点击 Continue，最后点击 Register
8. **重要**：下载 .p8 文件，这个文件只能下载一次
9. 记录下 Key ID

## 2. Supabase 配置

### 2.1 启用 Apple Provider
1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择您的项目
3. 进入 Authentication > Settings
4. 找到 Apple 部分，点击启用
5. 填入以下信息：
   - **Client ID**: 在 Apple Developer Console 中创建的 Service ID
   - **Client Secret**: 需要生成（见下一步）
   - **Redirect URL**: 自动填充，应该是 `https://your-project.supabase.co/auth/v1/callback`

### 2.2 生成 Client Secret
Apple 的 Client Secret 是一个 JWT Token，需要手动生成：

1. 使用以下信息创建 JWT：
   - **Header**:
     ```json
     {
       "alg": "ES256",
       "kid": "YOUR_KEY_ID"
     }
     ```
   - **Payload**:
     ```json
     {
       "iss": "YOUR_TEAM_ID",
       "iat": 1234567890,
       "exp": 1234567890,
       "aud": "https://appleid.apple.com",
       "sub": "YOUR_SERVICE_ID"
     }
     ```
   - **Signature**: 使用下载的 .p8 文件进行签名

2. 您可以使用在线工具或编程方式生成 JWT
3. 将生成的 JWT 作为 Client Secret 填入 Supabase

### 2.3 更新 Supabase 配置
在 Supabase 的 Authentication > Settings 中：
1. 确保 "Enable email confirmations" 根据需要设置
2. 确保 "Enable custom SMTP" 如果需要自定义邮件服务
3. 在 "Site URL" 中添加您的应用 URL

## 3. 应用配置

### 3.1 更新 EAS 配置
如果使用 EAS Build，需要更新 `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  }
}
```

### 3.2 构建应用
```bash
# 安装 EAS CLI
npm install -g @expo/eas-cli

# 登录 EAS
eas login

# 构建 iOS 应用
eas build --platform ios
```

## 4. 测试

### 4.1 iOS 设备要求
- 必须在真实的 iOS 设备上测试（模拟器不支持 Apple 登录）
- 设备必须运行 iOS 13.0 或更高版本
- 设备必须登录 Apple ID

### 4.2 测试步骤
1. 在 iOS 设备上安装应用
2. 点击 "Sign in with Apple" 按钮
3. 使用 Apple ID 登录
4. 验证用户信息是否正确保存在 Supabase

## 5. 故障排除

### 5.1 常见问题
- **"Invalid client"**: 检查 Service ID 是否正确配置
- **"Invalid redirect URI"**: 确保 Return URLs 正确设置
- **"Invalid client secret"**: 重新生成 JWT token
- **"Apple authentication is not available"**: 确保在真实设备上测试

### 5.2 调试提示
- 检查 Supabase 日志中的认证错误
- 确保所有 Apple Developer 配置都已保存
- 验证 JWT token 的有效性

## 6. 安全注意事项
- 定期更新 Client Secret（JWT token）
- 确保 .p8 文件的安全保存
- 监控认证日志以发现异常活动 