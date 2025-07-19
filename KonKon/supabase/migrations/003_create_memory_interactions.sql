-- 創建回憶點讚表
CREATE TABLE memory_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES family_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, user_id)
);

-- 創建回憶評論表
CREATE TABLE memory_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES family_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES memory_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建回憶標籤表
CREATE TABLE memory_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES family_memories(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, tag_name)
);

-- 為family_memories表添加新字段
ALTER TABLE family_memories 
ADD COLUMN likes_count INTEGER DEFAULT 0,
ADD COLUMN comments_count INTEGER DEFAULT 0,
ADD COLUMN views_count INTEGER DEFAULT 0,
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN visibility VARCHAR(20) DEFAULT 'family' CHECK (visibility IN ('private', 'family', 'public'));

-- 創建索引以提高查詢性能
CREATE INDEX idx_memory_likes_memory_id ON memory_likes(memory_id);
CREATE INDEX idx_memory_likes_user_id ON memory_likes(user_id);
CREATE INDEX idx_memory_comments_memory_id ON memory_comments(memory_id);
CREATE INDEX idx_memory_comments_user_id ON memory_comments(user_id);
CREATE INDEX idx_memory_comments_parent_id ON memory_comments(parent_comment_id);
CREATE INDEX idx_memory_tags_memory_id ON memory_tags(memory_id);
CREATE INDEX idx_family_memories_family_id_created_at ON family_memories(family_id, created_at DESC);

-- 創建觸發器函數來更新統計數據
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
CREATE TRIGGER trigger_update_memory_likes_count
  AFTER INSERT OR DELETE ON memory_likes
  FOR EACH ROW EXECUTE FUNCTION update_memory_likes_count();

CREATE TRIGGER trigger_update_memory_comments_count
  AFTER INSERT OR DELETE ON memory_comments
  FOR EACH ROW EXECUTE FUNCTION update_memory_comments_count();

-- 為評論創建更新時間戳觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_memory_comments_updated_at
  BEFORE UPDATE ON memory_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 策略
ALTER TABLE memory_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;

-- 點讚表的RLS策略
CREATE POLICY memory_likes_family_members ON memory_likes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_memories fm
      JOIN family_members fmem ON fm.family_id = fmem.family_id
      WHERE fm.id = memory_likes.memory_id 
      AND fmem.user_id = auth.uid()
    )
  );

-- 評論表的RLS策略
CREATE POLICY memory_comments_family_members ON memory_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_memories fm
      JOIN family_members fmem ON fm.family_id = fmem.family_id
      WHERE fm.id = memory_comments.memory_id 
      AND fmem.user_id = auth.uid()
    )
  );

-- 標籤表的RLS策略
CREATE POLICY memory_tags_family_members ON memory_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_memories fm
      JOIN family_members fmem ON fm.family_id = fmem.family_id
      WHERE fm.id = memory_tags.memory_id 
      AND fmem.user_id = auth.uid()
    )
  );