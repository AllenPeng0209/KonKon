import { supabase } from './supabase';

export interface ShoppingItem {
  id: string;
  family_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  actual_price?: number;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  assigned_to?: string;
  store_id?: string;
  added_by: string;
  added_date: Date;
  completed_date?: Date;
  notes?: string;
}

export interface ShoppingStore {
  id: string;
  name: string;
  location: string;
  categories: string[];
  distance: number;
  is_frequently_used: boolean;
  family_id: string;
}

export interface ShoppingDeal {
  id: string;
  store_id: string;
  item_name: string;
  original_price: number;
  discount_price: number;
  discount_percent: number;
  valid_until: Date;
  category: string;
}

export interface ShoppingBudget {
  id: string;
  family_id: string;
  monthly_budget: number;
  weekly_budget: number;
  current_spent: number;
  category_budgets: { [category: string]: number };
  created_at: Date;
  updated_at: Date;
}

class ShoppingService {
  // ===== 购物清单管理 =====
  
  async getShoppingItems(familyId: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('family_id', familyId)
        .order('added_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shopping items:', error);
      throw error;
    }
  }

  async addShoppingItem(item: Omit<ShoppingItem, 'id'>): Promise<ShoppingItem> {
    try {
      // AI商品识别和价格预测
      const enhancedItem = await this.enhanceItemWithAI(item);

      const { data, error } = await supabase
        .from('shopping_items')
        .insert([enhancedItem])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding shopping item:', error);
      throw error;
    }
  }

  async updateShoppingItem(itemId: string, updates: Partial<ShoppingItem>): Promise<void> {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating shopping item:', error);
      throw error;
    }
  }

  async completeShoppingItem(itemId: string, actualPrice?: number): Promise<void> {
    try {
      const updates: Partial<ShoppingItem> = {
        completed: true,
        completed_date: new Date(),
        actual_price: actualPrice
      };

      await this.updateShoppingItem(itemId, updates);
      
      // 更新预算统计
      if (actualPrice) {
        await this.updateBudgetSpending(itemId, actualPrice);
      }
    } catch (error) {
      console.error('Error completing shopping item:', error);
      throw error;
    }
  }

  async deleteShoppingItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      throw error;
    }
  }

  // ===== 商店管理 =====
  
  async getStores(familyId: string): Promise<ShoppingStore[]> {
    try {
      const { data, error } = await supabase
        .from('shopping_stores')
        .select('*')
        .eq('family_id', familyId)
        .order('is_frequently_used', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }
  }

  async addStore(store: Omit<ShoppingStore, 'id'>): Promise<ShoppingStore> {
    try {
      const { data, error } = await supabase
        .from('shopping_stores')
        .insert([store])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding store:', error);
      throw error;
    }
  }

  async updateStoreFrequency(storeId: string, isFrequent: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('shopping_stores')
        .update({ is_frequently_used: isFrequent })
        .eq('id', storeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating store frequency:', error);
      throw error;
    }
  }

  // ===== 优惠信息管理 =====
  
  async getDeals(storeIds?: string[]): Promise<ShoppingDeal[]> {
    try {
      let query = supabase
        .from('shopping_deals')
        .select('*')
        .gte('valid_until', new Date().toISOString());

      if (storeIds && storeIds.length > 0) {
        query = query.in('store_id', storeIds);
      }

      const { data, error } = await query
        .order('discount_percent', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  }

  async addDeal(deal: Omit<ShoppingDeal, 'id'>): Promise<ShoppingDeal> {
    try {
      const { data, error } = await supabase
        .from('shopping_deals')
        .insert([deal])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding deal:', error);
      throw error;
    }
  }

  // ===== 预算管理 =====
  
  async getBudget(familyId: string): Promise<ShoppingBudget | null> {
    try {
      const { data, error } = await supabase
        .from('shopping_budgets')
        .select('*')
        .eq('family_id', familyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }
  }

  async createOrUpdateBudget(budget: Omit<ShoppingBudget, 'id' | 'created_at' | 'updated_at'>): Promise<ShoppingBudget> {
    try {
      const { data, error } = await supabase
        .from('shopping_budgets')
        .upsert([{
          ...budget,
          updated_at: new Date()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/updating budget:', error);
      throw error;
    }
  }

  async updateBudgetSpending(itemId: string, amount: number): Promise<void> {
    try {
      // 获取商品信息
      const { data: item, error: itemError } = await supabase
        .from('shopping_items')
        .select('family_id')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // 更新预算支出
      const { error } = await supabase.rpc('update_budget_spending', {
        p_family_id: item.family_id,
        p_amount: amount
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating budget spending:', error);
      throw error;
    }
  }

  // ===== AI功能 =====
  
  private async enhanceItemWithAI(item: Omit<ShoppingItem, 'id'>): Promise<Omit<ShoppingItem, 'id'>> {
    try {
      // 这里可以集成AI服务进行商品识别和价格预测
      // 目前使用简单的逻辑
      
      let category = item.category;
      let estimatedPrice = item.estimated_price;

      // 简单的分类逻辑
      if (!category || category === 'other') {
        category = this.classifyItem(item.name);
      }

      // 价格预测逻辑
      if (!estimatedPrice || estimatedPrice === 0) {
        estimatedPrice = await this.predictPrice(item.name, category);
      }

      return {
        ...item,
        category,
        estimated_price: estimatedPrice
      };
    } catch (error) {
      console.error('Error enhancing item with AI:', error);
      return item;
    }
  }

  private classifyItem(itemName: string): string {
    const name = itemName.toLowerCase();
    
    // 野菜・果物
    if (name.includes('野菜') || name.includes('キャベツ') || name.includes('玉ねぎ') || 
        name.includes('りんご') || name.includes('バナナ') || name.includes('みかん')) {
      return 'produce';
    }
    
    // 肉・魚
    if (name.includes('肉') || name.includes('牛') || name.includes('豚') || 
        name.includes('鶏') || name.includes('魚') || name.includes('刺身')) {
      return 'meat';
    }
    
    // 乳製品
    if (name.includes('牛乳') || name.includes('チーズ') || name.includes('ヨーグルト') ||
        name.includes('バター') || name.includes('卵')) {
      return 'dairy';
    }
    
    // 冷凍食品
    if (name.includes('冷凍') || name.includes('アイス')) {
      return 'frozen';
    }
    
    // お菓子
    if (name.includes('お菓子') || name.includes('クッキー') || name.includes('チョコ')) {
      return 'snacks';
    }
    
    // 日用品
    if (name.includes('洗剤') || name.includes('シャンプー') || name.includes('歯磨き') ||
        name.includes('ティッシュ') || name.includes('トイレットペーパー')) {
      return 'household';
    }

    return 'pantry'; // デフォルト
  }

  private async predictPrice(itemName: string, category: string): Promise<number> {
    try {
      // 過去の購入履歴から平均価格を計算
      const { data, error } = await supabase
        .from('shopping_items')
        .select('actual_price, estimated_price')
        .ilike('name', `%${itemName}%`)
        .eq('category', category)
        .not('actual_price', 'is', null)
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        const prices = data.map(item => item.actual_price || item.estimated_price);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        return Math.round(avgPrice);
      }

      // デフォルト価格
      const defaultPrices: { [key: string]: number } = {
        produce: 200,
        meat: 500,
        dairy: 300,
        pantry: 250,
        frozen: 400,
        snacks: 150,
        household: 300
      };

      return defaultPrices[category] || 200;
    } catch (error) {
      console.error('Error predicting price:', error);
      return 200; // デフォルト価格
    }
  }

  // ===== 分析機能 =====
  
  async getShoppingAnalytics(familyId: string, period: 'week' | 'month' | 'quarter' = 'month') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      const { data, error } = await supabase.rpc('get_shopping_analytics', {
        p_family_id: familyId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching shopping analytics:', error);
      throw error;
    }
  }

  async getShoppingPatterns(familyId: string) {
    try {
      const { data, error } = await supabase.rpc('get_shopping_patterns', {
        p_family_id: familyId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching shopping patterns:', error);
      throw error;
    }
  }

  // ===== 推荐功能 =====
  
  async getSmartRecommendations(familyId: string) {
    try {
      const { data, error } = await supabase.rpc('get_smart_shopping_recommendations', {
        p_family_id: familyId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching smart recommendations:', error);
      throw error;
    }
  }

  async optimizeShoppingRoute(storeIds: string[], itemIds: string[]) {
    try {
      const { data, error } = await supabase.rpc('optimize_shopping_route', {
        p_store_ids: storeIds,
        p_item_ids: itemIds
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error optimizing shopping route:', error);
      throw error;
    }
  }

  // ===== 音声识别功能 =====
  
  async parseVoiceToShoppingList(voiceText: string, familyId: string): Promise<ShoppingItem[]> {
    try {
      // 这里可以集成语音识别和NLP服务
      // 简单的文本解析逻辑
      const items = this.parseShoppingText(voiceText);
      
      const enhancedItems = await Promise.all(
        items.map(async (item) => ({
          ...item,
          family_id: familyId,
          added_by: 'voice',
          added_date: new Date(),
          completed: false
        }))
      );

      return enhancedItems;
    } catch (error) {
      console.error('Error parsing voice to shopping list:', error);
      throw error;
    }
  }

  private parseShoppingText(text: string): Omit<ShoppingItem, 'id' | 'family_id' | 'added_by' | 'added_date' | 'completed'>[] {
    const items: Omit<ShoppingItem, 'id' | 'family_id' | 'added_by' | 'added_date' | 'completed'>[] = [];
    
    // 简单的文本解析
    const lines = text.split(/[、。\n,]/).filter(line => line.trim());
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        // 数量解析
        const quantityMatch = trimmed.match(/(\d+)(個|本|袋|パック|グラム|kg|kg)/);
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
        const unit = quantityMatch ? quantityMatch[2] : '個';
        
        // 商品名
        const name = trimmed.replace(/\d+(個|本|袋|パック|グラム|kg)/, '').trim();
        
        if (name) {
          items.push({
            name,
            category: this.classifyItem(name),
            quantity,
            unit,
            estimated_price: 0,
            priority: 'medium',
            notes: ''
          });
        }
      }
    });

    return items;
  }
}

export const shoppingService = new ShoppingService(); 