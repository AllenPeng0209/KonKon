import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CalendarStyleId } from '../components/calendar/CalendarViewTypes';
import { useFeatureSettings } from '../contexts/FeatureSettingsContext';
import { t } from '../lib/i18n';

const { width } = Dimensions.get('window');

interface StyleOption {
  id: CalendarStyleId;
  nameKey: string;
  descriptionKey: string;
  emoji: string;
  categoryKey: string;
  color: string;
}

const styleOptions: StyleOption[] = [
  // 基礎樣式
  { id: 'grid-month', nameKey: 'gridMonth', descriptionKey: 'gridMonthDesc', emoji: '📅', categoryKey: 'basic', color: '#3b82f6' },
  { id: 'card-month', nameKey: 'cardMonth', descriptionKey: 'cardMonthDesc', emoji: '🗂️', categoryKey: 'family', color: '#8b5cf6' },
  { id: 'weekly-grid', nameKey: 'weeklyGrid', descriptionKey: 'weeklyGridDesc', emoji: '📊', categoryKey: 'basic', color: '#10b981' },
  { id: 'timeline', nameKey: 'timeline', descriptionKey: 'timelineDesc', emoji: '⏰', categoryKey: 'basic', color: '#f59e0b' },
  { id: 'day-focus', nameKey: 'dayFocus', descriptionKey: 'dayFocusDesc', emoji: '🎯', categoryKey: 'basic', color: '#ef4444' },
  { id: 'agenda-list', nameKey: 'agendaList', descriptionKey: 'agendaListDesc', emoji: '📋', categoryKey: 'basic', color: '#8b5cf6' },
  { id: 'compact-month', nameKey: 'compactMonth', descriptionKey: 'compactMonthDesc', emoji: '📆', categoryKey: 'basic', color: '#06b6d4' },
  { id: 'three-day', nameKey: 'threeDayView', descriptionKey: 'threeDayViewDesc', emoji: '📖', categoryKey: 'basic', color: '#f97316' },
  
  // 家庭專用
  { id: 'family-grid', nameKey: 'familyGrid', descriptionKey: 'familyGridDesc', emoji: '👨‍👩‍👧‍👦', categoryKey: 'family', color: '#f97316' },
  { id: 'family-orbit', nameKey: 'familyOrbit', descriptionKey: 'familyOrbitDesc', emoji: '🌀', categoryKey: 'family', color: '#6366f1' },
  { id: 'family-puzzle', nameKey: 'familyPuzzle', descriptionKey: 'familyPuzzleDesc', emoji: '🧩', categoryKey: 'family', color: '#ec4899' },
  { id: 'family-garden', nameKey: 'familyGarden', descriptionKey: 'familyGardenDesc', emoji: '🌻', categoryKey: 'family', color: '#22c55e' },
  { id: 'year-overview', nameKey: 'yearOverview', descriptionKey: 'yearOverviewDesc', emoji: '📅', categoryKey: 'family', color: '#059669' },
  
  // 視覺創新類
  { id: 'cloud-floating', nameKey: 'cloudFloating', descriptionKey: 'cloudFloatingDesc', emoji: '☁️', categoryKey: 'visual', color: '#38bdf8' },
  { id: 'constellation-wheel', nameKey: 'constellationWheel', descriptionKey: 'constellationWheelDesc', emoji: '⭐', categoryKey: 'visual', color: '#a855f7' },
  { id: 'subway-map', nameKey: 'subwayMap', descriptionKey: 'subwayMapDesc', emoji: '🚇', categoryKey: 'visual', color: '#ef4444' },
  { id: 'garden-plant', nameKey: 'gardenPlant', descriptionKey: 'gardenPlantDesc', emoji: '🌱', categoryKey: 'visual', color: '#22c55e' },
  
  // 互動遊戲類
  { id: 'puzzle-piece', nameKey: 'puzzlePiece', descriptionKey: 'puzzlePieceDesc', emoji: '🧩', categoryKey: 'interactive', color: '#f59e0b' },
  { id: 'fishing-pond', nameKey: 'fishingPond', descriptionKey: 'fishingPondDesc', emoji: '🎣', categoryKey: 'interactive', color: '#06b6d4' },
  { id: 'space-exploration', nameKey: 'spaceExploration', descriptionKey: 'spaceExplorationDesc', emoji: '🚀', categoryKey: 'interactive', color: '#8b5cf6' },
  { id: 'treasure-map', nameKey: 'treasureMap', descriptionKey: 'treasureMapDesc', emoji: '🗺️', categoryKey: 'interactive', color: '#f97316' },
  
  // 數據可視化類
  { id: 'heatmap', nameKey: 'heatmap', descriptionKey: 'heatmapDesc', emoji: '🔥', categoryKey: 'dataViz', color: '#ef4444' },
  { id: 'gantt-chart', nameKey: 'ganttChart', descriptionKey: 'ganttChartDesc', emoji: '📊', categoryKey: 'dataViz', color: '#059669' },
  { id: 'heartbeat', nameKey: 'heartbeat', descriptionKey: 'heartbeatDesc', emoji: '💓', categoryKey: 'dataViz', color: '#ec4899' },
  { id: 'bubble-chart', nameKey: 'bubbleChart', descriptionKey: 'bubbleChartDesc', emoji: '🫧', categoryKey: 'dataViz', color: '#38bdf8' },
  
  // 情境主題類
  { id: 'seasonal-landscape', nameKey: 'seasonalLandscape', descriptionKey: 'seasonalLandscapeDesc', emoji: '🏞️', categoryKey: 'theme', color: '#22c55e' },
  { id: 'bookshelf', nameKey: 'bookshelf', descriptionKey: 'bookshelfDesc', emoji: '📚', categoryKey: 'theme', color: '#92400e' },
  { id: 'music-staff', nameKey: 'musicStaff', descriptionKey: 'musicStaffDesc', emoji: '🎵', categoryKey: 'theme', color: '#a855f7' },
  { id: 'kitchen-recipe', nameKey: 'kitchenRecipe', descriptionKey: 'kitchenRecipeDesc', emoji: '👨‍🍳', categoryKey: 'theme', color: '#f59e0b' },
  
  // 運動健康類
  { id: 'running-track', nameKey: 'runningTrack', descriptionKey: 'runningTrackDesc', emoji: '🏃‍♂️', categoryKey: 'fitness', color: '#ef4444' },
  { id: 'mood-diary', nameKey: 'moodDiary', descriptionKey: 'moodDiaryDesc', emoji: '😊', categoryKey: 'fitness', color: '#ec4899' },
  { id: 'fitness-challenge', nameKey: 'fitnessChallenge', descriptionKey: 'fitnessChallengeDesc', emoji: '💪', categoryKey: 'fitness', color: '#f97316' },
  
  // 未來科技類
  { id: 'cube-3d', nameKey: 'cube3d', descriptionKey: 'cube3dDesc', emoji: '🔷', categoryKey: 'tech', color: '#06b6d4' },
  { id: 'ai-prediction', nameKey: 'aiPrediction', descriptionKey: 'aiPredictionDesc', emoji: '🤖', categoryKey: 'tech', color: '#22c55e' },
  { id: 'ar-view', nameKey: 'arView', descriptionKey: 'arViewDesc', emoji: '🔮', categoryKey: 'tech', color: '#8b5cf6' },
  
  // 日系家庭專用
  { id: 'seasonal-harmony', nameKey: 'seasonalHarmony', descriptionKey: 'seasonalHarmonyDesc', emoji: '🌸', categoryKey: 'japanese', color: '#f472b6' },
  { id: 'family-notebook', nameKey: 'familyNotebook', descriptionKey: 'familyNotebookDesc', emoji: '📔', categoryKey: 'japanese', color: '#a855f7' },
  { id: 'bento-box', nameKey: 'bentoBox', descriptionKey: 'bentoBoxDesc', emoji: '🍱', categoryKey: 'japanese', color: '#84cc16' },
  { id: 'origami-calendar', nameKey: 'origamiCalendar', descriptionKey: 'origamiCalendarDesc', emoji: '🎎', categoryKey: 'japanese', color: '#f59e0b' },
  { id: 'ryokan-style', nameKey: 'ryokanStyle', descriptionKey: 'ryokanStyleDesc', emoji: '🏮', categoryKey: 'japanese', color: '#f97316' },
];

export default function CalendarStyleSelection() {
  const router = useRouter();
  const { featureSettings, updateFeatureSetting } = useFeatureSettings();
  const [selectedStyle, setSelectedStyle] = useState<CalendarStyleId>('grid-month');

  useEffect(() => {
    const currentStyle = featureSettings.familySchedule?.settings?.selectedStyle;
    if (currentStyle) {
      // 將中文樣式名稱轉換為樣式ID
      const styleMap: Record<string, CalendarStyleId> = {
        '網格月視圖': 'grid-month',
        '週間網格': 'weekly-grid',
        '時間線視圖': 'timeline',
        '每日聚焦': 'day-focus',
        '議程列表': 'agenda-list',
        '緊湊月視圖': 'compact-month',
        '三日視圖': 'three-day',
        '家庭網格': 'family-grid',
        '家庭軌道': 'family-orbit',
        '家庭拼圖': 'family-puzzle',
        '家庭花園': 'family-garden',
        '卡片月視圖': 'card-month',
        '年度概覽': 'year-overview',
        '雲朵漂浮': 'cloud-floating',
        '星座輪盤': 'constellation-wheel',
        '地鐵圖': 'subway-map',
        '花園植物': 'garden-plant',
        '拼圖片': 'puzzle-piece',
        '釣魚池': 'fishing-pond',
        '太空探索': 'space-exploration',
        '尋寶圖': 'treasure-map',
        '熱力圖': 'heatmap',
        '甘特圖': 'gantt-chart',
        '心跳圖': 'heartbeat',
        '氣泡圖': 'bubble-chart',
        '季節風景': 'seasonal-landscape',
        '書架視圖': 'bookshelf',
        '音樂五線譜': 'music-staff',
        '廚房食譜': 'kitchen-recipe',
        '跑道視圖': 'running-track',
        '心情日記': 'mood-diary',
        '健身挑戰': 'fitness-challenge',
        '3D立方體': 'cube-3d',
        'AI預測': 'ai-prediction',
        'AR視圖': 'ar-view',
        '四季和諧': 'seasonal-harmony',
        '家庭手帳': 'family-notebook',
        '便當盒': 'bento-box',
        '摺紙日曆': 'origami-calendar',
        '旅館風格': 'ryokan-style',
      };
      setSelectedStyle(styleMap[currentStyle] || 'grid-month');
    }
  }, []);

  const handleStyleSelect = async (styleId: CalendarStyleId) => {
    setSelectedStyle(styleId);
    
    // 獲取翻譯後的樣式名稱
    const selectedOption = styleOptions.find(option => option.id === styleId);
    const styleName = selectedOption ? t(`calendarStyleSelector.styles.${selectedOption.nameKey}` as any) : t('calendarStyleSelector.styles.gridMonth');
    
    // 保存到FeatureSettings
    await updateFeatureSetting('familySchedule', featureSettings.familySchedule.enabled, {
      ...featureSettings.familySchedule.settings,
      selectedStyle: styleName
    });

    // 同時保存到AsyncStorage的calendar_style鍵中，讓CalendarViewSelector能檢測到變化
    try {
      await AsyncStorage.setItem('calendar_style', styleId);
    } catch (error) {
      console.error('Error saving calendar style to AsyncStorage:', error);
    }

    // 延遲一下再返回，讓用戶看到選擇效果
    setTimeout(() => {
      router.back();
    }, 500);
  };

  const groupedOptions = styleOptions.reduce((acc, option) => {
    const categoryName = t(`calendarStyleSelector.categories.${option.categoryKey}` as any);
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(option);
    return acc;
  }, {} as Record<string, StyleOption[]>);

  const renderStyleOption = (option: StyleOption) => {
    const isSelected = selectedStyle === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.styleOption,
          isSelected && styles.styleOptionSelected,
          { borderColor: option.color }
        ]}
        onPress={() => handleStyleSelect(option.id)}
      >
        <View style={[styles.styleEmoji, { backgroundColor: option.color + '20' }]}>
          <Text style={styles.emojiText}>{option.emoji}</Text>
        </View>
        <View style={styles.styleInfo}>
          <Text style={[styles.styleName, isSelected && styles.styleNameSelected]}>
            {t(`calendarStyleSelector.styles.${option.nameKey}` as any)}
          </Text>
          <Text style={styles.styleDescription}>
            {t(`calendarStyleSelector.descriptions.${option.descriptionKey}` as any)}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={option.color} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頭部 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('calendarStyleSelector.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 內容 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedOptions).map(([category, options]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {options.map(renderStyleOption)}
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('calendarStyleSelector.footerText')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    paddingLeft: 5,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  styleOptionSelected: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
  },
  styleEmoji: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emojiText: {
    fontSize: 24,
  },
  styleInfo: {
    flex: 1,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  styleNameSelected: {
    color: '#1f2937',
  },
  styleDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 