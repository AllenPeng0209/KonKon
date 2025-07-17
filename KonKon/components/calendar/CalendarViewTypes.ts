export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_ts: number;
  end_ts: number;
  location?: string;
  color?: string;
  type?: string;
  parent_event_id?: string;
  is_instance?: boolean;
  creator_id?: string;
}

export interface CalendarViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  currentMonth: string;
  onDatePress: (date: Date) => void;
  onEventPress: (event: CalendarEvent) => void;
  onMonthChange?: (month: string) => void;
}

export type CalendarStyleId = 
  // 推荐样式
  | 'grid-month'
  | 'weekly-grid' 
  | 'timeline'
  
  // 基础样式
  | 'day-focus'
  | 'agenda-list'
  | 'compact-month'
  | 'three-day'
  
  // 家庭专用
  | 'family-grid'
  | 'family-orbit'
  | 'family-puzzle'
  | 'family-garden'
  | 'card-month'
  | 'year-overview'
  
  // 视觉创新类
  | 'cloud-floating'
  | 'constellation-wheel'
  | 'subway-map'
  | 'garden-plant'
  
  // 互动遊戲類
  | 'puzzle-piece'
  | 'fishing-pond'
  | 'space-exploration'
  | 'treasure-map'
  
  // 数据可视化类
  | 'heatmap'
  | 'gantt-chart'
  | 'heartbeat'
  | 'bubble-chart'
  
  // 情境主题类
  | 'seasonal-landscape'
  | 'bookshelf'
  | 'music-staff'
  | 'kitchen-recipe'
  
  // 运动健康类
  | 'running-track'
  | 'mood-diary'
  | 'fitness-challenge'
  
  // 未来科技类
  | 'cube-3d'
  | 'ai-prediction'
  | 'ar-view'
  
  // 日系家庭專用
  | 'seasonal-harmony'
  | 'family-notebook'
  | 'bento-box'
  | 'origami-calendar'
  | 'ryokan-style'; 