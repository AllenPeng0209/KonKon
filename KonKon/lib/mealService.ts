
// 餐食計劃接口
export interface MealPlan {
  id: string;
  user_id: string;
  family_id?: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  difficulty: 1 | 2 | 3; // 簡單、中等、困難
  cooking_time: number; // 分鐘
  servings: number; // 份數
  cuisine_type?: string; // 料理類型：和食、洋食、中華等
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  nutrition: {
    calories: number;
    protein: number; // 蛋白質(g)
    carbs: number;   // 碳水化合物(g)
    fat: number;     // 脂肪(g)
    fiber?: number;  // 纖維(g)
    sodium?: number; // 鈉(mg)
  };
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    category?: string;
  }>;
  instructions: string[]; // 料理步驟
  tags: string[]; // 標籤：快手、健康、兒童友善等
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 週間菜單計劃
export interface WeeklyMealPlan {
  id: string;
  user_id: string;
  family_id?: string;
  week_start: string; // 週開始日期
  week_end: string;   // 週結束日期
  meals: {
    [date: string]: {
      breakfast?: string; // meal_plan_id
      lunch?: string;
      dinner?: string;
      snacks?: string[];
    };
  };
  created_at: string;
  updated_at: string;
}

// 食材庫存
export interface Inventory {
  id: string;
  user_id: string;
  family_id?: string;
  name: string;
  category: string; // 蔬菜、肉類、調料等
  amount: number;
  unit: string;
  expiry_date?: string;
  purchase_date?: string;
  storage_location: string; // 冰箱、冷凍、常溫
  status: 'available' | 'low' | 'expired' | 'used';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 購物清單
export interface ShoppingList {
  id: string;
  user_id: string;
  family_id?: string;
  name: string;
  items: Array<{
    name: string;
    amount: string;
    unit: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    purchased: boolean;
    estimated_price?: number;
  }>;
  total_estimated_price?: number;
  status: 'active' | 'completed' | 'archived';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

// 營養記錄
export interface NutritionRecord {
  id: string;
  user_id: string;
  family_member_id?: string;
  date: string;
  meal_category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_plan_id?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
  };
  notes?: string;
  created_at: string;
}

class MealService {
  // ========== 餐食計劃管理 ==========
  
  /**
   * 創建餐食計劃
   */
  async createMealPlan(mealPlan: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>): Promise<MealPlan | null> {
    // TODO: 實現數據庫創建
    console.log('創建餐食計劃 (模擬):', mealPlan);
    return {
      ...mealPlan,
      id: `meal-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 獲取用戶的餐食計劃
   */
  async getMealPlans(userId: string, options?: {
    category?: string;
    difficulty?: number;
    limit?: number;
    offset?: number;
  }): Promise<MealPlan[]> {
    // TODO: 實現數據庫查詢
    console.log('獲取餐食計劃 (模擬):', userId, options);
    return [];
  }

  /**
   * AI智能午餐生成器（解決74.1%用戶的最大痛點）
   */
  async generateLunchSuggestions(userId: string, preferences?: {
    servings?: number;
    dietary_restrictions?: string[];
    available_time?: number; // 分鐘
    available_ingredients?: string[];
    cuisine_preference?: string;
  }): Promise<MealPlan[]> {
    // TODO: 整合百煉AI生成午餐建議
    
    const mockSuggestions: MealPlan[] = [
      {
        id: 'mock-1',
        user_id: userId,
        title: '親子便當',
        category: 'lunch',
        difficulty: 2,
        cooking_time: 15,
        servings: preferences?.servings || 2,
        cuisine_type: '和食',
        nutrition: {
          calories: 450,
          protein: 25,
          carbs: 55,
          fat: 12
        },
        ingredients: [
          { name: '米飯', amount: '2', unit: '碗', category: '主食' },
          { name: '雞蛋', amount: '2', unit: '個', category: '蛋白質' },
          { name: '青椒', amount: '1', unit: '個', category: '蔬菜' },
          { name: '胡蘿蔔', amount: '1/2', unit: '根', category: '蔬菜' }
        ],
        instructions: [
          '熱鍋下油，炒蛋盛起',
          '青椒胡蘿蔔切絲炒熟',
          '米飯與配菜裝便當盒',
          '搭配小菜完成'
        ],
        tags: ['快手', '營養均衡', '便當友善'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-2',
        user_id: userId,
        title: '簡易炒飯',
        category: 'lunch',
        difficulty: 1,
        cooking_time: 10,
        servings: preferences?.servings || 2,
        cuisine_type: '中華',
        nutrition: {
          calories: 380,
          protein: 18,
          carbs: 62,
          fat: 8
        },
        ingredients: [
          { name: '隔夜飯', amount: '2', unit: '碗', category: '主食' },
          { name: '雞蛋', amount: '2', unit: '個', category: '蛋白質' },
          { name: '蔥花', amount: '適量', unit: '', category: '調料' }
        ],
        instructions: [
          '熱鍋炒蛋盛起',
          '下飯炒散炒熱',
          '加入炒蛋拌勻',
          '撒蔥花調味完成'
        ],
        tags: ['超快手', '剩飯活用', '經濟實惠'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-3',
        user_id: userId,
        title: '健康蒸蛋',
        category: 'lunch',
        difficulty: 1,
        cooking_time: 12,
        servings: preferences?.servings || 2,
        cuisine_type: '和食',
        nutrition: {
          calories: 280,
          protein: 20,
          carbs: 8,
          fat: 18
        },
        ingredients: [
          { name: '雞蛋', amount: '3', unit: '個', category: '蛋白質' },
          { name: '高湯', amount: '200', unit: 'ml', category: '湯汁' },
          { name: '蔥花', amount: '適量', unit: '', category: '調料' }
        ],
        instructions: [
          '雞蛋打散加高湯',
          '過篩去泡沫',
          '蒸鍋蒸10分鐘',
          '撒蔥花完成'
        ],
        tags: ['健康', '低卡', '嫩滑'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return mockSuggestions;
  }

  // ========== 週間菜單規劃 ==========
  
  /**
   * 創建週間菜單計劃
   */
  async createWeeklyPlan(plan: Omit<WeeklyMealPlan, 'id' | 'created_at' | 'updated_at'>): Promise<WeeklyMealPlan | null> {
    // TODO: 實現數據庫創建
    console.log('創建週間菜單 (模擬):', plan);
    return {
      ...plan,
      id: `weekly-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 獲取當前週的菜單計劃
   */
  async getCurrentWeekPlan(userId: string): Promise<WeeklyMealPlan | null> {
    // TODO: 實現數據庫查詢
    console.log('獲取當前週菜單 (模擬):', userId);
    return null;
  }

  // ========== 食材庫存管理 ==========
  
  /**
   * 添加食材到庫存
   */
  async addInventoryItem(item: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>): Promise<Inventory | null> {
    // TODO: 實現數據庫創建
    console.log('添加庫存 (模擬):', item);
    return {
      ...item,
      id: `inventory-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 獲取庫存列表
   */
  async getInventory(userId: string, options?: {
    category?: string;
    status?: string;
    location?: string;
  }): Promise<Inventory[]> {
    // TODO: 實現數據庫查詢
    console.log('獲取庫存 (模擬):', userId, options);
    return [];
  }

  /**
   * 掃描冰箱功能（AI識別食材）
   */
  async scanFridgeContents(userId: string, imageBase64: string): Promise<{
    success: boolean;
    detected_items?: Array<{
      name: string;
      category: string;
      confidence: number;
      estimated_amount?: string;
      estimated_expiry?: string;
    }>;
    error?: string;
  }> {
    // TODO: 整合AI圖像識別服務
    return {
      success: true,
      detected_items: [
        {
          name: '雞蛋',
          category: '蛋白質',
          confidence: 0.95,
          estimated_amount: '8個',
          estimated_expiry: '2024-02-15'
        },
        {
          name: '牛奶',
          category: '乳製品',
          confidence: 0.88,
          estimated_amount: '1盒',
          estimated_expiry: '2024-02-10'
        },
        {
          name: '青椒',
          category: '蔬菜',
          confidence: 0.92,
          estimated_amount: '3個',
          estimated_expiry: '2024-02-08'
        },
        {
          name: '胡蘿蔔',
          category: '蔬菜',
          confidence: 0.87,
          estimated_amount: '2根',
          estimated_expiry: '2024-02-12'
        }
      ]
    };
  }

  // ========== 購物清單管理 ==========
  
  /**
   * 創建購物清單
   */
  async createShoppingList(list: Omit<ShoppingList, 'id' | 'created_at' | 'updated_at'>): Promise<ShoppingList | null> {
    // TODO: 實現數據庫創建
    console.log('創建購物清單 (模擬):', list);
    return {
      ...list,
      id: `shopping-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 智能生成購物清單（基於菜單計劃和庫存）
   */
  async generateSmartShoppingList(userId: string): Promise<Array<{
    name: string;
    amount: string;
    unit: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    estimated_price?: number;
  }>> {
    // TODO: 實現智能分析邏輯
    return [
      {
        name: '雞胸肉',
        amount: '500',
        unit: 'g',
        category: '肉類',
        priority: 'high',
        estimated_price: 8.5
      },
      {
        name: '西蘭花',
        amount: '2',
        unit: '朵',
        category: '蔬菜',
        priority: 'medium',
        estimated_price: 6.0
      },
      {
        name: '米飯',
        amount: '1',
        unit: '袋',
        category: '主食',
        priority: 'high',
        estimated_price: 15.0
      },
      {
        name: '雞蛋',
        amount: '1',
        unit: '盒',
        category: '蛋白質',
        priority: 'medium',
        estimated_price: 4.5
      }
    ];
  }

  // ========== 營養追蹤 ==========
  
  /**
   * 記錄營養攝取
   */
  async recordNutrition(record: Omit<NutritionRecord, 'id' | 'created_at'>): Promise<NutritionRecord | null> {
    // TODO: 實現數據庫創建
    console.log('記錄營養 (模擬):', record);
    return {
      ...record,
      id: `nutrition-${Date.now()}`,
      created_at: new Date().toISOString()
    };
  }

  /**
   * 獲取營養統計
   */
  async getNutritionStats(userId: string, dateRange: {
    start: string;
    end: string;
  }): Promise<{
    daily_average: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    total_records: number;
    by_meal: {
      breakfast: number;
      lunch: number;
      dinner: number;
      snack: number;
    };
  } | null> {
    // TODO: 實現數據庫查詢
    return {
      daily_average: {
        calories: 1800,
        protein: 70,
        carbs: 225,
        fat: 60
      },
      total_records: 21,
      by_meal: {
        breakfast: 7,
        lunch: 7,
        dinner: 7,
        snack: 0
      }
    };
  }

  // ========== 輔助方法 ==========
  
  private async getWeeklyPlanById(planId: string): Promise<WeeklyMealPlan | null> {
    // TODO: 實現數據庫查詢
    console.log('獲取週間菜單 (模擬):', planId);
    return null;
  }

  /**
   * 分析剩餘食材，推薦料理
   */
  async suggestRecipesFromInventory(userId: string): Promise<MealPlan[]> {
    // TODO: 整合AI服務分析剩餘食材並推薦料理
    return [
      {
        id: 'leftover-1',
        user_id: userId,
        title: '剩菜炒飯',
        category: 'lunch',
        difficulty: 1,
        cooking_time: 10,
        servings: 2,
        cuisine_type: '家常',
        nutrition: { calories: 320, protein: 12, carbs: 45, fat: 10 },
        ingredients: [
          { name: '隔夜飯', amount: '2', unit: '碗', category: '主食' },
          { name: '剩菜', amount: '適量', unit: '', category: '蔬菜' },
          { name: '雞蛋', amount: '1', unit: '個', category: '蛋白質' }
        ],
        instructions: [
          '熱鍋下油',
          '加入剩菜炒熱',
          '倒入米飯拌炒',
          '調味完成'
        ],
        tags: ['剩菜活用', '經濟', '快手'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
}

// 創建並導出服務實例
const mealService = new MealService();
export default mealService; 