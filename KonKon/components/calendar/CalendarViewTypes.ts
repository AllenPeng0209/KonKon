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
  | 'grid-month'
  | 'weekly-grid'
  | 'timeline'
  | 'day-focus'
  | 'agenda-list'
  | 'compact-month'
  | 'three-day'
  | 'family-grid'
  | 'card-month'
  | 'year-overview'; 