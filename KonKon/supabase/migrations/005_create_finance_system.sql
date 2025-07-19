-- Family Finance System Migration
-- 005_create_finance_system.sql
-- Creates comprehensive database schema for family financial management

-- ========================================
-- 1. 財務帳戶表 (Finance Accounts)
-- ========================================
CREATE TABLE finance_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- 帳戶名稱（銀行帳戶、現金、信用卡等）
  type VARCHAR(20) NOT NULL CHECK (type IN ('bank', 'cash', 'credit_card', 'savings', 'investment', 'other')),
  currency VARCHAR(3) DEFAULT 'JPY', -- 貨幣代碼
  balance DECIMAL(12,2) DEFAULT 0, -- 帳戶餘額
  is_active BOOLEAN DEFAULT true, -- 是否啟用
  description TEXT, -- 帳戶描述
  bank_name VARCHAR(100), -- 銀行名稱
  account_number VARCHAR(50), -- 帳戶號碼（加密存儲）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. 財務分類表 (Finance Categories)
-- ========================================
CREATE TABLE finance_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES finance_categories(id) ON DELETE CASCADE, -- 支持層級分類
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')), -- 收入或支出
  color VARCHAR(7) DEFAULT '#3B82F6', -- 分類顏色
  icon VARCHAR(50), -- 圖標名稱
  is_system BOOLEAN DEFAULT false, -- 是否為系統預設分類
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. 財務交易表 (Finance Transactions) - 核心記帳功能
-- ========================================
CREATE TABLE finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES finance_categories(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL, -- 金額
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')), -- 交易類型
  description TEXT, -- 交易描述
  notes TEXT, -- 備註
  transaction_date DATE NOT NULL, -- 交易日期
  receipt_url TEXT, -- 收據圖片URL
  tags VARCHAR(255), -- 標籤（逗號分隔）
  is_recurring BOOLEAN DEFAULT false, -- 是否為週期性交易
  recurring_pattern JSONB, -- 週期性模式（頻率、結束日期等）
  location VARCHAR(255), -- 交易地點
  reference_number VARCHAR(100), -- 參考號碼
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. 轉帳交易關聯表 (Transfer Transactions)
-- ========================================
CREATE TABLE finance_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  to_transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  to_account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  transfer_fee DECIMAL(12,2) DEFAULT 0, -- 轉帳手續費
  exchange_rate DECIMAL(10,6) DEFAULT 1.0, -- 匯率（跨貨幣轉帳）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. 預算管理表 (Budgets)
-- ========================================
CREATE TABLE finance_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  category_id UUID REFERENCES finance_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL, -- 預算金額
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  alert_threshold DECIMAL(5,2) DEFAULT 80.0, -- 警示閾值（百分比）
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_by UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. 儲蓄目標表 (Savings Goals)
-- ========================================
CREATE TABLE finance_savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- 目標名稱
  description TEXT,
  target_amount DECIMAL(12,2) NOT NULL, -- 目標金額
  current_amount DECIMAL(12,2) DEFAULT 0, -- 已存金額
  target_date DATE, -- 目標日期
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 優先級 1-5
  category VARCHAR(50), -- 目標分類（旅行、購物、緊急基金等）
  auto_transfer_amount DECIMAL(12,2), -- 自動轉入金額
  auto_transfer_frequency VARCHAR(20), -- 自動轉入頻率
  source_account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  target_account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  achieved_date DATE, -- 達成日期
  created_by UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 7. 家庭成員財務分担表 (Member Finance Sharing)
-- ========================================
CREATE TABLE finance_member_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES finance_categories(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  share_percentage DECIMAL(5,2) NOT NULL DEFAULT 0, -- 分担百分比
  fixed_amount DECIMAL(12,2), -- 固定分担金額
  is_active BOOLEAN DEFAULT true,
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, member_id, effective_date)
);

-- ========================================
-- 8. 財務提醒表 (Finance Reminders)
-- ========================================
CREATE TABLE finance_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bill_due', 'budget_alert', 'saving_goal', 'recurring_transaction')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  amount DECIMAL(12,2),
  due_date DATE,
  is_completed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  related_id UUID, -- 關聯的ID（交易、預算、目標等）
  related_type VARCHAR(50), -- 關聯類型
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 9. 財務報告設定表 (Finance Report Settings)
-- ========================================
CREATE TABLE finance_report_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 報告類型
  parameters JSONB NOT NULL, -- 報告參數（時間範圍、分類、成員等）
  schedule JSONB, -- 自動生成排程
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 索引建立
-- ========================================

-- 帳戶索引
CREATE INDEX idx_finance_accounts_family_id ON finance_accounts(family_id);
CREATE INDEX idx_finance_accounts_type ON finance_accounts(type);

-- 分類索引
CREATE INDEX idx_finance_categories_family_id ON finance_categories(family_id);
CREATE INDEX idx_finance_categories_type ON finance_categories(type);
CREATE INDEX idx_finance_categories_parent ON finance_categories(parent_id);

-- 交易索引
CREATE INDEX idx_finance_transactions_family_id ON finance_transactions(family_id);
CREATE INDEX idx_finance_transactions_account_id ON finance_transactions(account_id);
CREATE INDEX idx_finance_transactions_category_id ON finance_transactions(category_id);
CREATE INDEX idx_finance_transactions_member_id ON finance_transactions(member_id);
CREATE INDEX idx_finance_transactions_date ON finance_transactions(transaction_date);
CREATE INDEX idx_finance_transactions_type ON finance_transactions(type);
CREATE INDEX idx_finance_transactions_status ON finance_transactions(status);

-- 預算索引
CREATE INDEX idx_finance_budgets_family_id ON finance_budgets(family_id);
CREATE INDEX idx_finance_budgets_category_id ON finance_budgets(category_id);
CREATE INDEX idx_finance_budgets_period ON finance_budgets(period_type, start_date, end_date);

-- 儲蓄目標索引
CREATE INDEX idx_finance_savings_goals_family_id ON finance_savings_goals(family_id);
CREATE INDEX idx_finance_savings_goals_target_date ON finance_savings_goals(target_date);

-- 成員分担索引
CREATE INDEX idx_finance_member_shares_family_id ON finance_member_shares(family_id);
CREATE INDEX idx_finance_member_shares_member_id ON finance_member_shares(member_id);
CREATE INDEX idx_finance_member_shares_category_id ON finance_member_shares(category_id);

-- 提醒索引
CREATE INDEX idx_finance_reminders_family_id ON finance_reminders(family_id);
CREATE INDEX idx_finance_reminders_member_id ON finance_reminders(member_id);
CREATE INDEX idx_finance_reminders_due_date ON finance_reminders(due_date);
CREATE INDEX idx_finance_reminders_type ON finance_reminders(type);

-- ========================================
-- 更新時間觸發器
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為所有表加上更新時間觸發器
CREATE TRIGGER update_finance_accounts_updated_at BEFORE UPDATE ON finance_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_categories_updated_at BEFORE UPDATE ON finance_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_transactions_updated_at BEFORE UPDATE ON finance_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_budgets_updated_at BEFORE UPDATE ON finance_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_savings_goals_updated_at BEFORE UPDATE ON finance_savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_member_shares_updated_at BEFORE UPDATE ON finance_member_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_reminders_updated_at BEFORE UPDATE ON finance_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_report_settings_updated_at BEFORE UPDATE ON finance_report_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 預設數據插入
-- ========================================

-- 預設財務分類（適合日本家庭）
INSERT INTO finance_categories (name, type, color, icon, is_system, display_order) VALUES
-- 收入分類
('給料', 'income', '#10B981', 'briefcase', true, 1),
('賞与', 'income', '#059669', 'gift', true, 2),
('副業', 'income', '#34D399', 'trending-up', true, 3),
('投資収益', 'income', '#6EE7B7', 'bar-chart', true, 4),
('その他収入', 'income', '#A7F3D0', 'add-circle', true, 5),

-- 支出分類 - 基本生活
('食費', 'expense', '#EF4444', 'restaurant', true, 10),
('住居費', 'expense', '#DC2626', 'home', true, 11),
('水道光熱費', 'expense', '#B91C1C', 'flash', true, 12),
('通信費', 'expense', '#991B1B', 'call', true, 13),
('交通費', 'expense', '#7F1D1D', 'car', true, 14),

-- 支出分類 - 個人・健康
('被服費', 'expense', '#F97316', 'shirt', true, 20),
('美容・理容費', 'expense', '#EA580C', 'cut', true, 21),
('医療費', 'expense', '#C2410C', 'medical', true, 22),
('教育費', 'expense', '#9A3412', 'school', true, 23),
('保険料', 'expense', '#7C2D12', 'shield', true, 24),

-- 支出分類 - 娯楽・その他
('娯楽費', 'expense', '#8B5CF6', 'game-controller', true, 30),
('旅行費', 'expense', '#7C3AED', 'airplane', true, 31),
('交際費', 'expense', '#6D28D9', 'people', true, 32),
('雑費', 'expense', '#5B21B6', 'ellipsis-horizontal', true, 33),
('貯蓄・投資', 'expense', '#4C1D95', 'trending-up', true, 34);

-- 預設帳戶類型示例（註釋掉，由用戶創建）
-- INSERT INTO finance_accounts (family_id, name, type, currency, balance) VALUES
-- ('{family_id}', '現金', 'cash', 'JPY', 0),
-- ('{family_id}', 'メイン銀行', 'bank', 'JPY', 0),
-- ('{family_id}', '貯蓄銀行', 'savings', 'JPY', 0);

-- ========================================
-- 帳戶餘額更新觸發器
-- ========================================
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- 新增交易時更新帳戶餘額
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'income' THEN
            UPDATE finance_accounts 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE finance_accounts 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- 刪除交易時恢復帳戶餘額
    IF TG_OP = 'DELETE' THEN
        IF OLD.type = 'income' THEN
            UPDATE finance_accounts 
            SET balance = balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE finance_accounts 
            SET balance = balance + OLD.amount 
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    -- 更新交易時調整差額
    IF TG_OP = 'UPDATE' THEN
        -- 先恢復舊交易影響
        IF OLD.type = 'income' THEN
            UPDATE finance_accounts 
            SET balance = balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE finance_accounts 
            SET balance = balance + OLD.amount 
            WHERE id = OLD.account_id;
        END IF;
        
        -- 再應用新交易影響
        IF NEW.type = 'income' THEN
            UPDATE finance_accounts 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE finance_accounts 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 創建帳戶餘額更新觸發器
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON finance_transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- ========================================
-- 儲蓄目標更新觸發器
-- ========================================
CREATE OR REPLACE FUNCTION update_savings_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- 這裡可以添加邏輯來自動更新儲蓄目標進度
    -- 例如當有轉帳到目標帳戶時自動更新current_amount
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- RLS (Row Level Security) 設置
-- ========================================

-- 啟用所有表的RLS
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_member_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_report_settings ENABLE ROW LEVEL SECURITY;

-- 創建RLS策略（用戶只能訪問自己家庭的數據）
-- 帳戶策略
CREATE POLICY "Users can view own family finance accounts" ON finance_accounts
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 分類策略
CREATE POLICY "Users can view finance categories" ON finance_categories
    FOR ALL USING (
        family_id IS NULL OR -- 系統預設分類
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 交易策略
CREATE POLICY "Users can view own family finance transactions" ON finance_transactions
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 其他表的策略
CREATE POLICY "Users can view own family finance transfers" ON finance_transfers
    FOR ALL USING (
        from_account_id IN (
            SELECT id FROM finance_accounts WHERE family_id IN (
                SELECT family_id FROM family_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Users can view own family budgets" ON finance_budgets
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view own family savings goals" ON finance_savings_goals
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view own family member shares" ON finance_member_shares
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view own family reminders" ON finance_reminders
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view own family report settings" ON finance_report_settings
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );