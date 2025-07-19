import { ChoreTaskWithDetails, ChoreTemplate, MemberChoreStats } from '@/lib/choreService';

export interface ChoreEvent {
  id: string;
  title: string;
  description?: string;
  due_date: Date;
  category: string;
  priority: number;
  assigned_to?: string;
  assigned_member?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimated_duration?: number;
  color?: string;
  template?: ChoreTemplate;
}

export interface ChoreViewProps {
  tasks: ChoreTaskWithDetails[];
  selectedDate: Date;
  currentMonth: string;
  onDatePress: (date: Date) => void;
  onTaskPress: (task: ChoreTaskWithDetails) => void;
  onMonthChange?: (month: string) => void;
  familyMembers?: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
  memberStats?: MemberChoreStats[];
}

export type ChoreViewStyleId = 
  // 基礎視圖
  | 'task-board'
  | 'calendar-grid'
  | 'timeline'
  | 'list'
  
  // 家庭專用視圖
  | 'family-dashboard'
  | 'member-rotation'
  | 'responsibility-wheel'
  | 'family-tree'
  
  // 遊戲化視圖
  | 'achievement-board'
  | 'progress-garden'
  | 'skill-tree'
  | 'treasure-hunt'
  | 'cleaning-adventure'
  
  // 數據可視化視圖
  | 'stats-dashboard'
  | 'completion-heatmap'
  | 'workload-balance'
  | 'time-tracker'
  | 'points-leaderboard'
  
  // 情境主題視圖
  | 'kitchen-commander'
  | 'cleaning-ninja'
  | 'home-hero'
  | 'daily-quest'
  | 'chore-cafe'
  
  // 效率管理視圖
  | 'smart-scheduler'
  | 'workload-optimizer'
  | 'priority-matrix'
  | 'time-blocks'
  
  // 趣味創新視圖
  | 'space-station'
  | 'fairy-tale-castle'
  | 'magic-house'
  | 'robot-assistant'
  | 'seasonal-chores';

export interface ChoreViewConfig {
  id: ChoreViewStyleId;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  gameified: boolean;
  dataVisualization: boolean;
}

export const choreViewConfigs: ChoreViewConfig[] = [
  // 基礎視圖
  {
    id: 'task-board',
    name: '任務看板',
    category: '基礎',
    description: '看板式任務管理，類似Trello的卡片式布局',
    icon: 'clipboard',
    color: '#3B82F6',
    features: ['拖拽排序', '狀態管理', '快速編輯'],
    difficulty: 'easy',
    gameified: false,
    dataVisualization: false
  },
  {
    id: 'calendar-grid',
    name: '日曆網格',
    category: '基礎',
    description: '傳統日曆視圖，按日期顯示家務任務',
    icon: 'calendar',
    color: '#10B981',
    features: ['月份導航', '日期選擇', '任務預覽'],
    difficulty: 'easy',
    gameified: false,
    dataVisualization: false
  },
  {
    id: 'timeline',
    name: '時間軸',
    category: '基礎',
    description: '按時間順序顯示家務任務和截止日期',
    icon: 'timeline',
    color: '#8B5CF6',
    features: ['時間排序', '截止提醒', '進度追踪'],
    difficulty: 'easy',
    gameified: false,
    dataVisualization: true
  },
  {
    id: 'list',
    name: '清單視圖',
    category: '基礎',
    description: '簡潔的列表式任務顯示',
    icon: 'list',
    color: '#6B7280',
    features: ['快速瀏覽', '批量操作', '篩選搜索'],
    difficulty: 'easy',
    gameified: false,
    dataVisualization: false
  },

  // 家庭專用視圖
  {
    id: 'family-dashboard',
    name: '家庭儀表板',
    category: '家庭',
    description: '展示所有家庭成員的任務分配和進度',
    icon: 'users',
    color: '#F59E0B',
    features: ['成員概覽', '負載均衡', '協作狀態'],
    difficulty: 'medium',
    gameified: false,
    dataVisualization: true
  },
  {
    id: 'member-rotation',
    name: '輪值安排',
    category: '家庭',
    description: '自動輪值系統，公平分配家務',
    icon: 'refresh',
    color: '#EF4444',
    features: ['自動輪換', '公平分配', '規則設定'],
    difficulty: 'medium',
    gameified: false,
    dataVisualization: false
  },
  {
    id: 'responsibility-wheel',
    name: '責任轉盤',
    category: '家庭',
    description: '圓形轉盤顯示家務分配，直觀有趣',
    icon: 'target',
    color: '#06B6D4',
    features: ['圓形布局', '動畫效果', '互動轉盤'],
    difficulty: 'medium',
    gameified: true,
    dataVisualization: true
  },
  {
    id: 'family-tree',
    name: '家庭樹狀圖',
    category: '家庭',
    description: '樹狀結構顯示家庭層級和責任分工',
    icon: 'tree',
    color: '#84CC16',
    features: ['層級顯示', '責任分工', '家庭結構'],
    difficulty: 'hard',
    gameified: false,
    dataVisualization: true
  },

  // 遊戲化視圖
  {
    id: 'achievement-board',
    name: '成就榜',
    category: '遊戲化',
    description: '展示家務完成成就和獎章',
    icon: 'award',
    color: '#F59E0B',
    features: ['成就系統', '獎章收集', '排行榜'],
    difficulty: 'medium',
    gameified: true,
    dataVisualization: true
  },
  {
    id: 'progress-garden',
    name: '進度花園',
    category: '遊戲化',
    description: '完成家務讓花園綻放，視覺化進度',
    icon: 'flower',
    color: '#10B981',
    features: ['植物生長', '視覺回饋', '成長動畫'],
    difficulty: 'hard',
    gameified: true,
    dataVisualization: true
  },
  {
    id: 'skill-tree',
    name: '技能樹',
    category: '遊戲化',
    description: 'RPG風格的技能提升和專精系統',
    icon: 'zap',
    color: '#8B5CF6',
    features: ['技能升級', '專精分支', '經驗值'],
    difficulty: 'hard',
    gameified: true,
    dataVisualization: true
  },
  {
    id: 'treasure-hunt',
    name: '尋寶遊戲',
    category: '遊戲化',
    description: '完成家務解鎖寶藏和獎勵',
    icon: 'gift',
    color: '#F59E0B',
    features: ['寶藏解鎖', '獎勵系統', '冒險地圖'],
    difficulty: 'hard',
    gameified: true,
    dataVisualization: false
  },
  {
    id: 'cleaning-adventure',
    name: '清潔冒險',
    category: '遊戲化',
    description: '將家務包裝成冒險任務和挑戰',
    icon: 'sword',
    color: '#EF4444',
    features: ['任務劇情', '角色扮演', '冒險獎勵'],
    difficulty: 'hard',
    gameified: true,
    dataVisualization: false
  },

  // 數據可視化視圖
  {
    id: 'stats-dashboard',
    name: '統計儀表板',
    category: '數據',
    description: '詳細的數據分析和統計圖表',
    icon: 'chart',
    color: '#6366F1',
    features: ['數據圖表', '趨勢分析', '性能指標'],
    difficulty: 'medium',
    gameified: false,
    dataVisualization: true
  },
  {
    id: 'completion-heatmap',
    name: '完成熱力圖',
    category: '數據',
    description: '熱力圖顯示家務完成頻率和模式',
    icon: 'grid',
    color: '#DC2626',
    features: ['熱力圖', '模式識別', '頻率分析'],
    difficulty: 'medium',
    gameified: false,
    dataVisualization: true
  },
  {
    id: 'workload-balance',
    name: '工作負載平衡',
    category: '數據',
    description: '分析和平衡家庭成員的工作負載',
    icon: 'scale',
    color: '#059669',
    features: ['負載分析', '平衡建議', '效率優化'],
    difficulty: 'hard',
    gameified: false,
    dataVisualization: true
  },
  {
    id: 'time-tracker',
    name: '時間追踪器',
    category: '數據',
    description: '追踪和分析家務完成時間',
    icon: 'clock',
    color: '#7C3AED',
    features: ['時間記錄', '效率分析', '改進建議'],
    difficulty: 'medium',
    gameified: false,
    dataVisualization: true
  },
  {
    id: 'points-leaderboard',
    name: '積分排行榜',
    category: '數據',
    description: '積分系統和家庭成員排行榜',
    icon: 'trophy',
    color: '#F59E0B',
    features: ['積分統計', '排行榜', '獎勵追踪'],
    difficulty: 'easy',
    gameified: true,
    dataVisualization: true
  },

  // 情境主題視圖
  {
    id: 'kitchen-commander',
    name: '廚房指揮官',
    category: '主題',
    description: '廚房為中心的家務管理界面',
    icon: 'chef-hat',
    color: '#F97316',
    features: ['廚房主題', '烹飪任務', '食材管理'],
    difficulty: 'medium',
    gameified: true,
    dataVisualization: false
  },
  {
    id: 'cleaning-ninja',
    name: '清潔忍者',
    category: '主題',
    description: '忍者主題的清潔任務管理',
    icon: 'user-ninja',
    color: '#1F2937',
    features: ['忍者主題', '秘密任務', '技能修煉'],
    difficulty: 'medium',
    gameified: true,
    dataVisualization: false
  },
  {
    id: 'home-hero',
    name: '居家英雄',
    category: '主題',
    description: '超級英雄主題的家務管理',
    icon: 'shield',
    color: '#DC2626',
    features: ['英雄主題', '拯救任務', '超能力'],
    difficulty: 'medium',
    gameified: true,
    dataVisualization: false
  },
  {
    id: 'daily-quest',
    name: '每日任務',
    category: '主題',
    description: 'RPG風格的每日任務系統',
    icon: 'scroll',
    color: '#92400E',
    features: ['任務系統', '每日重置', '經驗獎勵'],
    difficulty: 'medium',
    gameified: true,
    dataVisualization: false
  },
  {
    id: 'chore-cafe',
    name: '家務咖啡廳',
    category: '主題',
    description: '溫馨咖啡廳主題的任務管理',
    icon: 'coffee',
    color: '#92400E',
    features: ['咖啡廳主題', '輕鬆氛圍', '舒適體驗'],
    difficulty: 'easy',
    gameified: false,
    dataVisualization: false
  },

  // 效率管理視圖
  {
    id: 'smart-scheduler',
    name: '智能排程器',
    category: '效率',
    description: 'AI驅動的智能任務排程',
    icon: 'brain',
    color: '#6366F1',
    features: ['AI排程', '智能建議', '效率優化'],
    difficulty: 'hard',
    gameified: false,
    dataVisualization: true
  },
  {
    id: 'workload-optimizer',
    name: '負載優化器',
    category: '效率',
    description: '優化家庭成員工作負載分配',
    icon: 'cog',
    color: '#6B7280',
    features: ['負載優化', '自動平衡', '效率分析'],
    difficulty: 'hard',
    gameified: false,
    dataVisualization: true
  },
  {
    id: 'priority-matrix',
    name: '優先級矩陣',
    category: '效率',
    description: '四象限優先級管理系統',
    icon: 'grid-3x3',
    color: '#7C2D12',
    features: ['優先級分類', '重要緊急', '時間管理'],
    difficulty: 'medium',
    gameified: false,
    dataVisualization: true
  },
  {
    id: 'time-blocks',
    name: '時間區塊',
    category: '效率',
    description: '時間區塊化的任務規劃',
    icon: 'calendar-days',
    color: '#0F766E',
    features: ['時間區塊', '集中管理', '效率提升'],
    difficulty: 'medium',
    gameified: false,
    dataVisualization: true
  },

  // 趣味創新視圖
  {
    id: 'space-station',
    name: '太空站',
    category: '趣味',
    description: '太空主題的未來家務管理',
    icon: 'rocket',
    color: '#1E40AF',
    features: ['太空主題', '科幻效果', '未來感'],
    difficulty: 'hard',
    gameified: true,
    dataVisualization: false
  },
  {
    id: 'fairy-tale-castle',
    name: '童話城堡',
    category: '趣味',
    description: '童話主題的夢幻家務管理',
    icon: 'castle',
    color: '#BE185D',
    features: ['童話主題', '夢幻效果', '故事情節'],
    difficulty: 'hard',
    gameified: true,
    dataVisualization: false
  },
  {
    id: 'magic-house',
    name: '魔法屋',
    category: '趣味',
    description: '魔法主題的奇幻家務體驗',
    icon: 'wand',
    color: '#7C3AED',
    features: ['魔法主題', '奇幻效果', '魔法道具'],
    difficulty: 'hard',
    gameified: true,
    dataVisualization: false
  },
  {
    id: 'robot-assistant',
    name: '機器人助手',
    category: '趣味',
    description: '機器人助手指導的智能家務',
    icon: 'robot',
    color: '#374151',
    features: ['機器人主題', '智能提示', '科技感'],
    difficulty: 'medium',
    gameified: true,
    dataVisualization: false
  },
  {
    id: 'seasonal-chores',
    name: '四季家務',
    category: '趣味',
    description: '隨季節變化的動態家務視圖',
    icon: 'leaf',
    color: '#059669',
    features: ['季節主題', '動態變化', '自然元素'],
    difficulty: 'medium',
    gameified: true,
    dataVisualization: false
  }
];

// 輔助函數
export const getChoreViewConfig = (styleId: ChoreViewStyleId): ChoreViewConfig | undefined => {
  return choreViewConfigs.find(config => config.id === styleId);
};

export const getChoreViewsByCategory = (category: string): ChoreViewConfig[] => {
  return choreViewConfigs.filter(config => config.category === category);
};

export const getGameifiedChoreViews = (): ChoreViewConfig[] => {
  return choreViewConfigs.filter(config => config.gameified);
};

export const getDataVisualizationChoreViews = (): ChoreViewConfig[] => {
  return choreViewConfigs.filter(config => config.dataVisualization);
};