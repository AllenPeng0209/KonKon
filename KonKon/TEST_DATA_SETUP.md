# 測試數據設置

如果你想快速測試家庭相簿功能，可以在 Supabase Dashboard 的 SQL Editor 中執行以下代碼來創建一些測試數據：

## 創建測試回憶數據

```sql
-- 插入測試家庭回憶（請替換 user_id 和 family_id 為實際值）
INSERT INTO family_memories (
  family_id, 
  user_id, 
  story, 
  image_urls, 
  location,
  tags,
  likes_count,
  comments_count,
  visibility
) VALUES 
(
  'your-family-id-here',  -- 替換為實際的 family_id
  'your-user-id-here',    -- 替換為實際的 user_id
  '今天和家人一起度過了美好的時光，孩子們玩得很開心！',
  '["https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400"]',
  '台北市信義區',
  '["家庭時光", "週末", "快樂"]',
  5,
  2,
  'family'
),
(
  'your-family-id-here',  -- 替換為實際的 family_id
  'your-user-id-here',    -- 替換為實際的 user_id
  '一起做晚餐，每個人都參與其中，溫馨的家庭時光。',
  '["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400", "https://images.unsplash.com/photo-1556909045-f552ce5be71c?w=400"]',
  '家中廚房',
  '["料理", "家庭", "溫馨"]',
  3,
  1,
  'family'
),
(
  'your-family-id-here',  -- 替換為實際的 family_id
  'your-user-id-here',    -- 替換為實際的 user_id
  '週末戶外踏青，享受大自然的美好。',
  '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"]',
  '陽明山國家公園',
  '["戶外", "踏青", "自然"]',
  8,
  4,
  'family'
);
```

## 獲取你的 ID

要獲取正確的 user_id 和 family_id，執行以下查詢：

```sql
-- 獲取用戶 ID
SELECT id, email FROM users LIMIT 5;

-- 獲取家庭 ID
SELECT id, name FROM families LIMIT 5;

-- 獲取家庭成員關係
SELECT fm.user_id, fm.family_id, f.name as family_name, u.email
FROM family_members fm 
JOIN families f ON fm.family_id = f.id 
JOIN users u ON fm.user_id = u.id;
```

## 注意事項

1. 請確保先執行數據庫遷移（參考 SUPABASE_MIGRATION_INSTRUCTIONS.md）
2. 替換示例中的 `your-family-id-here` 和 `your-user-id-here` 為實際值
3. 圖片URL使用的是 Unsplash 的示例圖片，你也可以使用自己的圖片URL

## 驗證數據

執行以下查詢來驗證測試數據是否成功插入：

```sql
SELECT 
  fm.*,
  f.name as family_name,
  u.email as user_email
FROM family_memories fm
JOIN families f ON fm.family_id = f.id
JOIN users u ON fm.user_id = u.id
ORDER BY fm.created_at DESC
LIMIT 10;
```