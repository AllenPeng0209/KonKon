import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { t } from '../../lib/i18n';
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
import FitnessChallengeView from './FitnessChallengeView';
import MoodDiaryView from './MoodDiaryView';
import RunningTrackView from './RunningTrackView';

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
  // 年月選擇器狀態
  const [isYearMonthPickerVisible, setIsYearMonthPickerVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // ScrollView refs for auto-scrolling
  const yearScrollViewRef = useRef<ScrollView>(null);
  const monthScrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadCalendarStyle();
    // 初始化當前年月
    const [year, month] = calendarProps.currentMonth.split('-').map(Number);
    setSelectedYear(year);
    setSelectedMonth(month);
  }, [calendarProps.currentMonth]);

  // 當彈窗打開時，自動滾動到當前選中的年月
  useEffect(() => {
    if (isYearMonthPickerVisible) {
      // 延遲執行滾動，確保組件已經渲染
      setTimeout(() => {
        scrollToSelectedItems();
      }, 300);
    }
  }, [isYearMonthPickerVisible]);

  // 滾動到選中項的函數
  const scrollToSelectedItems = () => {
    const years = generateYears();
    const yearIndex = years.indexOf(selectedYear);
    const monthIndex = selectedMonth - 1;

    // 每個item的高度：paddingVertical(16*2) + marginVertical(2*2) = 36px
    const itemHeight = 36;
    // ScrollView的可見高度約為240，所以中心位置偏移約120
    const centerOffset = 120;
    
    if (yearScrollViewRef.current && yearIndex >= 0) {
      const scrollY = Math.max(0, yearIndex * itemHeight - centerOffset);
      yearScrollViewRef.current.scrollTo({
        y: scrollY,
        animated: true,
      });
    }

    if (monthScrollViewRef.current && monthIndex >= 0) {
      const scrollY = Math.max(0, monthIndex * itemHeight - centerOffset);
      monthScrollViewRef.current.scrollTo({
        y: scrollY,
        animated: true,
      });
    }
  };

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

  // 處理年月選擇確認
  const handleYearMonthConfirm = () => {
    const newMonth = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    if (calendarProps.onMonthChange) {
      calendarProps.onMonthChange(newMonth);
    }
    setIsYearMonthPickerVisible(false);
  };

  // 生成年份列表（當前年份前後各10年）
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // 月份選項
  const months = [
    { value: 1, label: t('yearMonthPicker.months.1') },
    { value: 2, label: t('yearMonthPicker.months.2') },
    { value: 3, label: t('yearMonthPicker.months.3') },
    { value: 4, label: t('yearMonthPicker.months.4') },
    { value: 5, label: t('yearMonthPicker.months.5') },
    { value: 6, label: t('yearMonthPicker.months.6') },
    { value: 7, label: t('yearMonthPicker.months.7') },
    { value: 8, label: t('yearMonthPicker.months.8') },
    { value: 9, label: t('yearMonthPicker.months.9') },
    { value: 10, label: t('yearMonthPicker.months.10') },
    { value: 11, label: t('yearMonthPicker.months.11') },
    { value: 12, label: t('yearMonthPicker.months.12') },
  ];

  // 處理樣式選擇
  const handleStyleSelect = async (styleId: CalendarStyleId, styleName: string) => {
    try {
      await AsyncStorage.setItem('calendar_style', styleId);
      setCurrentStyle(styleId);
      
      Alert.alert(
        t('calendarStyleSelector.changeSuccess'),
        t('calendarStyleSelector.changeSuccessMessage', { styleName })
      );
    } catch (error) {
      console.error('Failed to save calendar style:', error);
      Alert.alert(
        t('calendarStyleSelector.saveFailed'),
        t('calendarStyleSelector.saveFailedMessage')
      );
    }
  };

  // 處理長按手勢
  const handleLongPress = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      console.log('Long press detected on calendar - showing style options');
      
      // 使用多語言翻譯的樣式選擇對話框
      Alert.alert(
        t('calendarStyleSelector.alertTitle'),
        t('calendarStyleSelector.alertSubtitle'),
        [
          { 
            text: `📅 ${t('calendarStyleSelector.styles.gridMonth')}`, 
            onPress: () => handleStyleSelect('grid-month', t('calendarStyleSelector.styles.gridMonth')) 
          },
          { 
            text: `📊 ${t('calendarStyleSelector.styles.weeklyGrid')}`, 
            onPress: () => handleStyleSelect('weekly-grid', t('calendarStyleSelector.styles.weeklyGrid')) 
          },
          { 
            text: `🎴 ${t('calendarStyleSelector.styles.cardMonth')}`, 
            onPress: () => handleStyleSelect('card-month', t('calendarStyleSelector.styles.cardMonth')) 
          },
          { 
            text: `📋 ${t('calendarStyleSelector.styles.agendaList')}`, 
            onPress: () => handleStyleSelect('agenda-list', t('calendarStyleSelector.styles.agendaList')) 
          },
          { 
            text: `⏰ ${t('calendarStyleSelector.styles.timeline')}`, 
            onPress: () => handleStyleSelect('timeline', t('calendarStyleSelector.styles.timeline')) 
          },
          { text: t('calendarStyleSelector.cancel'), style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  // 轉換事件數據以適配不同組件的Event類型
  const convertEventsForCustomViews = (events: CalendarEvent[]) => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_ts),
      end: new Date(event.end_ts),
      date: new Date(event.start_ts), // 添加缺失的date屬性
      color: event.color || '#007AFF',
      description: event.description,
    }));
  };

  // 創建包裝的回調函數以處理型別轉換
  const createCustomViewEventHandler = (originalHandler: (event: CalendarEvent) => void) => {
    return (customEvent: any) => {
      // 將自定義事件轉換回原始格式
      const originalEvent: CalendarEvent = {
        id: customEvent.id,
        title: customEvent.title,
        description: customEvent.description,
        start_ts: customEvent.start.getTime(),
        end_ts: customEvent.end.getTime(),
        color: customEvent.color,
        type: 'event',
      };
      originalHandler(originalEvent);
    };
  };

  // 轉換事件數據以適配AR類型的組件
  const convertEventsForARView = (events: CalendarEvent[]) => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_ts),
      end: new Date(event.end_ts),
      start_ts: event.start_ts, // 添加必要的start_ts屬性
      end_ts: event.end_ts,     // 添加必要的end_ts屬性
      color: event.color || '#007AFF',
      description: event.description,
      location: event.location,
    }));
  };

  const createARViewEventHandler = (originalHandler: (event: CalendarEvent) => void) => {
    return (arEvent: any) => {
      const originalEvent: CalendarEvent = {
        id: arEvent.id,
        title: arEvent.title,
        description: arEvent.description,
        start_ts: arEvent.start.getTime(),
        end_ts: arEvent.end.getTime(),
        color: arEvent.color,
        location: arEvent.location,
        type: 'event',
      };
      originalHandler(originalEvent);
    };
  };

  const isValidCalendarStyle = (style: string): boolean => {
    const validStyles = [
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
      'cloud-floating',
      'constellation-wheel',
      'subway-map',
      'garden-plant',
      'puzzle-piece',
      'fishing-pond',
      'space-exploration',
      'treasure-map',
      'heatmap',
      'gantt-chart',
      'heartbeat',
      'bubble-chart',
      'seasonal-landscape',
      'bookshelf',
      'music-staff',
      'kitchen-recipe',
      'running-track',
      'mood-diary',
      'fitness-challenge',
      'cube-3d',
      'ai-prediction',
      'ar-view',
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
      case 'mood-diary':
        return <MoodDiaryView 
          events={convertEventsForCustomViews(calendarProps.events)}
          currentDate={calendarProps.selectedDate}
          onDateSelect={calendarProps.onDatePress}
          onEventPress={createCustomViewEventHandler(calendarProps.onEventPress)}
        />;
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

  // 獲取當前年月
  const getCurrentYearMonth = () => {
    const [year, month] = calendarProps.currentMonth.split('-').map(Number);
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return `${year}年${monthNames[month - 1]}`;
  };

  // 渲染年月選擇器模態框 - 超現代設計版本
  const renderYearMonthPicker = () => (
    <Modal
      visible={isYearMonthPickerVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsYearMonthPickerVisible(false)}
    >
      <View style={styles.modernModalOverlay}>
        <View style={styles.modernPickerContainer}>
          {/* 頂部拖拽指示器 */}
          <View style={styles.dragIndicator} />
          
          {/* 標題區域 */}
          <View style={styles.modernPickerHeader}>
            <Text style={styles.modernPickerTitle}>{t('yearMonthPicker.title')}</Text>
            <Text style={styles.modernPickerSubtitle}>{t('yearMonthPicker.subtitle')}</Text>
          </View>
          
          {/* 選擇器內容 */}
          <View style={styles.modernPickerContent}>
            {/* 年份選擇 */}
            <View style={styles.modernPickerColumn}>
              <View style={styles.modernColumnHeader}>
                <Text style={styles.modernColumnTitle}>{t('yearMonthPicker.year')}</Text>
                <View style={styles.modernSelectedIndicator}>
                  <Text style={styles.modernSelectedValue}>{selectedYear}</Text>
                </View>
              </View>
              <ScrollView 
                style={styles.modernPickerScrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                ref={yearScrollViewRef}
              >
                {generateYears().map((year, index) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.modernPickerItem,
                      selectedYear === year && styles.modernPickerItemSelected,
                    ]}
                    onPress={() => setSelectedYear(year)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modernPickerItemText,
                        selectedYear === year && styles.modernPickerItemTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                    {selectedYear === year && (
                      <View style={styles.modernSelectionGlow} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* 中間分隔線 */}
            <View style={styles.modernDivider} />
            
            {/* 月份選擇 */}
            <View style={styles.modernPickerColumn}>
              <View style={styles.modernColumnHeader}>
                <Text style={styles.modernColumnTitle}>{t('yearMonthPicker.month')}</Text>
                <View style={styles.modernSelectedIndicator}>
                  <Text style={styles.modernSelectedValue}>{selectedMonth}</Text>
                </View>
              </View>
              <ScrollView 
                style={styles.modernPickerScrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                ref={monthScrollViewRef}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month.value}
                    style={[
                      styles.modernPickerItem,
                      selectedMonth === month.value && styles.modernPickerItemSelected,
                    ]}
                    onPress={() => setSelectedMonth(month.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modernPickerItemText,
                        selectedMonth === month.value && styles.modernPickerItemTextSelected,
                      ]}
                    >
                      {month.label}
                    </Text>
                    {selectedMonth === month.value && (
                      <View style={styles.modernSelectionGlow} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          {/* 底部按鈕區域 */}
          <View style={styles.modernButtonArea}>
            <TouchableOpacity 
              style={styles.modernCancelButton}
              onPress={() => setIsYearMonthPickerVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modernCancelButtonText}>{t('yearMonthPicker.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modernConfirmButton}
              onPress={handleYearMonthConfirm}
              activeOpacity={0.8}
            >
              <View style={styles.modernConfirmGradient}>
                <Text style={styles.modernConfirmButtonText}>{t('yearMonthPicker.confirm')}</Text>
                <Text style={styles.modernConfirmEmoji}>✨</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // 渲染頂部 Header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 左側年月 - 可點擊 */}
      <TouchableOpacity 
        style={styles.headerLeft}
        onPress={() => setIsYearMonthPickerVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.yearMonthText}>
          {getCurrentYearMonth()}
        </Text>
        <Text style={styles.dropdownIndicator}>▼</Text>
      </TouchableOpacity>
      
      {/* 右側圖標 */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => Alert.alert(t('yearMonthPicker.searchTitle'), t('yearMonthPicker.searchPlaceholder'))}
        >
          <Text style={styles.iconText}>🔍</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleLongPress({ nativeEvent: { state: State.ACTIVE } })}
        >
          <Text style={styles.iconText}>📅</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16, // 減少間距
      paddingVertical: 10, // 減少間距
      backgroundColor: '#FAFAFA', // 更柔和的背景色
      borderBottomWidth: 0.5, // 更細的邊線
      borderBottomColor: '#E8E8E8',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, // 更輕微的陰影
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 2,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6, // 減少間距
      paddingHorizontal: 10,
      borderRadius: 8, // 減小圓角
      backgroundColor: 'rgba(0, 122, 255, 0.06)', // 更淡的背景色
    },
    yearMonthText: {
      fontSize: 15, // 減小字體
      fontWeight: '600',
      color: '#1D1D1F',
      marginRight: 4,
    },
    dropdownIndicator: {
      fontSize: 10, // 減小字體
      color: '#8E8E93',
      marginTop: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // 減少間距
    },
    iconButton: {
      padding: 8, // 減少間距
      borderRadius: 8, // 減小圓角
      backgroundColor: 'rgba(0, 0, 0, 0.04)', // 更淡的背景色
    },
    iconText: {
      fontSize: 16, // 減小字體
      color: '#6B6B6B', // 更柔和的顏色
    },
    // 移除舊的模態框樣式，全部使用新的現代化樣式
    modernModalOverlay: {
      flex: 1,
      justifyContent: 'center', // 改為中間彈出
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.4)', // 更淡的遮罩
    },
    modernPickerContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16, // 減小圓角
      width: '88%', // 稍微減小寬度
      maxHeight: '70%', // 減少高度
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12, // 更淡的陰影
      shadowRadius: 16,
      elevation: 8,
      paddingTop: 6,
    },
    dragIndicator: {
      width: 32, // 減小寬度
      height: 3, // 減小高度
      backgroundColor: '#D1D1D6',
      borderRadius: 1.5,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 16, // 減少間距
    },
    modernPickerHeader: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 18, // 減少間距
      borderBottomWidth: 0.5, // 更細的邊線
      borderBottomColor: '#F0F0F0',
    },
    modernPickerTitle: {
      fontSize: 20, // 減小字體  
      fontWeight: '700',
      color: '#1D1D1F',
      marginBottom: 6, // 減少間距
      letterSpacing: -0.3,
    },
    modernPickerSubtitle: {
      fontSize: 13, // 減小字體
      color: '#8E8E93',
      textAlign: 'center',
      lineHeight: 18, // 減少行高
    },
    modernPickerContent: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 20, // 減少間距
      gap: 16, // 減少間距
    },
    modernPickerColumn: {
      flex: 1,
    },
    modernColumnHeader: {
      marginBottom: 12, // 減少間距
      alignItems: 'center',
    },
    modernColumnTitle: {
      fontSize: 15, // 減小字體
      fontWeight: '600',
      color: '#1D1D1F',
      marginBottom: 6, // 減少間距
    },
    modernSelectedIndicator: {
      backgroundColor: 'rgba(0, 122, 255, 0.08)', // 更淡的背景色
      borderWidth: 1, // 減細邊框
      borderColor: 'rgba(0, 122, 255, 0.2)',
      borderRadius: 12, // 減小圓角
      paddingHorizontal: 12, // 減少間距
      paddingVertical: 6, // 減少間距
      minWidth: 50, // 減小最小寬度
      alignItems: 'center',
    },
    modernSelectedValue: {
      fontSize: 16, // 減小字體
      fontWeight: '700',
      color: '#007AFF',
    },
    modernPickerScrollView: {
      maxHeight: 200, // 減小高度
      borderRadius: 12, // 減小圓角
      backgroundColor: '#F9F9F9', // 更淡的背景色
      paddingHorizontal: 6, // 減少間距
    },
    scrollContent: {
      paddingVertical: 6, // 減少間距
    },
    modernPickerItem: {
      paddingVertical: 12, // 減少間距
      paddingHorizontal: 16, // 減少間距
      borderRadius: 8, // 減小圓角
      marginVertical: 1, // 減少間距
      backgroundColor: 'transparent',
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modernPickerItemSelected: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 1 }, // 更輕微的陰影
      shadowOpacity: 0.1,
      shadowRadius: 4, // 減小陰影範圍
      elevation: 2,
      borderWidth: 0.5, // 更細的邊框
      borderColor: 'rgba(0, 122, 255, 0.15)',
    },
    modernPickerItemText: {
      fontSize: 15, // 減小字體
      fontWeight: '500',
      color: '#1D1D1F',
      textAlign: 'center',
    },
    modernPickerItemTextSelected: {
      fontWeight: '700',
      color: '#007AFF',
      fontSize: 16, // 減小字體
    },
    modernSelectionGlow: {
      position: 'absolute',
      top: -1,
      bottom: -1,
      left: -1,
      right: -1,
      borderRadius: 9,
      backgroundColor: 'rgba(0, 122, 255, 0.05)', // 更淡的發光效果
      zIndex: -1,
    },
    modernDivider: {
      width: 1,
      backgroundColor: '#E8E8E8', // 更淡的分隔線
      borderRadius: 0.5,
      alignSelf: 'stretch',
      marginTop: 40, // 減少間距
      marginBottom: 16,
    },
    modernButtonArea: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 20, // 減少間距
      paddingTop: 18, // 減少間距
      backgroundColor: '#F9F9F9', // 更淡的背景色
      borderTopWidth: 0.5, // 更細的邊線
      borderTopColor: '#E8E8E8',
      borderBottomLeftRadius: 16, // 減小圓角
      borderBottomRightRadius: 16,
      gap: 10, // 減少間距
    },
    modernCancelButton: {
      flex: 1,
      paddingVertical: 12, // 減少間距
      borderRadius: 10, // 減小圓角
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      borderWidth: 0.5, // 更細的邊框
      borderColor: '#E0E0E0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, // 更輕微的陰影
      shadowOpacity: 0.04,
      shadowRadius: 1,
      elevation: 1,
    },
    modernCancelButtonText: {
      fontSize: 15, // 減小字體
      color: '#007AFF',
      fontWeight: '600',
    },
    modernConfirmButton: {
      flex: 2,
      paddingVertical: 12, // 減少間距
      borderRadius: 10, // 減小圓角
      backgroundColor: '#007AFF',
      alignItems: 'center',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 2 }, // 更輕微的陰影
      shadowOpacity: 0.2,
      shadowRadius: 4, // 減小陰影範圍
      elevation: 3,
    },
    modernConfirmGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modernConfirmButtonText: {
      fontSize: 15, // 減小字體
      color: '#FFFFFF',
      fontWeight: '700',
      letterSpacing: 0.3, // 減少字間距
    },
    modernConfirmEmoji: {
      fontSize: 16, // 減小字體
      marginLeft: 6, // 減少間距
    },
  });

  return (
    <LongPressGestureHandler
      onHandlerStateChange={handleLongPress}
      minDurationMs={800}
    >
      <View style={{ flex: 1 }}>
        {renderHeader()}
        {renderCalendarView()}
        {renderYearMonthPicker()}
      </View>
    </LongPressGestureHandler>
  );
} 