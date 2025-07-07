-- 重复事件异常表
CREATE TABLE IF NOT EXISTS event_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  exception_type TEXT CHECK (exception_type IN ('cancelled', 'modified', 'moved')) NOT NULL,
  modified_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 扩展 events 表
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE;

-- 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_event_exceptions_parent_event_id ON event_exceptions(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_event_exceptions_exception_date ON event_exceptions(exception_date);
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_recurrence_rule ON events(recurrence_rule) WHERE recurrence_rule IS NOT NULL;

-- 添加注释
COMMENT ON TABLE event_exceptions IS '重复事件异常处理表，用于记录重复事件的取消、修改或移动';
COMMENT ON COLUMN event_exceptions.exception_type IS '异常类型：cancelled(取消)、modified(修改)、moved(移动)';
COMMENT ON COLUMN events.recurrence_end_date IS '重复事件结束日期';
COMMENT ON COLUMN events.recurrence_count IS '重复次数限制';
COMMENT ON COLUMN events.parent_event_id IS '父重复事件ID，用于标识重复事件实例';