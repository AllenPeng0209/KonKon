-- 数据库迁移脚本 V2：重新设计事件分享架构
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 删除events表的family_id字段（如果存在）
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_family_id_fkey;
ALTER TABLE events DROP COLUMN IF EXISTS family_id;

-- 2. 确保events表只有个人事件字段
-- events表结构：id, title, description, start_ts, end_ts, creator_id, location, color, source, created_at, updated_at

-- 3. 创建事件分享表
CREATE TABLE IF NOT EXISTS event_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, family_id)
);

-- 4. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_event_shares_event_id ON event_shares(event_id);
CREATE INDEX IF NOT EXISTS idx_event_shares_family_id ON event_shares(family_id);
CREATE INDEX IF NOT EXISTS idx_event_shares_shared_by ON event_shares(shared_by);

-- 5. 添加RLS (Row Level Security) 策略
ALTER TABLE event_shares ENABLE ROW LEVEL SECURITY;

-- 只有事件创建者可以分享事件
CREATE POLICY "Users can share their own events" ON event_shares
    FOR INSERT WITH CHECK (
        shared_by = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_shares.event_id 
            AND events.creator_id = auth.uid()
        )
    );

-- 只有事件创建者可以删除分享
CREATE POLICY "Users can unshare their own events" ON event_shares
    FOR DELETE USING (
        shared_by = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_shares.event_id 
            AND events.creator_id = auth.uid()
        )
    );

-- 群组成员可以查看分享给该群组的事件
CREATE POLICY "Family members can view shared events" ON event_shares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members 
            WHERE family_members.family_id = event_shares.family_id 
            AND family_members.user_id = auth.uid()
        )
    );

-- 6. 添加注释
COMMENT ON TABLE event_shares IS '事件分享表：记录哪些事件分享给了哪些群组';
COMMENT ON COLUMN event_shares.event_id IS '事件ID';
COMMENT ON COLUMN event_shares.family_id IS '分享给的群组ID';
COMMENT ON COLUMN event_shares.shared_by IS '分享者ID（通常是事件创建者）'; 