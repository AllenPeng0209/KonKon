# KonKon - 家庭共享日历应用

## 📱 项目概述
KonKon是一款专为日本家庭设计的智能共享日历应用，通过AI技术优化家庭成员间的日程协调与沟通体验。

## 🚀 快速开始

### 1. 环境准备
```bash
# 确保已安装Node.js (推荐 18.x 或更高版本)
node --version

# 安装Expo CLI
npm install -g @expo/cli
```

### 2. 项目设置
```bash
# 进入项目目录
cd KonKon

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 3. Supabase配置
1. 在 [Supabase](https://supabase.com) 创建新项目
2. 复制项目URL和匿名密钥
3. 创建 `.env` 文件并添加配置：
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 运行应用
```bash
# 在iOS模拟器中运行
npm run ios

# 在Android模拟器中运行
npm run android

# 在Web浏览器中运行
npm run web
```

## 📂 项目结构
```
KonKon/
├── app/                    # 应用路由和页面
│   ├── (tabs)/            # 底部Tab导航页面
│   │   ├── index.tsx      # 主页面
│   │   └── explore.tsx    # 探索页面
│   ├── login.tsx          # 登录页面
│   ├── register.tsx       # 注册页面
│   └── _layout.tsx        # 根布局
├── contexts/              # React Context
│   └── AuthContext.tsx    # 认证状态管理
├── lib/                   # 工具库
│   └── supabase.ts        # Supabase配置
├── screens/               # 屏幕组件（备用）
├── components/            # 公共组件
└── assets/               # 静态资源
```

## 🔧 技术栈

### 前端
- **框架**: Expo (React Native)
- **路由**: Expo Router
- **状态管理**: React Context (后续可升级为Redux Toolkit)
- **UI组件**: React Native内置组件
- **开发工具**: TypeScript, ESLint

### 后端
- **BaaS**: Supabase
- **数据库**: PostgreSQL
- **认证**: Supabase Auth
- **实时通信**: Supabase Realtime

## 🎯 当前功能状态

### ✅ 已完成
- [x] 项目基础架构搭建
- [x] Supabase集成和配置
- [x] 用户认证系统（注册/登录/退出）
- [x] 认证状态管理
- [x] 基础UI界面
- [x] 路由配置

### 🚧 开发中
- [ ] 日历视图组件
- [ ] 事件创建和管理
- [ ] 家庭组功能
- [ ] 实时数据同步

### 📋 待开发
- [ ] AI功能集成
- [ ] 推送通知
- [ ] 数据分析
- [ ] 高级协作功能

## 📝 开发指南

### 下一步开发建议

1. **创建日历组件**
   ```bash
   # 创建日历相关组件
   mkdir components/Calendar
   touch components/Calendar/CalendarView.tsx
   touch components/Calendar/EventCard.tsx
   ```

2. **设置数据库表结构**
   ```sql
   -- 在Supabase中创建以下表
   CREATE TABLE families (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     description TEXT,
     start_date TIMESTAMP WITH TIME ZONE NOT NULL,
     end_date TIMESTAMP WITH TIME ZONE,
     family_id UUID REFERENCES families(id),
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **安装额外的日历依赖**
   ```bash
   npm install react-native-calendars
   npm install date-fns
   ```

### 开发流程
1. 创建功能分支：`git checkout -b feature/calendar-view`
2. 开发和测试功能
3. 提交代码：`git commit -m "feat: add calendar view component"`
4. 合并到主分支：`git checkout main && git merge feature/calendar-view`

### 代码规范
- 使用TypeScript进行类型检查
- 组件名使用PascalCase
- 文件名使用camelCase
- 使用ESLint进行代码检查
- 提交信息遵循Conventional Commits规范

## 🔧 调试和测试

### 开发工具
- **Expo DevTools**: 在终端中按 `j` 打开开发者工具
- **React Native Debugger**: 独立的调试工具
- **Flipper**: Meta官方的移动应用调试平台

### 常见问题解决
1. **Supabase连接问题**
   - 检查环境变量是否正确设置
   - 确认Supabase项目状态和密钥有效性

2. **认证问题**
   - 确认Supabase Auth配置正确
   - 检查邮箱确认设置

3. **构建问题**
   - 清除缓存：`npx expo r -c`
   - 重新安装依赖：`rm -rf node_modules && npm install`

## 📚 相关文档
- [Expo文档](https://docs.expo.dev/)
- [React Native文档](https://reactnative.dev/)
- [Supabase文档](https://supabase.com/docs)
- [TypeScript文档](https://www.typescriptlang.org/docs/)

## 🤝 贡献指南
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 📄 许可证
本项目采用MIT许可证。

---

*最后更新时间: 2024年*
*项目版本: v0.1.0*
