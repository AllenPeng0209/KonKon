-- 006_create_health_management_system.sql
-- 健康管理系統數據庫表

-- 健康記錄表 (blood pressure, weight, heart rate, etc.)
CREATE TABLE health_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('blood_pressure', 'weight', 'heart_rate', 'temperature', 'blood_sugar', 'other')),
    
    -- 血壓數據
    systolic_bp INTEGER, -- 收縮壓
    diastolic_bp INTEGER, -- 舒張壓
    pulse INTEGER, -- 脈搏
    
    -- 通用數據
    value DECIMAL(10,2), -- 通用數值（體重、血糖等）
    unit TEXT, -- 單位
    notes TEXT, -- 備註
    
    -- 測量環境
    measurement_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    measurement_location TEXT, -- 測量位置（家中、醫院等）
    device_name TEXT, -- 測量設備名稱
    
    -- 症狀標記
    has_symptoms BOOLEAN DEFAULT false,
    symptoms TEXT[], -- 症狀列表
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 用藥記錄表
CREATE TABLE medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    
    -- 藥物基本信息
    medication_name TEXT NOT NULL,
    medication_type TEXT, -- 藥物類型（降壓藥、維他命等）
    dosage TEXT NOT NULL, -- 劑量
    unit TEXT NOT NULL, -- 單位（mg, ml等）
    frequency TEXT NOT NULL, -- 服用頻率
    
    -- 服用時間設定
    times_per_day INTEGER NOT NULL DEFAULT 1,
    reminder_times TIME[], -- 提醒時間
    
    -- 處方信息
    prescribed_by TEXT, -- 處方醫生
    prescription_date DATE,
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- 狀態
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    side_effects TEXT[], -- 副作用記錄
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 用藥記錄表
CREATE TABLE medication_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 服用記錄
    scheduled_time TIMESTAMPTZ NOT NULL, -- 計劃服用時間
    actual_time TIMESTAMPTZ, -- 實際服用時間
    status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'skipped', 'delayed')) DEFAULT 'taken',
    
    -- 詳細信息
    dosage_taken TEXT, -- 實際服用劑量
    notes TEXT,
    side_effects_experienced TEXT[], -- 服用後的副作用
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 健康檢查記錄表（日本定期健診）
CREATE TABLE health_checkups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    
    -- 檢查基本信息
    checkup_type TEXT NOT NULL, -- 檢查類型（定期健診、人間ドック等）
    checkup_date DATE NOT NULL,
    medical_facility TEXT, -- 醫療機構
    doctor_name TEXT,
    
    -- 基本測量數據
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    bmi DECIMAL(5,2),
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    resting_heart_rate INTEGER,
    
    -- 血液檢查數據
    total_cholesterol INTEGER, -- 總膽固醇
    ldl_cholesterol INTEGER, -- 壞膽固醇
    hdl_cholesterol INTEGER, -- 好膽固醇
    triglycerides INTEGER, -- 三酸甘油脂
    blood_sugar INTEGER, -- 血糖
    hba1c DECIMAL(3,1), -- 糖化血紅蛋白
    
    -- 其他檢查項目
    liver_function JSONB, -- 肝功能數據
    kidney_function JSONB, -- 腎功能數據
    urine_test JSONB, -- 尿液檢查
    chest_xray TEXT, -- 胸部X光結果
    ecg_result TEXT, -- 心電圖結果
    
    -- 診斷和建議
    diagnosis TEXT, -- 診斷
    recommendations TEXT, -- 醫生建議
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- 文件附件
    report_files TEXT[], -- 檢查報告文件URL
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 健康目標表
CREATE TABLE health_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    
    -- 目標信息
    goal_type TEXT NOT NULL CHECK (goal_type IN ('blood_pressure', 'weight', 'exercise', 'medication_adherence', 'custom')),
    title TEXT NOT NULL,
    description TEXT,
    
    -- 目標數值
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    unit TEXT,
    
    -- 血壓特殊目標
    target_systolic INTEGER,
    target_diastolic INTEGER,
    current_systolic INTEGER,
    current_diastolic INTEGER,
    
    -- 時間設定
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    
    -- 狀態
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- 提醒設定
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_frequency TEXT, -- 提醒頻率
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 家庭健康分享設定表
CREATE TABLE health_sharing_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 分享權限設定
    can_view_blood_pressure BOOLEAN DEFAULT false,
    can_view_weight BOOLEAN DEFAULT false,
    can_view_medications BOOLEAN DEFAULT false,
    can_view_checkups BOOLEAN DEFAULT false,
    can_view_goals BOOLEAN DEFAULT false,
    
    -- 緊急情況權限
    emergency_contact BOOLEAN DEFAULT false,
    can_receive_alerts BOOLEAN DEFAULT false,
    
    -- 特殊設定
    auto_share_critical_readings BOOLEAN DEFAULT true, -- 異常數值自動分享
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, shared_with_user_id)
);

-- 健康警報表
CREATE TABLE health_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    
    -- 警報信息
    alert_type TEXT NOT NULL CHECK (alert_type IN ('high_blood_pressure', 'medication_missed', 'checkup_reminder', 'goal_milestone', 'emergency')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- 相關數據
    related_record_id UUID, -- 關聯的健康記錄ID
    related_medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    
    -- 狀態
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- 通知設定
    notify_family_members UUID[], -- 需要通知的家庭成員
    notification_sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建索引以提高查詢性能
CREATE INDEX idx_health_records_user_id ON health_records(user_id);
CREATE INDEX idx_health_records_family_id ON health_records(family_id);
CREATE INDEX idx_health_records_type_time ON health_records(record_type, measurement_time);
CREATE INDEX idx_health_records_measurement_time ON health_records(measurement_time DESC);

CREATE INDEX idx_medications_user_id ON medications(user_id);
CREATE INDEX idx_medications_active ON medications(is_active);

CREATE INDEX idx_medication_logs_medication_id ON medication_logs(medication_id);
CREATE INDEX idx_medication_logs_user_time ON medication_logs(user_id, scheduled_time);

CREATE INDEX idx_health_checkups_user_id ON health_checkups(user_id);
CREATE INDEX idx_health_checkups_date ON health_checkups(checkup_date DESC);

CREATE INDEX idx_health_goals_user_id ON health_goals(user_id);
CREATE INDEX idx_health_goals_status ON health_goals(status);

CREATE INDEX idx_health_alerts_user_id ON health_alerts(user_id);
CREATE INDEX idx_health_alerts_unread ON health_alerts(user_id) WHERE is_read = false;

-- 啟用 RLS (Row Level Security)
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checkups ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_sharing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;

-- RLS 策略

-- health_records 策略
CREATE POLICY "Users can manage their own health records"
ON health_records
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Family members can view shared health records"
ON health_records
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM health_sharing_settings hss
        WHERE hss.user_id = health_records.user_id
        AND hss.shared_with_user_id = auth.uid()
        AND (
            (health_records.record_type = 'blood_pressure' AND hss.can_view_blood_pressure) OR
            (health_records.record_type = 'weight' AND hss.can_view_weight) OR
            hss.emergency_contact = true
        )
    )
);

-- medications 策略
CREATE POLICY "Users can manage their own medications"
ON medications
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Family members can view shared medications"
ON medications
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM health_sharing_settings hss
        WHERE hss.user_id = medications.user_id
        AND hss.shared_with_user_id = auth.uid()
        AND hss.can_view_medications = true
    )
);

-- medication_logs 策略
CREATE POLICY "Users can manage their own medication logs"
ON medication_logs
FOR ALL
USING (auth.uid() = user_id);

-- health_checkups 策略
CREATE POLICY "Users can manage their own checkups"
ON health_checkups
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Family members can view shared checkups"
ON health_checkups
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM health_sharing_settings hss
        WHERE hss.user_id = health_checkups.user_id
        AND hss.shared_with_user_id = auth.uid()
        AND hss.can_view_checkups = true
    )
);

-- health_goals 策略
CREATE POLICY "Users can manage their own health goals"
ON health_goals
FOR ALL
USING (auth.uid() = user_id);

-- health_sharing_settings 策略
CREATE POLICY "Users can manage their sharing settings"
ON health_sharing_settings
FOR ALL
USING (auth.uid() = user_id OR auth.uid() = shared_with_user_id);

-- health_alerts 策略
CREATE POLICY "Users can view their own alerts"
ON health_alerts
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = ANY(notify_family_members));

CREATE POLICY "Users can update their own alerts"
ON health_alerts
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = ANY(notify_family_members));

-- 創建觸發器函數以自動更新 updated_at
CREATE OR REPLACE FUNCTION update_health_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_records_updated_at
    BEFORE UPDATE ON health_records
    FOR EACH ROW EXECUTE FUNCTION update_health_records_updated_at();

CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_health_records_updated_at();

CREATE TRIGGER update_health_checkups_updated_at
    BEFORE UPDATE ON health_checkups
    FOR EACH ROW EXECUTE FUNCTION update_health_records_updated_at();

CREATE TRIGGER update_health_goals_updated_at
    BEFORE UPDATE ON health_goals
    FOR EACH ROW EXECUTE FUNCTION update_health_records_updated_at();

-- 創建函數以自動生成健康警報
CREATE OR REPLACE FUNCTION check_blood_pressure_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- 檢查高血壓警報 (收縮壓 >= 140 或舒張壓 >= 90)
    IF NEW.record_type = 'blood_pressure' AND 
       (NEW.systolic_bp >= 140 OR NEW.diastolic_bp >= 90) THEN
        
        INSERT INTO health_alerts (
            user_id,
            family_id,
            alert_type,
            severity,
            title,
            message,
            related_record_id
        ) VALUES (
            NEW.user_id,
            NEW.family_id,
            'high_blood_pressure',
            CASE 
                WHEN NEW.systolic_bp >= 180 OR NEW.diastolic_bp >= 120 THEN 'critical'
                WHEN NEW.systolic_bp >= 160 OR NEW.diastolic_bp >= 100 THEN 'high'
                ELSE 'medium'
            END,
            '血壓偏高警報',
            FORMAT('測量血壓為 %s/%s mmHg，建議注意休息並考慮就醫', NEW.systolic_bp, NEW.diastolic_bp),
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER blood_pressure_alert_trigger
    AFTER INSERT ON health_records
    FOR EACH ROW EXECUTE FUNCTION check_blood_pressure_alert();

-- 插入一些示例數據 (可選，用於測試)
-- 這部分在生產環境中應該移除
/*
INSERT INTO health_records (user_id, record_type, systolic_bp, diastolic_bp, pulse, measurement_time, notes)
VALUES 
    (auth.uid(), 'blood_pressure', 120, 80, 72, now(), '晨起測量'),
    (auth.uid(), 'blood_pressure', 135, 85, 75, now() - interval '1 day', '睡前測量');

INSERT INTO medications (user_id, medication_name, medication_type, dosage, unit, frequency, times_per_day, reminder_times, start_date)
VALUES 
    (auth.uid(), 'アムロジピン', '降圧薬', '5', 'mg', '每日一次', 1, ARRAY['08:00'::TIME], current_date);
*/ 