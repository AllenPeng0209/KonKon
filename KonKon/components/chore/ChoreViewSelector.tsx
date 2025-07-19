import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ChoreViewProps, ChoreViewStyleId } from './ChoreViewTypes';

// 基礎視圖組件
import TaskBoardView from './TaskBoardView';
import CalendarGridView from './CalendarGridView';
import TimelineView from './TimelineView';
import ListView from './ListView';

// 家庭專用視圖組件
import FamilyDashboardView from './FamilyDashboardView';
import MemberRotationView from './MemberRotationView';
import ResponsibilityWheelView from './ResponsibilityWheelView';
import FamilyTreeView from './FamilyTreeView';

// 遊戲化視圖組件
import AchievementBoardView from './AchievementBoardView';
import ProgressGardenView from './ProgressGardenView';
import SkillTreeView from './SkillTreeView';
import TreasureHuntView from './TreasureHuntView';
import CleaningAdventureView from './CleaningAdventureView';

// 數據可視化視圖組件
import StatsDashboardView from './StatsDashboardView';
import CompletionHeatmapView from './CompletionHeatmapView';
import WorkloadBalanceView from './WorkloadBalanceView';
import TimeTrackerView from './TimeTrackerView';
import PointsLeaderboardView from './PointsLeaderboardView';

// 情境主題視圖組件
import KitchenCommanderView from './KitchenCommanderView';
import CleaningNinjaView from './CleaningNinjaView';
import HomeHeroView from './HomeHeroView';
import DailyQuestView from './DailyQuestView';
import ChoreCafeView from './ChoreCafeView';

// 效率管理視圖組件
import SmartSchedulerView from './SmartSchedulerView';
import WorkloadOptimizerView from './WorkloadOptimizerView';
import PriorityMatrixView from './PriorityMatrixView';
import TimeBlocksView from './TimeBlocksView';

// 趣味創新視圖組件
import SpaceStationView from './SpaceStationView';
import FairyTaleCastleView from './FairyTaleCastleView';
import MagicHouseView from './MagicHouseView';
import RobotAssistantView from './RobotAssistantView';
import SeasonalChoresView from './SeasonalChoresView';

interface ChoreViewSelectorProps extends ChoreViewProps {
  style?: ChoreViewStyleId;
}

export default function ChoreViewSelector({
  style,
  ...choreProps
}: ChoreViewSelectorProps) {
  const [currentStyle, setCurrentStyle] = useState<ChoreViewStyleId>('task-board');

  useEffect(() => {
    loadChoreViewStyle();
  }, []);

  // 定期檢查樣式變化
  useEffect(() => {
    const checkStyleChange = async () => {
      try {
        const savedStyle = await AsyncStorage.getItem('chore_view_style');
        if (savedStyle && isValidChoreViewStyle(savedStyle) && savedStyle !== currentStyle) {
          setCurrentStyle(savedStyle as ChoreViewStyleId);
        }
      } catch (error) {
        console.error('Error checking chore view style:', error);
      }
    };
    
    checkStyleChange();
    const interval = setInterval(checkStyleChange, 2000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    if (style) {
      setCurrentStyle(style);
    }
  }, [style]);

  const loadChoreViewStyle = async () => {
    try {
      const savedStyle = await AsyncStorage.getItem('chore_view_style');
      if (savedStyle && isValidChoreViewStyle(savedStyle)) {
        setCurrentStyle(savedStyle as ChoreViewStyleId);
      }
    } catch (error) {
      console.error('Error loading chore view style:', error);
    }
  };

  const isValidChoreViewStyle = (style: string): boolean => {
    const validStyles: ChoreViewStyleId[] = [
      // 基礎視圖
      'task-board',
      'calendar-grid',
      'timeline',
      'list',
      
      // 家庭專用視圖
      'family-dashboard',
      'member-rotation',
      'responsibility-wheel',
      'family-tree',
      
      // 遊戲化視圖
      'achievement-board',
      'progress-garden',
      'skill-tree',
      'treasure-hunt',
      'cleaning-adventure',
      
      // 數據可視化視圖
      'stats-dashboard',
      'completion-heatmap',
      'workload-balance',
      'time-tracker',
      'points-leaderboard',
      
      // 情境主題視圖
      'kitchen-commander',
      'cleaning-ninja',
      'home-hero',
      'daily-quest',
      'chore-cafe',
      
      // 效率管理視圖
      'smart-scheduler',
      'workload-optimizer',
      'priority-matrix',
      'time-blocks',
      
      // 趣味創新視圖
      'space-station',
      'fairy-tale-castle',
      'magic-house',
      'robot-assistant',
      'seasonal-chores',
    ];
    return validStyles.includes(style as ChoreViewStyleId);
  };

  const renderChoreView = () => {
    switch (currentStyle) {
      // 基礎視圖
      case 'task-board':
        return <TaskBoardView {...choreProps} />;
      case 'calendar-grid':
        return <CalendarGridView {...choreProps} />;
      case 'timeline':
        return <TimelineView {...choreProps} />;
      case 'list':
        return <ListView {...choreProps} />;
      
      // 家庭專用視圖
      case 'family-dashboard':
        return <FamilyDashboardView {...choreProps} />;
      case 'member-rotation':
        return <MemberRotationView {...choreProps} />;
      case 'responsibility-wheel':
        return <ResponsibilityWheelView {...choreProps} />;
      case 'family-tree':
        return <FamilyTreeView {...choreProps} />;
      
      // 遊戲化視圖
      case 'achievement-board':
        return <AchievementBoardView {...choreProps} />;
      case 'progress-garden':
        return <ProgressGardenView {...choreProps} />;
      case 'skill-tree':
        return <SkillTreeView {...choreProps} />;
      case 'treasure-hunt':
        return <TreasureHuntView {...choreProps} />;
      case 'cleaning-adventure':
        return <CleaningAdventureView {...choreProps} />;
      
      // 數據可視化視圖
      case 'stats-dashboard':
        return <StatsDashboardView {...choreProps} />;
      case 'completion-heatmap':
        return <CompletionHeatmapView {...choreProps} />;
      case 'workload-balance':
        return <WorkloadBalanceView {...choreProps} />;
      case 'time-tracker':
        return <TimeTrackerView {...choreProps} />;
      case 'points-leaderboard':
        return <PointsLeaderboardView {...choreProps} />;
      
      // 情境主題視圖
      case 'kitchen-commander':
        return <KitchenCommanderView {...choreProps} />;
      case 'cleaning-ninja':
        return <CleaningNinjaView {...choreProps} />;
      case 'home-hero':
        return <HomeHeroView {...choreProps} />;
      case 'daily-quest':
        return <DailyQuestView {...choreProps} />;
      case 'chore-cafe':
        return <ChoreCafeView {...choreProps} />;
      
      // 效率管理視圖
      case 'smart-scheduler':
        return <SmartSchedulerView {...choreProps} />;
      case 'workload-optimizer':
        return <WorkloadOptimizerView {...choreProps} />;
      case 'priority-matrix':
        return <PriorityMatrixView {...choreProps} />;
      case 'time-blocks':
        return <TimeBlocksView {...choreProps} />;
      
      // 趣味創新視圖
      case 'space-station':
        return <SpaceStationView {...choreProps} />;
      case 'fairy-tale-castle':
        return <FairyTaleCastleView {...choreProps} />;
      case 'magic-house':
        return <MagicHouseView {...choreProps} />;
      case 'robot-assistant':
        return <RobotAssistantView {...choreProps} />;
      case 'seasonal-chores':
        return <SeasonalChoresView {...choreProps} />;
      
      default:
        return <TaskBoardView {...choreProps} />;
    }
  };

  return renderChoreView();
}