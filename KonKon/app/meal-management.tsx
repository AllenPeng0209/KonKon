import { useAuth } from '@/contexts/AuthContext';
import type { MealPlan } from '@/lib/mealService';
import mealService from '@/lib/mealService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface WeeklyMealPlan {
  [key: string]: {
    breakfast?: MealPlan;
    lunch?: MealPlan;
    dinner?: MealPlan;
    snacks?: MealPlan[];
  };
}

export default function MealManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planning' | 'inventory' | 'shopping'>('dashboard');
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan>({});
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [lunchSuggestions, setLunchSuggestions] = useState<MealPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  const generateLunchSuggestions = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const suggestions = await mealService.generateLunchSuggestions(user.id, {
        servings: 2,
        available_time: 15,
        cuisine_preference: '家常'
      });
      setLunchSuggestions(suggestions);
    } catch (error) {
      console.error('生成午餐建議失敗:', error);
      Alert.alert('錯誤', '無法生成午餐建議，請稍後重試');
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { key: 'dashboard', icon: '🏠', label: '總覽' },
    { key: 'planning', icon: '🗓️', label: '規劃' },
    { key: 'inventory', icon: '🥬', label: '庫存' },
    { key: 'shopping', icon: '🛒', label: '購物' },
  ];

  const mealCategories = [
    { key: 'lunch', emoji: '🍱', label: '午餐方案', color: '#FF6B35' },
    { key: 'breakfast', emoji: '🍳', label: '早餐規劃', color: '#4ECDC4' },
    { key: 'dinner', emoji: '🍽️', label: '晚餐安排', color: '#45B7D1' },
    { key: 'snack', emoji: '🍰', label: '點心小食', color: '#96CEB4' },
  ];

  const quickActions = [
    { 
      key: 'ai_lunch', 
      emoji: '🤖', 
      label: '30秒午餐生成', 
      subtitle: '解決最大痛點',
      color: '#E74C3C',
      action: () => setShowAIGenerator(true)
    },
    { 
      key: 'scan_fridge', 
      emoji: '📷', 
      label: '掃描冰箱', 
      subtitle: '活用剩餘食材',
      color: '#3498DB',
      action: () => Alert.alert('功能開發中', '冰箱掃描功能即將推出')
    },
    { 
      key: 'nutrition_track', 
      emoji: '📊', 
      label: '營養追蹤', 
      subtitle: '健康飲食分析',
      color: '#2ECC71',
      action: () => Alert.alert('功能開發中', '營養追蹤功能即將推出')
    },
    { 
      key: 'shopping_auto', 
      emoji: '✨', 
      label: '智能購物清單', 
      subtitle: '自動生成採購',
      color: '#9B59B6',
      action: () => Alert.alert('功能開發中', '智能購物清單即將推出')
    },
  ];

  const renderDashboard = () => (
    <View style={styles.tabContent}>
      {/* 今日推薦 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌟 今日推薦</Text>
        <View style={styles.todayRecommendation}>
          <TouchableOpacity 
            style={styles.mealCard}
            onPress={() => setShowAIGenerator(true)}
          >
            <Text style={styles.mealEmoji}>🤖</Text>
            <Text style={styles.mealTitle}>AI智能推薦</Text>
            <Text style={styles.mealSubtitle}>點擊獲取個人化餐食建議</Text>
            <Text style={styles.difficultyStars}>✨✨✨</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 快速功能 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ 快速功能</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[styles.quickActionCard, { backgroundColor: action.color + '15' }]}
              onPress={action.action}
            >
              <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
              <Text style={[styles.quickActionSubtitle, { color: action.color }]}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 餐食分類 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ 餐食規劃</Text>
        <View style={styles.categoriesGrid}>
          {mealCategories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[styles.categoryCard, { backgroundColor: category.color + '15' }]}
              onPress={() => Alert.alert('功能開發中', `${category.label}功能即將推出`)}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 家庭協作 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 家庭協作</Text>
        <View style={styles.collaborationCard}>
          <View style={styles.collaborationItem}>
            <Text style={styles.collaborationEmoji}>👩‍🍳</Text>
            <Text style={styles.collaborationText}>主廚: 媽媽</Text>
          </View>
          <View style={styles.collaborationItem}>
            <Text style={styles.collaborationEmoji}>🛒</Text>
            <Text style={styles.collaborationText}>採購員: 爸爸</Text>
          </View>
          <View style={styles.collaborationItem}>
            <Text style={styles.collaborationEmoji}>👨‍🍳</Text>
            <Text style={styles.collaborationText}>助手: 小明</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAIGenerator = () => (
    <Modal visible={showAIGenerator} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAIGenerator(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>30秒智能午餐生成器</Text>
          <View />
        </View>
        
        <View style={styles.aiGeneratorContent}>
          <Text style={styles.aiDescription}>
            🤖 解決74.1%家庭主婦的最大痛點
          </Text>
          <Text style={styles.aiSubtitle}>
            輸入家庭需求，AI立即推薦3-5個15分鐘可完成的午餐選項
          </Text>
          
          <TouchableOpacity 
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={generateLunchSuggestions}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonText}>
              {isGenerating ? '🤖 AI 生成中...' : '🚀 開始生成午餐方案'}
            </Text>
          </TouchableOpacity>
          
          {lunchSuggestions.length > 0 && (
            <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.suggestionsTitle}>💡 AI 推薦午餐方案</Text>
              {lunchSuggestions.map((suggestion) => (
                <TouchableOpacity 
                  key={suggestion.id} 
                  style={styles.suggestionCard}
                  onPress={() => Alert.alert(
                    `${suggestion.title} 詳情`,
                    `🕐 料理時間：${suggestion.cooking_time}分鐘\n👥 份數：${suggestion.servings}人份\n🍽️ 料理類型：${suggestion.cuisine_type}\n⭐ 難度：${'⭐'.repeat(suggestion.difficulty)}\n\n📝 食材：\n${suggestion.ingredients.map(ing => `• ${ing.name} ${ing.amount} ${ing.unit}`).join('\n')}\n\n👨‍🍳 做法：\n${suggestion.instructions.map((step, index) => `${index + 1}. ${step}`).join('\n')}`
                  )}
                >
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <View style={styles.suggestionMeta}>
                      <Text style={styles.suggestionTime}>⏱️ {suggestion.cooking_time}分</Text>
                      <Text style={styles.suggestionDifficulty}>{'⭐'.repeat(suggestion.difficulty)}</Text>
                    </View>
                  </View>
                  <Text style={styles.suggestionDescription}>
                    {suggestion.cuisine_type} · {suggestion.servings}人份 · {suggestion.nutrition.calories}卡
                  </Text>
                  <View style={styles.suggestionTags}>
                    {suggestion.tags.map((tag) => (
                      <Text key={tag} style={styles.suggestionTag}>#{tag}</Text>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部標題 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>餐食管理</Text>
        <TouchableOpacity onPress={() => Alert.alert('設定', '餐食管理設定')}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 分頁標籤 */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabEmoji,
              activeTab === tab.key && styles.activeTabEmoji
            ]}>
              {tab.icon}
            </Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 內容區域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'planning' && (
          <View style={styles.tabContent}>
            <Text style={styles.developingText}>📅 菜單規劃功能開發中...</Text>
          </View>
        )}
        {activeTab === 'inventory' && (
          <View style={styles.tabContent}>
            <Text style={styles.developingText}>🥬 食材庫存管理開發中...</Text>
          </View>
        )}
        {activeTab === 'shopping' && (
          <View style={styles.tabContent}>
            <Text style={styles.developingText}>🛒 智能購物清單開發中...</Text>
          </View>
        )}
      </ScrollView>

      {renderAIGenerator()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabEmoji: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeTabLabel: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  todayRecommendation: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealCard: {
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  mealSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  difficultyStars: {
    fontSize: 16,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  collaborationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  collaborationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  collaborationEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  collaborationText: {
    fontSize: 14,
    color: '#666',
  },
  developingText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  aiGeneratorContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiDescription: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  aiSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  generateButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  suggestionsContainer: {
    maxHeight: 400,
    marginTop: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  suggestionDifficulty: {
    fontSize: 12,
    color: '#FF9500',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionTag: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 5,
    marginBottom: 3,
  },
}); 