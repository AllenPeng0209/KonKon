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
  { id: 'weekly-grid', name: '週間網格', description: '以週為單位的網格視圖', emoji: '📊', category: '基礎樣式', color: '#10b981' },
  { id: 'timeline', name: '時間線視圖', description: '時間軸形式的日程顯示', emoji: '⏰', category: '基礎樣式', color: '#f59e0b' },
  { id: 'agenda-list', name: '議程列表', description: '清單形式的日程安排', emoji: '📋', category: '基礎樣式', color: '#8b5cf6' },
  { id: 'day-focus', name: '每日聚焦', description: '專注單日的詳細視圖', emoji: '🎯', category: '基礎樣式', color: '#ef4444' },
  
  // 家庭專用
  { id: 'family-garden', name: '家庭花園', description: '趣味的家庭專用花園主題', emoji: '🌻', category: '家庭專用', color: '#22c55e' },
  { id: 'family-grid', name: '家庭網格', description: '適合家庭成員的網格視圖', emoji: '👨‍👩‍👧‍👦', category: '家庭專用', color: '#f97316' },
  { id: 'family-orbit', name: '家庭軌道', description: '圍繞家庭核心的軌道視圖', emoji: '🌀', category: '家庭專用', color: '#6366f1' },
  { id: 'family-puzzle', name: '家庭拼圖', description: '拼圖風格的家庭日程', emoji: '🧩', category: '家庭專用', color: '#ec4899' },
  
  // 日系風格
  { id: 'seasonal-harmony', name: '四季和諧', description: '日本四季主題日曆', emoji: '🌸', category: '日系風格', color: '#f472b6' },
  { id: 'family-notebook', name: '家庭手帳', description: '日式家庭手帳風格', emoji: '📔', category: '日系風格', color: '#a855f7' },
  { id: 'bento-box', name: '便當盒', description: '便當盒風格的日程布局', emoji: '🍱', category: '日系風格', color: '#84cc16' },
  { id: 'ryokan-style', name: '旅館風格', description: '日式旅館主題視圖', emoji: '🏮', category: '日系風格', color: '#f97316' },
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
        '家庭花園': 'family-garden',
        '議程列表': 'agenda-list',
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
      'family-garden': '家庭花園',
      'agenda-list': '議程列表',
      'day-focus': '每日聚焦',
      'family-grid': '家庭網格',
      'family-orbit': '家庭軌道',
      'family-puzzle': '家庭拼圖',
      'seasonal-harmony': '四季和諧',
      'family-notebook': '家庭手帳',
      'bento-box': '便當盒',
      'ryokan-style': '旅館風格',
      'compact-month': '緊湊月視圖',
      'three-day': '三日視圖',
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
      'origami-calendar': '摺紙日曆',
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