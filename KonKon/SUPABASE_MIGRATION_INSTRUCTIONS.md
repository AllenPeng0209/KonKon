# Supabase 數據庫遷移說明

## 當前問題
應用顯示錯誤：`Error fetching memories: {"code":"PGRST200",...`

這是因為新的數據庫結構（點讚、評論表）還沒有在 Supabase 中創建。

## 解決方案

### 方法1：在 Supabase Dashboard 執行遷移

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的項目
3. 進入 "SQL Editor"
4. 執行以下 SQL 代碼：

```sql
-- 創建回憶點讚表
CREATE TABLE IF NOT EXISTS memory_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES family_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, user_id)
);

-- 創建回憶評論表
CREATE TABLE IF NOT EXISTS memory_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES family_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES memory_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建回憶標籤表
CREATE TABLE IF NOT EXISTS memory_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES family_memories(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, tag_name)
);

-- 為family_memories表添加新字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='family_memories' AND column_name='likes_count') THEN
    ALTER TABLE family_memories ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='family_memories' AND column_name='comments_count') THEN
    ALTER TABLE family_memories ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='family_memories' AND column_name='views_count') THEN
    ALTER TABLE family_memories ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='family_memories' AND column_name='is_featured') THEN
    ALTER TABLE family_memories ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='family_memories' AND column_name='visibility') THEN
    ALTER TABLE family_memories ADD COLUMN visibility VARCHAR(20) DEFAULT 'family' CHECK (visibility IN ('private', 'family', 'public'));
  END IF;
END $$;

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_memory_likes_memory_id ON memory_likes(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_likes_user_id ON memory_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_comments_memory_id ON memory_comments(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_comments_user_id ON memory_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_tags_memory_id ON memory_tags(memory_id);
CREATE INDEX IF NOT EXISTS idx_family_memories_family_id_created_at ON family_memories(family_id, created_at DESC);

-- 創建觸發器函數
CREATE OR REPLACE FUNCTION update_memory_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE family_memories 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.memory_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE family_memories 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.memory_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_memory_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE family_memories 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.memory_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE family_memories 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.memory_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
DROP TRIGGER IF EXISTS trigger_update_memory_likes_count ON memory_likes;
CREATE TRIGGER trigger_update_memory_likes_count
  AFTER INSERT OR DELETE ON memory_likes
  FOR EACH ROW EXECUTE FUNCTION update_memory_likes_count();

DROP TRIGGER IF EXISTS trigger_update_memory_comments_count ON memory_comments;
CREATE TRIGGER trigger_update_memory_comments_count
  AFTER INSERT OR DELETE ON memory_comments
  FOR EACH ROW EXECUTE FUNCTION update_memory_comments_count();

-- 啟用 RLS
ALTER TABLE memory_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 策略
CREATE POLICY memory_likes_family_members ON memory_likes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_memories fm
      JOIN family_members fmem ON fm.family_id = fmem.family_id
      WHERE fm.id = memory_likes.memory_id 
      AND fmem.user_id = auth.uid()
    )
  );

CREATE POLICY memory_comments_family_members ON memory_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_memories fm
      JOIN family_members fmem ON fm.family_id = fmem.family_id
      WHERE fm.id = memory_comments.memory_id 
      AND fmem.user_id = auth.uid()
    )
  );

CREATE POLICY memory_tags_family_members ON memory_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_memories fm
      JOIN family_members fmem ON fm.family_id = fmem.family_id
      WHERE fm.id = memory_tags.memory_id 
      AND fmem.user_id = auth.uid()
    )
  );
```

### 方法2：使用 Supabase CLI (如果已安裝)

```bash
supabase db push
```

## 執行後

1. 重新啟動應用
2. 相簿功能應該正常工作
3. 可以測試點讚和評論功能

## 確認遷移成功

在 Supabase Dashboard 的 "Table Editor" 中，你應該會看到以下新表：
- `memory_likes`
- `memory_comments` 
- `memory_tags`

`family_memories` 表應該會有新的欄位：
- `likes_count`
- `comments_count`
- `views_count`
- `is_featured`
- `visibility`