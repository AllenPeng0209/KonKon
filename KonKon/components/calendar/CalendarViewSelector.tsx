import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import AgendaListView from './AgendaListView';
import { CalendarStyleId, CalendarViewProps } from './CalendarViewTypes';
import CardMonthView from './CardMonthView';
import CompactMonthView from './CompactMonthView';
import DayFocusView from './DayFocusView';
import FamilyGridView from './FamilyGridView';
import FamilyOrbitView from './FamilyOrbitView';
import FamilyPuzzleView from './FamilyPuzzleView';
import FamilyGardenView from './FamilyGardenView';
import GridMonthView from './GridMonthView';
import ThreeDayView from './ThreeDayView';
import TimelineView from './TimelineView';
import WeeklyGridView from './WeeklyGridView';
import YearOverviewView from './YearOverviewView';

// 視覺創新類
import CloudFloatingView from './CloudFloatingView';
import ConstellationWheelView from './ConstellationWheelView';
import SubwayMapView from './SubwayMapView';
import GardenPlantView from './GardenPlantView';

// 互動遊戲類
import PuzzlePieceView from './PuzzlePieceView';
import FishingPondView from './FishingPondView';
import SpaceExplorationView from './SpaceExplorationView';
import TreasureMapView from './TreasureMapView';

// 數據可視化類
import HeatmapView from './HeatmapView';
import GanttChartView from './GanttChartView';
import HeartbeatView from './HeartbeatView';
import BubbleChartView from './BubbleChartView';

// 情境主題類
import SeasonalLandscapeView from './SeasonalLandscapeView';
import BookshelfView from './BookshelfView';
import MusicStaffView from './MusicStaffView';
import KitchenRecipeView from './KitchenRecipeView';

// 運動健康類
import RunningTrackView from './RunningTrackView';
import MoodDiaryView from './MoodDiaryView';
import FitnessChallengeView from './FitnessChallengeView';

// 未來科技類
import Cube3DView from './Cube3DView';
import AIPredictionView from './AIPredictionView';
import ARView from './ARView';

// 日系家庭專用
import SeasonalHarmonyView from './SeasonalHarmonyView';
import FamilyNotebookView from './FamilyNotebookView';
import BentoBoxView from './BentoBoxView';
import OrigamiCalendarView from './OrigamiCalendarView';
import RyokanStyleView from './RyokanStyleView';

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
      date: new Date(event.start_ts),
    }));
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
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      
      // 情境主題類
      case 'seasonal-landscape':
        return <SeasonalLandscapeView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      case 'bookshelf':
        return <BookshelfView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      case 'music-staff':
        return <MusicStaffView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      case 'kitchen-recipe':
        return <KitchenRecipeView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      
      // 運動健康類
      case 'running-track':
        return <RunningTrackView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      case 'mood-diary':
        return <MoodDiaryView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      case 'fitness-challenge':
        return <FitnessChallengeView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      
      // 未來科技類
      case 'cube-3d':
        return <Cube3DView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      case 'ai-prediction':
        return <AIPredictionView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          selectedDate={calendarProps.selectedDate}
          currentMonth={calendarProps.currentMonth}
          onEventPress={calendarProps.onEventPress}
          onMonthChange={calendarProps.onMonthChange}
        />;
      case 'ar-view':
        return <ARView {...calendarProps} />;
      
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