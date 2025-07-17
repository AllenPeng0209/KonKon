import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface CalendarStyle {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  preview: string;
}

const calendarStyles: CalendarStyle[] = [
  // 推荐样式
  {
    id: 'grid-month',
    name: '网格月历',
    description: '经典月历网格布局，清晰显示整月日程',
    category: 'recommended',
    icon: '📊',
    preview: '月视图 | 网格',
  },
  {
    id: 'weekly-grid',
    name: '周间视图',
    description: '七天网格展示，时间段安排一目了然',
    category: 'recommended',
    icon: '📋',
    preview: '周视图 | 时间轴',
  },
  {
    id: 'timeline',
    name: '时间轴',
    description: '纵向时间线布局，适合查看详细日程流',
    category: 'recommended',
    icon: '📈',
    preview: '时间线 | 详细',
  },

  // 基础样式
  {
    id: 'day-focus',
    name: '单日聚焦',
    description: '专注单日视图，显示详细时间安排',
    category: 'basic',
    icon: '📅',
    preview: '单日 | 详细',
  },
  {
    id: 'agenda-list',
    name: '议程列表',
    description: '事件流列表样式，按时间顺序排列',
    category: 'basic',
    icon: '📝',
    preview: '列表 | 时序',
  },
  {
    id: 'compact-month',
    name: '精简月历',
    description: '紧凑月视图，适合小屏幕设备',
    category: 'basic',
    icon: '📱',
    preview: '月视图 | 紧凑',
  },
  {
    id: 'three-day',
    name: '三日视图',
    description: '显示连续三天，平衡详细度和全局感',
    category: 'basic',
    icon: '📖',
    preview: '三日 | 平衡',
  },

  // 家庭专用
  {
    id: 'family-grid',
    name: '家庭网格',
    description: '家庭成员网格视图，多人日程一览无余',
    category: 'family',
    icon: '👨‍👩‍👧‍👦',
    preview: '多人 | 网格',
  },
  {
    id: 'family-orbit',
    name: '家庭轨道',
    description: '圆形轨道设计，成员围绕中心旋转，点击切换个人视图',
    category: 'family',
    icon: '🌍',
    preview: '轨道 | 互动',
  },
  {
    id: 'family-puzzle',
    name: '家庭拼图墙',
    description: '每个成员是拼图块，可展开查看详细日程安排',
    category: 'family',
    icon: '🧩',
    preview: '拼图 | 展开',
  },
  {
    id: 'family-garden',
    name: '家庭花园',
    description: '成员化身植物，事件如花朵绽放，温馨生动',
    category: 'family',
    icon: '🌺',
    preview: '花园 | 绽放',
  },
  {
    id: 'card-month',
    name: '卡片月历',
    description: '卡片式月历，现代化设计风格',
    category: 'family',
    icon: '🎴',
    preview: '卡片 | 现代',
  },
  {
    id: 'year-overview',
    name: '年度概览',
    description: '十二个月缩略视图，适合长期规划',
    category: 'family',
    icon: '🗓️',
    preview: '年视图 | 概览',
  },

  // 视觉创新类
  {
    id: 'cloud-floating',
    name: '雲朵浮動',
    description: '天空中浮動的雲朵，事件根據重要性分為晴天、陰天、暴雨雲',
    category: 'visual-creative',
    icon: '☁️',
    preview: '雲朵 | 浮動',
  },
  {
    id: 'constellation-wheel',
    name: '星座輪盤',
    description: '12星座圓形輪盤設計，可旋轉切換月份，事件以閃爍星星顯示',
    category: 'visual-creative',
    icon: '⭐',
    preview: '星座 | 輪盤',
  },
  {
    id: 'subway-map',
    name: '地鐵路線圖',
    description: '地鐵路線圖風格，5條不同顏色線路代表事件類別',
    category: 'visual-creative',
    icon: '🚇',
    preview: '地鐵 | 路線',
  },
  {
    id: 'garden-plant',
    name: '花園種植',
    description: '植物生長主題，事件從種子成長為花朵，有凋謝機制',
    category: 'visual-creative',
    icon: '🌱',
    preview: '花園 | 種植',
  },

  // 互動遊戲類
  {
    id: 'puzzle-piece',
    name: '拼圖塊',
    description: '拼圖遊戲風格，完成事件後拼圖塊發光',
    category: 'interactive-game',
    icon: '🧩',
    preview: '拼圖 | 遊戲',
  },
  {
    id: 'fishing-pond',
    name: '釣魚池',
    description: '釣魚池主題，事件是游動的魚，點擊"釣起"查看詳情',
    category: 'interactive-game',
    icon: '🎣',
    preview: '釣魚 | 池塘',
  },
  {
    id: 'space-exploration',
    name: '太空探索',
    description: '太空探索主題，深色背景星空效果',
    category: 'interactive-game',
    icon: '🚀',
    preview: '太空 | 探索',
  },
  {
    id: 'treasure-map',
    name: '尋寶地圖',
    description: '尋寶地圖風格，復古地圖背景',
    category: 'interactive-game',
    icon: '🗺️',
    preview: '尋寶 | 地圖',
  },

  // 數據可視化類
  {
    id: 'heatmap',
    name: '熱力圖',
    description: 'GitHub風格年度熱力圖，顏色深淺表示事件密度',
    category: 'data-viz',
    icon: '🔥',
    preview: '熱力 | 密度',
  },
  {
    id: 'gantt-chart',
    name: '甘特圖',
    description: '項目管理甘特圖樣式，適合長期項目追蹤',
    category: 'data-viz',
    icon: '📊',
    preview: '甘特 | 項目',
  },
  {
    id: 'heartbeat',
    name: '心電圖',
    description: '心電圖波形顯示，事件產生波峰',
    category: 'data-viz',
    icon: '💓',
    preview: '心電 | 波形',
  },
  {
    id: 'bubble-chart',
    name: '泡泡圖',
    description: '泡泡圖表示法，氣泡大小表示事件重要性',
    category: 'data-viz',
    icon: '🫧',
    preview: '泡泡 | 圖表',
  },

  // 情境主題類
  {
    id: 'seasonal-landscape',
    name: '季節風景',
    description: '四季風景背景，隨月份變化呈現不同季節美景',
    category: 'theme-context',
    icon: '🌸',
    preview: '季節 | 風景',
  },
  {
    id: 'bookshelf',
    name: '書架',
    description: '書架主題，事件像書籍排列在書架上',
    category: 'theme-context',
    icon: '📚',
    preview: '書架 | 閱讀',
  },
  {
    id: 'music-staff',
    name: '音樂五線譜',
    description: '五線譜設計，事件以音符形式在譜線上顯示',
    category: 'theme-context',
    icon: '🎼',
    preview: '音樂 | 五線譜',
  },
  {
    id: 'kitchen-recipe',
    name: '廚房菜譜',
    description: '廚房主題，事件以菜餚和烹飪工具形式呈現',
    category: 'theme-context',
    icon: '🍳',
    preview: '廚房 | 菜譜',
  },

  // 運動健康類
  {
    id: 'running-track',
    name: '跑步軌跡',
    description: '跑道主題，事件沿跑道軌跡排列',
    category: 'health-sports',
    icon: '🏃',
    preview: '跑步 | 軌跡',
  },
  {
    id: 'mood-diary',
    name: '心情日記',
    description: '心情追蹤主題，用表情符號表示每日心情',
    category: 'health-sports',
    icon: '😊',
    preview: '心情 | 日記',
  },
  {
    id: 'fitness-challenge',
    name: '健身挑戰',
    description: '健身主題，事件以運動項目和挑戰形式顯示',
    category: 'health-sports',
    icon: '💪',
    preview: '健身 | 挑戰',
  },

  // 未來科技類
  {
    id: 'cube-3d',
    name: '3D立體',
    description: '立體方塊效果，事件以3D視覺呈現',
    category: 'future-tech',
    icon: '📦',
    preview: '3D | 立體',
  },
  {
    id: 'ai-prediction',
    name: 'AI預測',
    description: 'AI風格界面，智能預測和建議功能',
    category: 'future-tech',
    icon: '🤖',
    preview: 'AI | 預測',
  },
  {
    id: 'ar-view',
    name: 'AR增強現實',
    description: '增強現實風格，未來科技感設計',
    category: 'future-tech',
    icon: '🥽',
    preview: 'AR | 現實',
  },

  // 日系家庭專用
  {
    id: 'seasonal-harmony',
    name: '和風四季',
    description: '深度季節感設計，櫻花、新綠、楓葉、雪景隨月份變化',
    category: 'japanese-family',
    icon: '🌸',
    preview: '四季 | 和風',
  },
  {
    id: 'family-notebook',
    name: '家族記事本',
    description: '日式手寫記事本風格，溫馨的家庭記錄方式',
    category: 'japanese-family',
    icon: '📔',
    preview: '記事 | 手寫',
  },
  {
    id: 'bento-box',
    name: '便當盒',
    description: '便當格子設計，事件像美味菜餚一樣精心安排',
    category: 'japanese-family',
    icon: '🍱',
    preview: '便當 | 格子',
  },
  {
    id: 'origami-calendar',
    name: '摺紙日曆',
    description: '傳統摺紙藝術風格，千紙鶴與摺痕的美學呈現',
    category: 'japanese-family',
    icon: '🕊️',
    preview: '摺紙 | 藝術',
  },
  {
    id: 'ryokan-style',
    name: '溫泉旅館',
    description: '日式旅館的雅致風格，榻榻米質感與和室美學',
    category: 'japanese-family',
    icon: '🏮',
    preview: '旅館 | 雅致',
  },
];

const categoryInfo = {
  recommended: { name: '推荐样式', color: '#3b82f6', bgColor: '#eff6ff' },
  basic: { name: '基础样式', color: '#10b981', bgColor: '#ecfdf5' },
  family: { name: '家庭专用', color: '#f59e0b', bgColor: '#fffbeb' },
  'visual-creative': { name: '視覺創新', color: '#ec4899', bgColor: '#fdf2f8' },
  'interactive-game': { name: '互動遊戲', color: '#8b5cf6', bgColor: '#f5f3ff' },
  'data-viz': { name: '數據可視化', color: '#06b6d4', bgColor: '#ecfeff' },
  'theme-context': { name: '情境主題', color: '#84cc16', bgColor: '#f7fee7' },
  'health-sports': { name: '運動健康', color: '#f97316', bgColor: '#fff7ed' },
  'future-tech': { name: '未來科技', color: '#6366f1', bgColor: '#eef2ff' },
  'japanese-family': { name: '日系家庭', color: '#dc2626', bgColor: '#fef2f2' },
};

export default function CalendarSettingsScreen() {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState<string>('grid-month');

  useEffect(() => {
    loadSelectedStyle();
  }, []);

  const loadSelectedStyle = async () => {
    try {
      const saved = await AsyncStorage.getItem('calendar_style');
      if (saved) {
        setSelectedStyle(saved);
      }
    } catch (error) {
      console.error('Error loading calendar style:', error);
    }
  };

  const handleSelectStyle = async (styleId: string) => {
    try {
      setSelectedStyle(styleId);
      await AsyncStorage.setItem('calendar_style', styleId);
      Alert.alert(
        '成功', 
        '日历样式已保存',
        [
          {
            text: '确定',
            onPress: () => {
              // 延迟返回，让用户看到选择效果
              setTimeout(() => {
                router.back();
              }, 500);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving calendar style:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderStylesByCategory = (category: string) => {
    const categoryStyles = calendarStyles.filter(style => style.category === category);
    const info = categoryInfo[category as keyof typeof categoryInfo];

    return (
      <View key={category} style={styles.categorySection}>
        <View style={[styles.categoryHeader, { backgroundColor: info.bgColor }]}>
          <Text style={[styles.categoryTitle, { color: info.color }]}>
            {info.name}
          </Text>
        </View>

        <View style={styles.stylesGrid}>
          {categoryStyles.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                selectedStyle === style.id && styles.selectedCard,
              ]}
              onPress={() => handleSelectStyle(style.id)}
            >
              <View style={styles.styleHeader}>
                <Text style={styles.styleIcon}>{style.icon}</Text>
                {selectedStyle === style.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.styleName}>{style.name}</Text>
              <Text style={styles.stylePreview}>{style.preview}</Text>
              <Text style={styles.styleDescription}>{style.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日历样式</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            选择适合您和家人的日历显示方式，让日程管理更加高效
          </Text>
        </View>

        {Object.keys(categoryInfo).map(category => renderStylesByCategory(category))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  description: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  stylesGrid: {
    paddingHorizontal: 16,
  },
  styleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#fefeff',
  },
  styleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  styleIcon: {
    fontSize: 24,
  },
  selectedBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  styleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  stylePreview: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  styleDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
}); 