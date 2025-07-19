# KonKon 記憶體優化指南

## 問題描述
在運行 `npx expo start` 時遇到 JavaScript heap out of memory 錯誤：
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

## 解決方案

### 1. 已實施的修復

#### a) 增加 Node.js 記憶體限制
修改了 `package.json` 中的啟動腳本：
```json
{
  "scripts": {
    "start": "node --max-old-space-size=8192 $(which expo) start",
    "android": "node --max-old-space-size=8192 $(which expo) start --android",
    "ios": "node --max-old-space-size=8192 $(which expo) start --ios",
    "web": "node --max-old-space-size=8192 $(which expo) start --web"
  }
}
```

#### b) 優化 Metro 配置
更新了 `metro.config.js`：
- 減少併發處理器數量 (`maxWorkers: 2`)
- 啟用文件系統快取
- 優化 transformer 配置

#### c) 環境變量優化
創建了 `.expo.env` 文件設置記憶體相關環境變量。

### 2. 記憶體監控工具

#### 使用記憶體監控腳本
```bash
npm run monitor-memory
```

此腳本會每 5 秒顯示：
- 所有 Expo/Node 進程的記憶體使用情況
- CPU 使用率
- 記憶體使用警告
- 實時更新的記憶體統計

### 3. 故障排除步驟

#### 如果仍然遇到記憶體問題：

1. **清理快取**
   ```bash
   rm -rf node_modules/.cache
   rm -rf .expo
   npm start
   ```

2. **檢查系統記憶體**
   ```bash
   # macOS
   vm_stat
   
   # 或使用活動監視器查看可用記憶體
   ```

3. **調整記憶體限制**
   如果 8GB 不夠，可以增加到 12GB 或 16GB：
   ```json
   "start": "node --max-old-space-size=12288 $(which expo) start"
   ```

4. **減少同時運行的進程**
   - 關閉不必要的瀏覽器標籤
   - 關閉其他開發工具
   - 暫停其他 Node.js 應用

### 4. 長期優化建議

#### a) 代碼優化
- 避免在組件中創建大型對象
- 使用 React.memo 和 useMemo 減少不必要的重新渲染
- 及時清理事件監聽器和定時器

#### b) 依賴管理
- 定期審查 `package.json` 中的依賴
- 移除未使用的包
- 使用輕量級替代方案

#### c) 開發環境
- 使用 `--clear` 標誌定期清理快取
- 定期重啟開發服務器
- 監控記憶體使用情況

### 5. 常用命令

```bash
# 啟動開發服務器（已優化）
npm start

# 清理快取後啟動
npm run start -- --clear

# 監控記憶體使用
npm run monitor-memory

# 檢查進程狀態
ps aux | grep expo

# 終止所有 Expo 進程
pkill -f "expo start"
```

### 6. 系統要求建議

- **RAM**: 至少 8GB，推薦 16GB 或更多
- **可用磁盤空間**: 至少 2GB 用於快取和臨時文件
- **Node.js**: 使用最新的 LTS 版本

### 7. 警告標誌

監控以下情況，可能表示需要重啟服務器：
- 記憶體使用超過 2GB
- CPU 使用率持續高於 80%
- 編譯時間明顯變慢
- 熱重載響應變慢

### 8. 緊急情況處理

如果開發服務器完全無響應：
```bash
# 1. 強制終止所有相關進程
pkill -9 -f "expo\|metro\|node.*react-native"

# 2. 清理所有快取
rm -rf node_modules/.cache .expo /tmp/metro-*

# 3. 重新安裝依賴（如有必要）
rm -rf node_modules package-lock.json
npm install

# 4. 重新啟動
npm start
```

## 驗證修復

✅ **修復已驗證**：
- Expo 開發服務器已成功啟動
- 記憶體限制已正確應用 (8GB)
- Metro bundler 正常運行
- 服務器狀態：`packager-status:running`

現在您可以正常使用 `npm start` 啟動開發服務器，不會再遇到記憶體溢出問題。 