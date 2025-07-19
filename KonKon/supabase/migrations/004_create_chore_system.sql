-- 家務分配系統數據庫結構
-- 創建於 2025-07-19

-- 1. 家務模板表 (預定義的家務類型)
CREATE TABLE IF NOT EXISTS chore_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 清潔, 烹飪, 購物, 照顧, 維修, 其他
  estimated_duration INTEGER, -- 預估時間（分鐘）
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5), -- 難度等級 1-5
  required_tools TEXT[], -- 需要的工具
  instructions TEXT, -- 操作說明
  frequency_suggestion TEXT, -- 建議頻率 (daily, weekly, monthly, etc.)
  icon_name TEXT, -- 圖標名稱
  color TEXT, -- 顏色代碼
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 家務任務表 (實際分配的家務)
CREATE TABLE IF NOT EXISTS chore_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES chore_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  assigned_to UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  priority INTEGER CHECK (priority >= 1 AND priority <= 5) DEFAULT 3, -- 優先級 1-5
  estimated_duration INTEGER, -- 預估時間（分鐘）
  actual_duration INTEGER, -- 實際完成時間（分鐘）
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT, -- 完成備註
  photo_urls TEXT[], -- 完成照片
  points_reward INTEGER DEFAULT 0, -- 獎勵積分
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 家務分配規則表 (自動分配規則)
CREATE TABLE IF NOT EXISTS chore_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES chore_templates(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  assignment_type TEXT CHECK (assignment_type IN ('rotation', 'random', 'skill_based', 'availability_based', 'fixed')) NOT NULL,
  assignment_order UUID[], -- 輪值順序 (member ids)
  frequency TEXT NOT NULL, -- cron expression or simple frequency
  auto_assign BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 家務完成記錄表 (歷史記錄)
CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES chore_tasks(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  completion_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5), -- 質量評分
  time_taken INTEGER, -- 實際用時（分鐘）
  notes TEXT,
  photo_urls TEXT[],
  points_earned INTEGER DEFAULT 0,
  verified_by UUID REFERENCES family_members(id), -- 驗證者
  verified_at TIMESTAMP WITH TIME ZONE
);

-- 5. 家務技能表 (成員技能等級)
CREATE TABLE IF NOT EXISTS chore_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 5) DEFAULT 1, -- 技能等級 1-5
  experience_points INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, category)
);

-- 6. 家務積分表 (積分系統)
CREATE TABLE IF NOT EXISTS chore_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  task_id UUID REFERENCES chore_tasks(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  point_type TEXT CHECK (point_type IN ('earned', 'bonus', 'penalty', 'redeemed')) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 家務獎勵表 (積分兌換獎勵)
CREATE TABLE IF NOT EXISTS chore_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  reward_type TEXT CHECK (reward_type IN ('privilege', 'item', 'activity', 'money')) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 家務獎勵兌換記錄表
CREATE TABLE IF NOT EXISTS chore_reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES chore_rewards(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')) DEFAULT 'pending',
  approved_by UUID REFERENCES family_members(id),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_chore_tasks_family_id ON chore_tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_chore_tasks_assigned_to ON chore_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chore_tasks_status ON chore_tasks(status);
CREATE INDEX IF NOT EXISTS idx_chore_tasks_due_date ON chore_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_chore_completions_task_id ON chore_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_completed_by ON chore_completions(completed_by);
CREATE INDEX IF NOT EXISTS idx_chore_skills_member_id ON chore_skills(member_id);
CREATE INDEX IF NOT EXISTS idx_chore_points_member_id ON chore_points(member_id);

-- 創建更新觸發器
CREATE OR REPLACE FUNCTION update_chore_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chore_templates_updated_at
  BEFORE UPDATE ON chore_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_chore_updated_at();

CREATE TRIGGER update_chore_tasks_updated_at
  BEFORE UPDATE ON chore_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_chore_updated_at();

CREATE TRIGGER update_chore_assignment_rules_updated_at
  BEFORE UPDATE ON chore_assignment_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_chore_updated_at();

-- 插入基本家務模板數據
INSERT INTO chore_templates (name, description, category, estimated_duration, difficulty_level, required_tools, instructions, frequency_suggestion, icon_name, color) VALUES
-- 清潔類
('洗碗', '清洗餐具和廚具', '清潔', 15, 1, ARRAY['洗碗精', '海綿', '毛巾'], '1. 先用熱水沖洗\n2. 塗抹洗碗精\n3. 用海綿刷洗\n4. 清水沖淨\n5. 擦乾放置', 'daily', 'dish-washing', '#4FC3F7'),
('拖地', '清潔地板', '清潔', 20, 2, ARRAY['拖把', '水桶', '清潔劑'], '1. 掃除灰塵雜物\n2. 準備清潔水\n3. 拖洗地板\n4. 晾乾拖把', 'weekly', 'floor-mopping', '#66BB6A'),
('整理房間', '收拾和整理個人房間', '清潔', 30, 2, ARRAY[], '1. 收拾衣物\n2. 整理書桌\n3. 清理垃圾\n4. 吸塵或掃地', 'weekly', 'room-cleaning', '#FF7043'),
('洗衣服', '清洗家庭衣物', '清潔', 45, 2, ARRAY['洗衣精', '柔軟精'], '1. 分類衣物\n2. 設定洗衣機\n3. 添加洗劑\n4. 晾曬衣物', 'weekly', 'laundry', '#42A5F5'),

-- 烹飪類
('準備早餐', '為家人準備早餐', '烹飪', 25, 2, ARRAY['廚具', '食材'], '1. 準備食材\n2. 烹調食物\n3. 擺盤準備\n4. 清理廚房', 'daily', 'breakfast', '#FFA726'),
('準備晚餐', '為家人準備晚餐', '烹飪', 60, 3, ARRAY['廚具', '食材'], '1. 規劃菜單\n2. 準備食材\n3. 烹調料理\n4. 清理廚房', 'daily', 'dinner', '#FF7043'),
('洗蔬果', '清洗水果和蔬菜', '烹飪', 10, 1, ARRAY[], '1. 用清水沖洗\n2. 去除壞掉部分\n3. 分類存放', 'daily', 'wash-vegetables', '#66BB6A'),

-- 購物類
('採購日用品', '購買日常生活用品', '購物', 60, 2, ARRAY['購物清單', '錢包'], '1. 檢查需求清單\n2. 比較價格\n3. 選購商品\n4. 檢查收據', 'weekly', 'daily-shopping', '#9C27B0'),
('採購食材', '購買烹飪所需食材', '購物', 45, 2, ARRAY['購物清單', '錢包'], '1. 檢查冰箱存貨\n2. 列出需求清單\n3. 選購新鮮食材', 'weekly', 'grocery-shopping', '#4CAF50'),

-- 照顧類
('照顧寵物', '餵食和照顧家庭寵物', '照顧', 20, 2, ARRAY['寵物食品'], '1. 準備食物和水\n2. 清理寵物用品\n3. 陪伴玩耍', 'daily', 'pet-care', '#FF9800'),
('照顧植物', '澆水和照顧室內外植物', '照顧', 15, 1, ARRAY['澆水工具'], '1. 檢查土壤濕度\n2. 適量澆水\n3. 檢查植物健康', 'weekly', 'plant-care', '#4CAF50'),

-- 維修類
('修理物品', '修復損壞的家庭用品', '維修', 30, 4, ARRAY['工具箱'], '1. 檢查問題\n2. 準備工具\n3. 進行修理\n4. 測試功能', 'as_needed', 'repair', '#607D8B'),
('組裝家具', '組裝新購買的家具', '維修', 90, 4, ARRAY['工具箱', '說明書'], '1. 閱讀說明書\n2. 準備工具和零件\n3. 按步驟組裝\n4. 檢查穩固性', 'as_needed', 'furniture-assembly', '#795548'),

-- 其他類
('倒垃圾', '清理垃圾桶並倒垃圾', '其他', 10, 1, ARRAY['垃圾袋'], '1. 收集各房間垃圾\n2. 更換垃圾袋\n3. 送到垃圾收集點', 'daily', 'trash', '#757575'),
('收拾玩具', '整理和收納兒童玩具', '其他', 15, 1, ARRAY['收納箱'], '1. 收集散落玩具\n2. 分類整理\n3. 放入收納箱', 'daily', 'toy-cleanup', '#E91E63');