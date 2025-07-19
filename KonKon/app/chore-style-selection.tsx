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
import { ChoreViewStyleId } from '../components/chore/ChoreViewTypes';
import { useFeatureSettings } from '../contexts/FeatureSettingsContext';

const { width } = Dimensions.get('window');

interface StyleOption {
  id: ChoreViewStyleId;
  name: string;
  description: string;
  emoji: string;
  category: string;
  color: string;
}

const styleOptions: StyleOption[] = [
  // 基礎視圖
  { id: 'task-board', name: '任務看板', description: '看板式任務管理，類似Trello的卡片式布局', emoji: '📋', category: '基礎視圖', color: '#3B82F6' },
  { id: 'calendar-grid', name: '日曆網格', description: '傳統日曆視圖，按日期顯示家務任務', emoji: '📅', category: '基礎視圖', color: '#10B981' },
  { id: 'timeline', name: '時間軸', description: '按時間順序顯示家務任務和截止日期', emoji: '⏰', category: '基礎視圖', color: '#8B5CF6' },
  { id: 'list', name: '清單視圖', description: '簡潔的列表式任務顯示', emoji: '📝', category: '基礎視圖', color: '#6B7280' },

  // 家庭專用視圖
  { id: 'family-dashboard', name: '家庭儀表板', description: '展示所有家庭成員的任務分配和進度', emoji: '👨‍👩‍👧‍👦', category: '家庭專用', color: '#F59E0B' },
  { id: 'member-rotation', name: '輪值安排', description: '自動輪值系統，公平分配家務', emoji: '🔄', category: '家庭專用', color: '#EF4444' },
  { id: 'responsibility-wheel', name: '責任轉盤', description: '圓形轉盤顯示家務分配，直觀有趣', emoji: '🎯', category: '家庭專用', color: '#06B6D4' },
  { id: 'family-tree', name: '家庭樹狀圖', description: '樹狀結構顯示家庭層級和責任分工', emoji: '🌳', category: '家庭專用', color: '#84CC16' },

  // 遊戲化視圖
  { id: 'achievement-board', name: '成就榜', description: '展示家務完成成就和獎章', emoji: '🏆', category: '遊戲化', color: '#F59E0B' },
  { id: 'progress-garden', name: '進度花園', description: '完成家務讓花園綻放，視覺化進度', emoji: '🌻', category: '遊戲化', color: '#10B981' },
  { id: 'skill-tree', name: '技能樹', description: 'RPG風格的技能提升和專精系統', emoji: '⚡', category: '遊戲化', color: '#8B5CF6' },
  { id: 'treasure-hunt', name: '尋寶遊戲', description: '完成家務解鎖寶藏和獎勵', emoji: '🎁', category: '遊戲化', color: '#F59E0B' },
  { id: 'cleaning-adventure', name: '清潔冒險', description: '將家務包裝成冒險任務和挑戰', emoji: '⚔️', category: '遊戲化', color: '#EF4444' },

  // 數據可視化視圖
  { id: 'stats-dashboard', name: '統計儀表板', description: '詳細的數據分析和統計圖表', emoji: '📊', category: '數據分析', color: '#6366F1' },
  { id: 'completion-heatmap', name: '完成熱力圖', description: '熱力圖顯示家務完成頻率和模式', emoji: '🔥', category: '數據分析', color: '#DC2626' },
  { id: 'workload-balance', name: '工作負載平衡', description: '分析和平衡家庭成員的工作負載', emoji: '⚖️', category: '數據分析', color: '#059669' },
  { id: 'time-tracker', name: '時間追踪器', description: '追踪和分析家務完成時間', emoji: '⏱️', category: '數據分析', color: '#7C3AED' },
  { id: 'points-leaderboard', name: '積分排行榜', description: '積分系統和家庭成員排行榜', emoji: '🏅', category: '數據分析', color: '#F59E0B' },

  // 情境主題視圖
  { id: 'kitchen-commander', name: '廚房指揮官', description: '廚房為中心的家務管理界面', emoji: '👨‍🍳', category: '情境主題', color: '#F97316' },
  { id: 'cleaning-ninja', name: '清潔忍者', description: '忍者主題的清潔任務管理', emoji: '🥷', category: '情境主題', color: '#1F2937' },
  { id: 'home-hero', name: '居家英雄', description: '超級英雄主題的家務管理', emoji: '🦸', category: '情境主題', color: '#DC2626' },
  { id: 'daily-quest', name: '每日任務', description: 'RPG風格的每日任務系統', emoji: '📜', category: '情境主題', color: '#92400E' },
  { id: 'chore-cafe', name: '家務咖啡廳', description: '溫馨咖啡廳主題的任務管理', emoji: '☕', category: '情境主題', color: '#92400E' },

  // 效率管理視圖
  { id: 'smart-scheduler', name: '智能排程器', description: 'AI驅動的智能任務排程', emoji: '🧠', category: '效率管理', color: '#6366F1' },
  { id: 'workload-optimizer', name: '負載優化器', description: '優化家庭成員工作負載分配', emoji: '⚙️', category: '效率管理', color: '#6B7280' },
  { id: 'priority-matrix', name: '優先級矩陣', description: '四象限優先級管理系統', emoji: '🎯', category: '效率管理', color: '#7C2D12' },
  { id: 'time-blocks', name: '時間區塊', description: '時間區塊化的任務規劃', emoji: '📅', category: '效率管理', color: '#0F766E' },

  // 趣味創新視圖
  { id: 'space-station', name: '太空站', description: '太空主題的未來家務管理', emoji: '🚀', category: '趣味創新', color: '#1E40AF' },
  { id: 'fairy-tale-castle', name: '童話城堡', description: '童話主題的夢幻家務管理', emoji: '🏰', category: '趣味創新', color: '#BE185D' },
  { id: 'magic-house', name: '魔法屋', description: '魔法主題的奇幻家務體驗', emoji: '🪄', category: '趣味創新', color: '#7C3AED' },
  { id: 'robot-assistant', name: '機器人助手', description: '機器人助手指導的智能家務', emoji: '🤖', category: '趣味創新', color: '#374151' },
  { id: 'seasonal-chores', name: '四季家務', description: '隨季節變化的動態家務視圖', emoji: '🍃', category: '趣味創新', color: '#059669' },
];

export default function ChoreStyleSelection() {
  const router = useRouter();
  const { featureSettings, updateFeatureSetting } = useFeatureSettings();
  const [selectedStyle, setSelectedStyle] = useState<ChoreViewStyleId>('task-board');

  useEffect(() => {
    const currentStyle = featureSettings.choreAssignment?.settings?.selectedStyle;
    if (currentStyle) {
      // 將中文樣式名稱轉換為樣式ID
      const styleMap: Record<string, ChoreViewStyleId> = {
        '任務看板': 'task-board',
        '日曆網格': 'calendar-grid',
        '家庭儀表板': 'family-dashboard',
        '進度花園': 'progress-garden',
        '統計儀表板': 'stats-dashboard',
      };
      setSelectedStyle(styleMap[currentStyle] || 'task-board');
    }
  }, []);

  const handleStyleSelect = async (styleId: ChoreViewStyleId) => {
    setSelectedStyle(styleId);
    
    // 將樣式ID轉換為中文名稱保存到FeatureSettings
    const styleNameMap: Record<ChoreViewStyleId, string> = {
      // 基礎視圖
      'task-board': '任務看板',
      'calendar-grid': '日曆網格',
      'timeline': '時間軸',
      'list': '清單視圖',
      
      // 家庭專用視圖
      'family-dashboard': '家庭儀表板',
      'member-rotation': '輪值安排',
      'responsibility-wheel': '責任轉盤',
      'family-tree': '家庭樹狀圖',
      
      // 遊戲化視圖
      'achievement-board': '成就榜',
      'progress-garden': '進度花園',
      'skill-tree': '技能樹',
      'treasure-hunt': '尋寶遊戲',
      'cleaning-adventure': '清潔冒險',
      
      // 數據可視化視圖
      'stats-dashboard': '統計儀表板',
      'completion-heatmap': '完成熱力圖',
      'workload-balance': '工作負載平衡',
      'time-tracker': '時間追踪器',
      'points-leaderboard': '積分排行榜',
      
      // 情境主題視圖
      'kitchen-commander': '廚房指揮官',
      'cleaning-ninja': '清潔忍者',
      'home-hero': '居家英雄',
      'daily-quest': '每日任務',
      'chore-cafe': '家務咖啡廳',
      
      // 效率管理視圖
      'smart-scheduler': '智能排程器',
      'workload-optimizer': '負載優化器',
      'priority-matrix': '優先級矩陣',
      'time-blocks': '時間區塊',
      
      // 趣味創新視圖
      'space-station': '太空站',
      'fairy-tale-castle': '童話城堡',
      'magic-house': '魔法屋',
      'robot-assistant': '機器人助手',
      'seasonal-chores': '四季家務',
    };
    
    // 保存到FeatureSettings
    await updateFeatureSetting('choreAssignment', featureSettings.choreAssignment.enabled, {
      ...featureSettings.choreAssignment.settings,
      selectedStyle: styleNameMap[styleId] || '任務看板'
    });

    // 同時保存到AsyncStorage的chore_view_style鍵中，讓ChoreViewSelector能檢測到變化
    try {
      await AsyncStorage.setItem('chore_view_style', styleId);
    } catch (error) {
      console.error('Error saving chore style to AsyncStorage:', error);
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
        <Text style={styles.headerTitle}>選擇家務視圖樣式</Text>
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
            選擇您喜歡的家務視圖樣式，設置將自動保存
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