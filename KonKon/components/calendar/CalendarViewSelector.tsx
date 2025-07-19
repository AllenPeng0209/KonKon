import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import AgendaListView from './AgendaListView';
import { CalendarEvent, CalendarStyleId, CalendarViewProps } from './CalendarViewTypes';
import CardMonthView from './CardMonthView';
import CompactMonthView from './CompactMonthView';
import DayFocusView from './DayFocusView';
import FamilyGardenView from './FamilyGardenView';
import FamilyGridView from './FamilyGridView';
import FamilyOrbitView from './FamilyOrbitView';
import FamilyPuzzleView from './FamilyPuzzleView';
import GridMonthView from './GridMonthView';
import ThreeDayView from './ThreeDayView';
import TimelineView from './TimelineView';
import WeeklyGridView from './WeeklyGridView';
import YearOverviewView from './YearOverviewView';

// 視覺創新類
import CloudFloatingView from './CloudFloatingView';
import ConstellationWheelView from './ConstellationWheelView';
import GardenPlantView from './GardenPlantView';
import SubwayMapView from './SubwayMapView';

// 互動遊戲類
import FishingPondView from './FishingPondView';
import PuzzlePieceView from './PuzzlePieceView';
import SpaceExplorationView from './SpaceExplorationView';
import TreasureMapView from './TreasureMapView';

// 數據可視化類
import BubbleChartView from './BubbleChartView';
import GanttChartView from './GanttChartView';
import HeartbeatView from './HeartbeatView';
import HeatmapView from './HeatmapView';

// 情境主題類
import BookshelfView from './BookshelfView';
import KitchenRecipeView from './KitchenRecipeView';
import MusicStaffView from './MusicStaffView';
import SeasonalLandscapeView from './SeasonalLandscapeView';

// 運動健康類
import RunningTrackView from './RunningTrackView';
// import MoodDiaryView from './MoodDiaryView';  // 移除心情日记功能，还未实现
import FitnessChallengeView from './FitnessChallengeView';

// 未來科技類
import AIPredictionView from './AIPredictionView';
import ARView from './ARView';
import Cube3DView from './Cube3DView';

// 日系家庭專用
import BentoBoxView from './BentoBoxView';
import FamilyNotebookView from './FamilyNotebookView';
import OrigamiCalendarView from './OrigamiCalendarView';
import RyokanStyleView from './RyokanStyleView';
import SeasonalHarmonyView from './SeasonalHarmonyView';

interface CalendarViewSelectorProps extends CalendarViewProps {
  style?: CalendarStyleId;
}

export default function CalendarViewSelector({
  style,
  ...calendarProps
}: CalendarViewSelectorProps) {
  const [currentStyle, setCurrentStyle] = useState<CalendarStyleId>('grid-month');

  useEffect(() => {
    loadCalendarStyle();
  }, []);

  // 定期檢查樣式變化，確保切換能正常工作
  useEffect(() => {
    const checkStyleChange = async () => {
      try {
        const savedStyle = await AsyncStorage.getItem('calendar_style');
        if (savedStyle && isValidCalendarStyle(savedStyle) && savedStyle !== currentStyle) {
          setCurrentStyle(savedStyle as CalendarStyleId);
        }
      } catch (error) {
        console.error('Error checking calendar style:', error);
      }
    };
    
    // 每次組件更新時檢查
    checkStyleChange();
    
    // 設置定時檢查，但頻率較低
    const interval = setInterval(checkStyleChange, 2000);
    
    return () => clearInterval(interval);
  });

  useEffect(() => {
    if (style) {
      setCurrentStyle(style);
    }
  }, [style]);

  const loadCalendarStyle = async () => {
    try {
      const savedStyle = await AsyncStorage.getItem('calendar_style');
      if (savedStyle && isValidCalendarStyle(savedStyle)) {
        setCurrentStyle(savedStyle as CalendarStyleId);
      }
    } catch (error) {
      console.error('Error loading calendar style:', error);
    }
  };

  // 轉換事件數據以適配不同組件的Event類型
  const convertEventsForCustomViews = (events: CalendarViewProps['events']) => {
    return events.map(event => ({
      ...event,
      date: new Date(event.start_ts * 1000), // 確保正確的時間戳轉換
    }));
  };

  // 轉換事件數據以適配AR類型的組件
  const convertEventsForARView = (events: CalendarViewProps['events']) => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start_ts: event.start_ts,
      end_ts: event.end_ts,
      importance: 'medium' as const,
      category: event.type,
      color: event.color,
    }));
  };

  // 創建包裝的回調函數以處理型別轉換
  const createCustomViewEventHandler = (originalHandler: (event: CalendarEvent) => void) => {
    return (event: { id: string; title: string; date: Date; [key: string]: any }) => {
      // 找到原始的 CalendarEvent
      const originalEvent = calendarProps.events.find(e => e.id === event.id);
      if (originalEvent) {
        originalHandler(originalEvent);
      }
    };
  };

  const createARViewEventHandler = (originalHandler: (event: CalendarEvent) => void) => {
    return (event: { id: string; start_ts: number; end_ts?: number; [key: string]: any }) => {
      // 找到原始的 CalendarEvent
      const originalEvent = calendarProps.events.find(e => e.id === event.id);
      if (originalEvent) {
        originalHandler(originalEvent);
      }
    };
  };

  const isValidCalendarStyle = (style: string): boolean => {
    const validStyles: CalendarStyleId[] = [
      // 基礎樣式
      'grid-month',
      'weekly-grid',
      'timeline',
      'day-focus',
      'agenda-list',
      'compact-month',
      'three-day',
      'family-grid',
      'family-orbit',
      'family-puzzle',
      'family-garden',
      'card-month',
      'year-overview',
      // 視覺創新類
      'cloud-floating',
      'constellation-wheel',
      'subway-map',
      'garden-plant',
      // 互動遊戲類
      'puzzle-piece',
      'fishing-pond',
      'space-exploration',
      'treasure-map',
      // 數據可視化類
      'heatmap',
      'gantt-chart',
      'heartbeat',
      'bubble-chart',
      // 情境主題類
      'seasonal-landscape',
      'bookshelf',
      'music-staff',
      'kitchen-recipe',
      // 運動健康類
      'running-track',
      'mood-diary',
      'fitness-challenge',
      // 未來科技類
      'cube-3d',
      'ai-prediction',
      'ar-view',
      // 日系家庭專用
      'seasonal-harmony',
      'family-notebook',
      'bento-box',
      'origami-calendar',
      'ryokan-style',
    ];
    return validStyles.includes(style as CalendarStyleId);
  };

  const renderCalendarView = () => {
    switch (currentStyle) {
      // 基礎樣式
      case 'grid-month':
        return <GridMonthView {...calendarProps} />;
      case 'weekly-grid':
        return <WeeklyGridView {...calendarProps} />;
      case 'timeline':
        return <TimelineView {...calendarProps} />;
      case 'day-focus':
        return <DayFocusView {...calendarProps} />;
      case 'agenda-list':
        return <AgendaListView {...calendarProps} />;
      case 'compact-month':
        return <CompactMonthView {...calendarProps} />;
      case 'three-day':
        return <ThreeDayView {...calendarProps} />;
      case 'family-grid':
        return <FamilyGridView {...calendarProps} />;
      case 'family-orbit':
        return <FamilyOrbitView {...calendarProps} />;
      case 'family-puzzle':
        return <FamilyPuzzleView {...calendarProps} />;
      case 'family-garden':
        return <FamilyGardenView {...calendarProps} />;
      case 'card-month':
        return <CardMonthView {...calendarProps} />;
      case 'year-overview':
        return <YearOverviewView {...calendarProps} />;
      
      // 視覺創新類
      case 'cloud-floating':
        return <CloudFloatingView {...calendarProps} />;
      case 'constellation-wheel':
        return <ConstellationWheelView {...calendarProps} />;
      case 'subway-map':
        return <SubwayMapView {...calendarProps} />;
      case 'garden-plant':
        return <GardenPlantView {...calendarProps} />;
      
      // 互動遊戲類
      case 'puzzle-piece':
        return <PuzzlePieceView {...calendarProps} />;
      case 'fishing-pond':
        return <FishingPondView {...calendarProps} />;
      case 'space-exploration':
        return <SpaceExplorationView {...calendarProps} />;
      case 'treasure-map':
        return <TreasureMapView {...calendarProps} />;
      
      // 數據可視化類
      case 'heatmap':
        return <HeatmapView {...calendarProps} />;
      case 'gantt-chart':
        return <GanttChartView {...calendarProps} />;
      case 'heartbeat':
        return <HeartbeatView {...calendarProps} />;
      case 'bubble-chart':
        return <BubbleChartView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
      
      // 情境主題類
      case 'seasonal-landscape':
        return <SeasonalLandscapeView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
      case 'bookshelf':
        return <BookshelfView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
      case 'music-staff':
        return <MusicStaffView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
      case 'kitchen-recipe':
        return <KitchenRecipeView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
      
      // 運動健康類
      case 'running-track':
        return <RunningTrackView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
      // case 'mood-diary':
      //   return <MoodDiaryView 
      //     events={convertEventsForCustomViews(calendarProps.events)}
      //     currentDate={calendarProps.selectedDate}
      //     onDateSelect={calendarProps.onDatePress}
      //     selectedDate={calendarProps.selectedDate}
      //     currentMonth={calendarProps.currentMonth}
      //     onEventPress={calendarProps.onEventPress}
      //     onMonthChange={calendarProps.onMonthChange}
      //   />;  // 移除心情日记功能，还未实现
      case 'fitness-challenge':
        return <FitnessChallengeView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
      
      // 未來科技類
      case 'cube-3d':
        return <Cube3DView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
      case 'ai-prediction':
        return <AIPredictionView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
      case 'ar-view':
        return <ARView 
          events={convertEventsForARView(calendarProps.events)}
          selectedDate={calendarProps.selectedDate}
          onDatePress={calendarProps.onDatePress}
          onEventPress={createARViewEventHandler(calendarProps.onEventPress)}
        />;
      
      // 日系家庭專用
      case 'seasonal-harmony':
        return <SeasonalHarmonyView {...calendarProps} />;
      case 'family-notebook':
        return <FamilyNotebookView {...calendarProps} />;
      case 'bento-box':
        return <BentoBoxView {...calendarProps} />;
      case 'origami-calendar':
        return <OrigamiCalendarView {...calendarProps} />;
      case 'ryokan-style':
        return <RyokanStyleView {...calendarProps} />;
      
      default:
        return <GridMonthView {...calendarProps} />;
    }
  };

  return renderCalendarView();
} 