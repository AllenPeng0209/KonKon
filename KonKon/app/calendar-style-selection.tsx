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

const { width } = Dimensions.get('window');

interface StyleOption {
  id: CalendarStyleId;
  name: string;
  description: string;
  emoji: string;
  category: string;
  color: string;
}

const styleOptions: StyleOption[] = [
  // 基礎樣式
  { id: 'grid-month', name: '網格月視圖', description: '經典的月曆網格顯示', emoji: '📅', category: '基礎樣式', color: '#3b82f6' },
  { id: 'card-month', name: '卡片月視圖', description: '卡片式月曆布局', emoji: '🗂️', category: '家庭專用', color: '#8b5cf6' },
  { id: 'weekly-grid', name: '週間網格', description: '以週為單位的網格視圖', emoji: '📊', category: '基礎樣式', color: '#10b981' },
  { id: 'timeline', name: '時間線視圖', description: '時間軸形式的日程顯示', emoji: '⏰', category: '基礎樣式', color: '#f59e0b' },
  { id: 'day-focus', name: '每日聚焦', description: '專注單日的詳細視圖', emoji: '🎯', category: '基礎樣式', color: '#ef4444' },
  { id: 'agenda-list', name: '議程列表', description: '清單形式的日程安排', emoji: '📋', category: '基礎樣式', color: '#8b5cf6' },
  { id: 'compact-month', name: '緊湊月視圖', description: '簡潔的月曆顯示', emoji: '📆', category: '基礎樣式', color: '#06b6d4' },
  { id: 'three-day', name: '三日視圖', description: '專注三天的日程布局', emoji: '📖', category: '基礎樣式', color: '#f97316' },
  
  // 家庭專用
  { id: 'family-grid', name: '家庭網格', description: '適合家庭成員的網格視圖', emoji: '👨‍👩‍👧‍👦', category: '家庭專用', color: '#f97316' },
  { id: 'family-orbit', name: '家庭軌道', description: '圍繞家庭核心的軌道視圖', emoji: '🌀', category: '家庭專用', color: '#6366f1' },
  { id: 'family-puzzle', name: '家庭拼圖', description: '拼圖風格的家庭日程', emoji: '🧩', category: '家庭專用', color: '#ec4899' },
  { id: 'family-garden', name: '家庭花園', description: '趣味的家庭專用花園主題', emoji: '🌻', category: '家庭專用', color: '#22c55e' },
  { id: 'year-overview', name: '年度概覽', description: '整年度的日程概覽', emoji: '📅', category: '家庭專用', color: '#059669' },
  
  // 視覺創新類
  { id: 'cloud-floating', name: '雲朵漂浮', description: '雲朵漂浮的夢幻視圖', emoji: '☁️', category: '視覺創新類', color: '#38bdf8' },
  { id: 'constellation-wheel', name: '星座輪盤', description: '星座主題的圓形日曆', emoji: '⭐', category: '視覺創新類', color: '#a855f7' },
  { id: 'subway-map', name: '地鐵圖', description: '地鐵路線圖式日程', emoji: '🚇', category: '視覺創新類', color: '#ef4444' },
  { id: 'garden-plant', name: '花園植物', description: '植物生長主題視圖', emoji: '🌱', category: '視覺創新類', color: '#22c55e' },
  
  // 互動遊戲類
  { id: 'puzzle-piece', name: '拼圖片', description: '拼圖遊戲式日曆', emoji: '🧩', category: '互動遊戲類', color: '#f59e0b' },
  { id: 'fishing-pond', name: '釣魚池', description: '釣魚主題的互動日曆', emoji: '🎣', category: '互動遊戲類', color: '#06b6d4' },
  { id: 'space-exploration', name: '太空探索', description: '太空冒險主題日程', emoji: '🚀', category: '互動遊戲類', color: '#8b5cf6' },
  { id: 'treasure-map', name: '尋寶圖', description: '尋寶冒險式日曆', emoji: '🗺️', category: '互動遊戲類', color: '#f97316' },
  
  // 數據可視化類
  { id: 'heatmap', name: '熱力圖', description: '活動密度熱力圖', emoji: '🔥', category: '數據可視化類', color: '#ef4444' },
  { id: 'gantt-chart', name: '甘特圖', description: '項目管理甘特圖', emoji: '📊', category: '數據可視化類', color: '#059669' },
  { id: 'heartbeat', name: '心跳圖', description: '心跳節律式日程', emoji: '💓', category: '數據可視化類', color: '#ec4899' },
  { id: 'bubble-chart', name: '氣泡圖', description: '氣泡圖表式日曆', emoji: '🫧', category: '數據可視化類', color: '#38bdf8' },
  
  // 情境主題類
  { id: 'seasonal-landscape', name: '季節風景', description: '四季風景主題日曆', emoji: '🏞️', category: '情境主題類', color: '#22c55e' },
  { id: 'bookshelf', name: '書架視圖', description: '書架主題的日程管理', emoji: '📚', category: '情境主題類', color: '#92400e' },
  { id: 'music-staff', name: '音樂五線譜', description: '音樂五線譜式日曆', emoji: '🎵', category: '情境主題類', color: '#a855f7' },
  { id: 'kitchen-recipe', name: '廚房食譜', description: '廚房烹飪主題日程', emoji: '👨‍🍳', category: '情境主題類', color: '#f59e0b' },
  
  // 運動健康類
  { id: 'running-track', name: '跑道視圖', description: '運動跑道主題日曆', emoji: '🏃‍♂️', category: '運動健康類', color: '#ef4444' },
  { id: 'mood-diary', name: '心情日記', description: '情緒追蹤日記式日曆', emoji: '😊', category: '運動健康類', color: '#ec4899' },
  { id: 'fitness-challenge', name: '健身挑戰', description: '健身挑戰主題日程', emoji: '💪', category: '運動健康類', color: '#f97316' },
  
  // 未來科技類
  { id: 'cube-3d', name: '3D立方體', description: '立體3D視覺效果', emoji: '🔷', category: '未來科技類', color: '#06b6d4' },
  { id: 'ai-prediction', name: 'AI預測', description: 'AI智能預測日程', emoji: '🤖', category: '未來科技類', color: '#22c55e' },
  { id: 'ar-view', name: 'AR視圖', description: '增強現實互動界面', emoji: '🔮', category: '未來科技類', color: '#8b5cf6' },
  
  // 日系家庭專用
  { id: 'seasonal-harmony', name: '四季和諧', description: '日本四季主題日曆', emoji: '🌸', category: '日系家庭專用', color: '#f472b6' },
  { id: 'family-notebook', name: '家庭手帳', description: '日式家庭手帳風格', emoji: '📔', category: '日系家庭專用', color: '#a855f7' },
  { id: 'bento-box', name: '便當盒', description: '便當盒風格的日程布局', emoji: '🍱', category: '日系家庭專用', color: '#84cc16' },
  { id: 'origami-calendar', name: '摺紙日曆', description: '日式摺紙藝術日曆', emoji: '🎎', category: '日系家庭專用', color: '#f59e0b' },
  { id: 'ryokan-style', name: '旅館風格', description: '日式旅館主題視圖', emoji: '🏮', category: '日系家庭專用', color: '#f97316' },
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
    
    // 將樣式ID轉換為中文名稱保存到FeatureSettings
    const styleNameMap: Record<CalendarStyleId, string> = {
      'grid-month': '網格月視圖',
      'weekly-grid': '週間網格',
      'timeline': '時間線視圖',
      'day-focus': '每日聚焦',
      'agenda-list': '議程列表',
      'compact-month': '緊湊月視圖',
      'three-day': '三日視圖',
      'family-grid': '家庭網格',
      'family-orbit': '家庭軌道',
      'family-puzzle': '家庭拼圖',
      'family-garden': '家庭花園',
      'card-month': '卡片月視圖',
      'year-overview': '年度概覽',
      'cloud-floating': '雲朵漂浮',
      'constellation-wheel': '星座輪盤',
      'subway-map': '地鐵圖',
      'garden-plant': '花園植物',
      'puzzle-piece': '拼圖片',
      'fishing-pond': '釣魚池',
      'space-exploration': '太空探索',
      'treasure-map': '尋寶圖',
      'heatmap': '熱力圖',
      'gantt-chart': '甘特圖',
      'heartbeat': '心跳圖',
      'bubble-chart': '氣泡圖',
      'seasonal-landscape': '季節風景',
      'bookshelf': '書架視圖',
      'music-staff': '音樂五線譜',
      'kitchen-recipe': '廚房食譜',
      'running-track': '跑道視圖',
      'mood-diary': '心情日記',
      'fitness-challenge': '健身挑戰',
      'cube-3d': '3D立方體',
      'ai-prediction': 'AI預測',
      'ar-view': 'AR視圖',
      'seasonal-harmony': '四季和諧',
      'family-notebook': '家庭手帳',
      'bento-box': '便當盒',
      'origami-calendar': '摺紙日曆',
      'ryokan-style': '旅館風格',
    };
    
    // 保存到FeatureSettings
    await updateFeatureSetting('familySchedule', featureSettings.familySchedule.enabled, {
      ...featureSettings.familySchedule.settings,
      selectedStyle: styleNameMap[styleId] || '網格月視圖'
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
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
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
            {option.name}
          </Text>
          <Text style={styles.styleDescription}>{option.description}</Text>
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
        <Text style={styles.headerTitle}>選擇日曆樣式</Text>
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
            選擇您喜歡的日曆視圖樣式，設置將自動保存
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