# 通知系統 UUID 錯誤修復總結

## 問題描述
應用中出現通知相關的錯誤：
```
ERROR: invalid input syntax for type uuid: "meta-space"
ERROR: Warning: Encountered two children with the same key
```

## 根本原因
1. **UUID 語法錯誤**：應用使用 `'meta-space'` 作為特殊的家庭空間標識符，但數據庫表的 `family_id` 字段為 UUID 類型，當查詢包含 `'meta-space'` 時 PostgreSQL 無法解析
2. **React Key 重複**：通知列表中存在重複的通知項，導致 FlatList 出現相同的 key 值警告

## 修復方案

### 1. hooks/useNotifications.ts
- 添加 `isValidFamilyId` 函數檢查家庭ID是否有效
- 當 `activeFamily.id` 是 `'meta-space'` 時跳過所有通知相關操作
- 在 meta-space 狀態下清空通知相關數據，避免顯示錯誤
- **新增去重邏輯**：在所有通知加載和更新中添加去重處理
- **修復實時訂閱**：確保實時通知不會重複添加
- **修復計數邏輯**：只有真正新增的未讀通知才會增加計數

### 2. lib/notificationService.ts
- 添加 UUID 驗證正則表達式和 `isValidUUID` 函數
- 在所有通知服務函數中添加 UUID 驗證
- 對於無效的 UUID，適當地返回默認值或拋出明確錯誤

## 修改的函數

### useNotifications hook:
- `loadNotifications`
- `loadMoreNotifications`
- `loadUnreadCount`
- `markAllAsRead`
- `loadPreferences`
- `updatePreferences`
- 初始化和訂閱邏輯

### notificationService:
- `createFamilyNotification`
- `createBatchFamilyNotifications`
- `getUnreadNotificationCount`
- `getNotificationPreferences`
- `updateNotificationPreferences`
- `markAllNotificationsAsRead`
- `subscribeToNotifications`

## 驗證結果
✅ UUID 驗證邏輯正確工作
✅ 'meta-space' 被正確識別為無效 UUID
✅ 通知功能在有效家庭中正常工作
✅ 切換到 meta-space 時不會產生錯誤
✅ 解決了 React Key 重複警告
✅ 通知列表不再出現重複項目
✅ 未讀計數準確性得到改善
✅ **事件創建通知現在會發送給所有家庭成員**
✅ **自動為新用戶創建默認通知偏好設置**
✅ **改進了推送通知的錯誤處理和日誌記錄**

## 影響
- 解決了通知相關的 UUID 語法錯誤
- 消除了 React Key 重複警告
- 保持了 meta-space 功能的正常運行
- 不影響正常家庭群組的通知功能
- 改善了通知列表的穩定性和性能
- 提供了更好的錯誤處理和用戶體驗
- **修復了事件創建通知發送給所有家庭成員的邏輯**
- **解決了通知偏好設置的 RLS 權限問題**
- **修復了 event_shares 表的無限遞歸 RLS 政策**

## 最終狀態
✅ **通知系統完全修復並正常工作**
✅ **家庭成員創建事件時會自動通知其他成員**
✅ **推送通知邏輯已優化（需要用戶授權推送權限）**
✅ **事件分享功能恢復正常**
✅ **修復跨月事件顯示問題**（前端時間範圍過濾導致8月1日游泳事件在7月份看不到）

## 跨月事件顯示修復
### 問題根因
- `useEvents` hook 中的 `expandRecurringEvents` 函數只顯示當前月份的事件
- 7/31 和 8/1 的游泳事件中，8/1 的事件在7月份查看時被過濾掉

### 解決方案
- 擴展時間範圍：當月前後各7天，確保跨月事件能正確顯示
- 添加 `forceRefreshEvents` 強制刷新功能，清除緩存並重新獲取事件
- 改進事件過濾邏輯，避免邊界日期的事件被遺漏 