
# StoreKit 配置檢查清單

## ✅ 完成的配置
- [x] 安裝 react-native-iap
- [x] 創建 subscriptionService.ts
- [x] 創建 useSubscription hook
- [x] 更新訂閱頁面 UI

## ⏳ 需要完成的配置

### App Store Connect
- [ ] 創建應用（Bundle ID: com.agenthub.konkon）
- [ ] 創建月付訂閱產品 (com.agenthub.konkon.premium.monthly)
- [ ] 創建年付訂閱產品 (com.agenthub.konkon.premium.yearly)
- [ ] 設置訂閱群組
- [ ] 創建 App 專用共享密鑰
- [ ] 創建沙盒測試帳號

### 環境配置
- [ ] 添加 EXPO_PUBLIC_APP_STORE_SHARED_SECRET 到 .env
- [ ] 更新 Supabase 數據庫表結構
- [ ] 修復 subscriptionService.ts 中的類型錯誤

### 測試
- [ ] 在 iOS 設備上測試沙盒購買
- [ ] 測試購買流程
- [ ] 測試恢復購買
- [ ] 測試訂閱狀態同步

## 🚀 部署準備
- [ ] 配置生產環境收據驗證
- [ ] 設置 Webhook 處理訂閱事件
- [ ] 完成 App Store 審核準備

## 📞 遇到問題？
查看 STOREKIT_SETUP.md 獲取詳細說明
