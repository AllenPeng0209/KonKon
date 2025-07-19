-- 购物商品表
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT '個',
  estimated_price INTEGER NOT NULL DEFAULT 0,
  actual_price INTEGER NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  store_id UUID NULL,
  added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_date TIMESTAMPTZ NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 商店表
CREATE TABLE shopping_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  distance NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_frequently_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 商店优惠表
CREATE TABLE shopping_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES shopping_stores(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  original_price INTEGER NOT NULL,
  discount_price INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 购物预算表
CREATE TABLE shopping_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  monthly_budget INTEGER NOT NULL DEFAULT 0,
  weekly_budget INTEGER NOT NULL DEFAULT 0,
  current_spent INTEGER NOT NULL DEFAULT 0,
  category_budgets JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id)
);

-- 添加索引以提高查询性能
CREATE INDEX idx_shopping_items_family_id ON shopping_items(family_id);
CREATE INDEX idx_shopping_items_completed ON shopping_items(completed);
CREATE INDEX idx_shopping_items_category ON shopping_items(category);
CREATE INDEX idx_shopping_items_assigned_to ON shopping_items(assigned_to);
CREATE INDEX idx_shopping_items_added_date ON shopping_items(added_date);

CREATE INDEX idx_shopping_stores_family_id ON shopping_stores(family_id);
CREATE INDEX idx_shopping_stores_frequently_used ON shopping_stores(is_frequently_used);

CREATE INDEX idx_shopping_deals_store_id ON shopping_deals(store_id);
CREATE INDEX idx_shopping_deals_valid_until ON shopping_deals(valid_until);
CREATE INDEX idx_shopping_deals_category ON shopping_deals(category);

CREATE INDEX idx_shopping_budgets_family_id ON shopping_budgets(family_id);

-- 添加更新时间触发器
CREATE TRIGGER update_shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_stores_updated_at
  BEFORE UPDATE ON shopping_stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_deals_updated_at
  BEFORE UPDATE ON shopping_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_budgets_updated_at
  BEFORE UPDATE ON shopping_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 行级安全策略（RLS）
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_budgets ENABLE ROW LEVEL SECURITY;

-- 购物商品访问策略
CREATE POLICY "Users can view family shopping items" ON shopping_items
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shopping items for their families" ON shopping_items
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ) AND added_by = auth.uid()
  );

CREATE POLICY "Users can update family shopping items" ON shopping_items
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shopping items they created" ON shopping_items
  FOR DELETE USING (
    added_by = auth.uid() OR 
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 商店访问策略
CREATE POLICY "Users can view family stores" ON shopping_stores
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stores for their families" ON shopping_stores
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update family stores" ON shopping_stores
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete family stores" ON shopping_stores
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- 优惠信息访问策略
CREATE POLICY "Users can view deals for family stores" ON shopping_deals
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM shopping_stores 
      WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create deals for family stores" ON shopping_deals
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM shopping_stores 
      WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update deals for family stores" ON shopping_deals
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM shopping_stores 
      WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete deals for family stores" ON shopping_deals
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM shopping_stores 
      WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

-- 预算访问策略
CREATE POLICY "Users can view family budget" ON shopping_budgets
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create/update family budget" ON shopping_budgets
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- 创建数据库函数用于业务逻辑

-- 更新预算支出函数
CREATE OR REPLACE FUNCTION update_budget_spending(
  p_family_id UUID,
  p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO shopping_budgets (family_id, current_spent)
  VALUES (p_family_id, p_amount)
  ON CONFLICT (family_id)
  DO UPDATE SET 
    current_spent = shopping_budgets.current_spent + p_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取购物分析数据函数
CREATE OR REPLACE FUNCTION get_shopping_analytics(
  p_family_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS TABLE (
  total_items INTEGER,
  total_spent INTEGER,
  avg_price NUMERIC,
  most_frequent_category TEXT,
  savings_amount INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_items,
    COALESCE(SUM(COALESCE(actual_price, estimated_price)), 0)::INTEGER as total_spent,
    COALESCE(AVG(COALESCE(actual_price, estimated_price)), 0) as avg_price,
    (
      SELECT category 
      FROM shopping_items si2 
      WHERE si2.family_id = p_family_id 
        AND si2.completed = TRUE
        AND si2.completed_date BETWEEN p_start_date AND p_end_date
      GROUP BY category 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ) as most_frequent_category,
    COALESCE(
      SUM(
        CASE 
          WHEN actual_price IS NOT NULL AND actual_price < estimated_price 
          THEN estimated_price - actual_price 
          ELSE 0 
        END
      ), 0
    )::INTEGER as savings_amount
  FROM shopping_items si
  WHERE si.family_id = p_family_id
    AND si.completed = TRUE
    AND si.completed_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取购物模式函数
CREATE OR REPLACE FUNCTION get_shopping_patterns(
  p_family_id UUID
) RETURNS TABLE (
  item_name TEXT,
  purchase_count INTEGER,
  avg_price NUMERIC,
  last_purchased TIMESTAMPTZ,
  trend TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH item_stats AS (
    SELECT 
      name,
      COUNT(*) as purchase_count,
      AVG(COALESCE(actual_price, estimated_price)) as avg_price,
      MAX(completed_date) as last_purchased,
      CASE 
        WHEN COUNT(*) >= 3 THEN
          CASE
            WHEN AVG(CASE WHEN completed_date >= NOW() - INTERVAL '30 days' THEN COALESCE(actual_price, estimated_price) END) >
                 AVG(CASE WHEN completed_date < NOW() - INTERVAL '30 days' THEN COALESCE(actual_price, estimated_price) END) * 1.1
            THEN 'increasing'
            WHEN AVG(CASE WHEN completed_date >= NOW() - INTERVAL '30 days' THEN COALESCE(actual_price, estimated_price) END) <
                 AVG(CASE WHEN completed_date < NOW() - INTERVAL '30 days' THEN COALESCE(actual_price, estimated_price) END) * 0.9
            THEN 'decreasing'
            ELSE 'stable'
          END
        ELSE 'stable'
      END as trend
    FROM shopping_items
    WHERE family_id = p_family_id
      AND completed = TRUE
      AND completed_date >= NOW() - INTERVAL '6 months'
    GROUP BY name
    HAVING COUNT(*) >= 2
  )
  SELECT 
    is.name as item_name,
    is.purchase_count::INTEGER,
    is.avg_price,
    is.last_purchased,
    is.trend
  FROM item_stats is
  ORDER BY is.purchase_count DESC, is.last_purchased DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取智能购物推荐函数
CREATE OR REPLACE FUNCTION get_smart_shopping_recommendations(
  p_family_id UUID
) RETURNS TABLE (
  recommendation_type TEXT,
  item_name TEXT,
  reason TEXT,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  -- 推荐经常购买但最近没买的商品
  SELECT 
    'recurring_item'::TEXT as recommendation_type,
    si.name as item_name,
    '前回の購入から' || EXTRACT(DAYS FROM NOW() - MAX(si.completed_date)) || '日経過しています' as reason,
    CASE 
      WHEN EXTRACT(DAYS FROM NOW() - MAX(si.completed_date)) > 14 THEN 3
      WHEN EXTRACT(DAYS FROM NOW() - MAX(si.completed_date)) > 7 THEN 2
      ELSE 1
    END as priority
  FROM shopping_items si
  WHERE si.family_id = p_family_id
    AND si.completed = TRUE
    AND si.completed_date >= NOW() - INTERVAL '3 months'
  GROUP BY si.name
  HAVING COUNT(*) >= 3
    AND MAX(si.completed_date) < NOW() - INTERVAL '7 days'
  ORDER BY COUNT(*) DESC, MAX(si.completed_date) ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 优化购物路线函数
CREATE OR REPLACE FUNCTION optimize_shopping_route(
  p_store_ids UUID[],
  p_item_ids UUID[]
) RETURNS TABLE (
  store_id UUID,
  store_name TEXT,
  matching_items INTEGER,
  distance NUMERIC,
  route_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH store_matches AS (
    SELECT 
      ss.id,
      ss.name,
      COUNT(si.id) as matching_items,
      ss.distance
    FROM shopping_stores ss
    LEFT JOIN shopping_items si ON si.store_id = ss.id AND si.id = ANY(p_item_ids)
    WHERE ss.id = ANY(p_store_ids)
    GROUP BY ss.id, ss.name, ss.distance
  )
  SELECT 
    sm.id as store_id,
    sm.name as store_name,
    sm.matching_items::INTEGER,
    sm.distance,
    ROW_NUMBER() OVER (ORDER BY sm.matching_items DESC, sm.distance ASC)::INTEGER as route_order
  FROM store_matches sm
  ORDER BY sm.matching_items DESC, sm.distance ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 