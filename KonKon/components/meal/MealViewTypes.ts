export interface MealRecord {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  calories: number;
  tags: string[];
  time: string;
  emoji: string;
  nutrition?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MealViewProps {
  mealRecords: MealRecord[];
  selectedDate: Date;
  onMealPress?: (meal: MealRecord) => void;
  onDatePress?: (date: Date) => void;
}

export type MealViewType = 
  | 'daily_records'      // 每日記錄視圖
  | 'weekly_overview'    // 週間概覽
  | 'nutrition_chart'    // 營養圖表
  | 'calendar_grid'      // 日曆網格
  | 'timeline'           // 時間線視圖
  | 'habit_tracker'      // 習慣追蹤
  | 'meal_planning'      // 餐食規劃
  | 'recipe_collection'  // 菜譜收藏
  | 'shopping_list'      // 購物清單
  | 'nutrition_goals';   // 營養目標

export interface MealViewOption {
  id: MealViewType;
  name: string;
  description: string;
  emoji: string;
  premium?: boolean;
} 