import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DailyRecordsView from './DailyRecordsView';
import type { MealViewOption, MealViewProps, MealViewType } from './MealViewTypes';
import NutritionChartView from './NutritionChartView';
import WeeklyOverviewView from './WeeklyOverviewView';

// 可用的餐食視圖選項
const mealViewOptions: MealViewOption[] = [
  {
    id: 'daily_records',
    name: '每日記錄',
    description: '查看當天的詳細餐食記錄',
    emoji: '📝',
  },
  {
    id: 'weekly_overview',
    name: '週間概覽',
    description: '一週的餐食統計和趨勢',
    emoji: '📅',
  },
  {
    id: 'nutrition_chart',
    name: '營養圖表',
    description: '營養數據分析和目標追蹤',
    emoji: '📊',
  },
  {
    id: 'calendar_grid',
    name: '日曆網格',
    description: '日曆形式的餐食記錄',
    emoji: '🗓️',
    premium: true,
  },
  {
    id: 'timeline',
    name: '時間線視圖',
    description: '按時間順序的餐食流水',
    emoji: '⏰',
    premium: true,
  },
  {
    id: 'habit_tracker',
    name: '習慣追蹤',
    description: '飲食習慣養成追蹤',
    emoji: '✅',
    premium: true,
  },
  {
    id: 'meal_planning',
    name: '餐食規劃',
    description: '未來餐食計劃和安排',
    emoji: '📋',
    premium: true,
  },
  {
    id: 'recipe_collection',
    name: '菜譜收藏',
    description: '收藏的菜譜和食譜',
    emoji: '📚',
    premium: true,
  },
  {
    id: 'shopping_list',
    name: '購物清單',
    description: '智能生成的購物清單',
    emoji: '🛒',
    premium: true,
  },
  {
    id: 'nutrition_goals',
    name: '營養目標',
    description: '設置和追蹤營養目標',
    emoji: '🎯',
    premium: true,
  },
];

interface MealViewSelectorProps extends MealViewProps {
  currentView?: MealViewType;
  onViewChange?: (viewType: MealViewType) => void;
}

export default function MealViewSelector({
  mealRecords,
  selectedDate,
  onMealPress,
  onDatePress,
  currentView = 'daily_records',
  onViewChange
}: MealViewSelectorProps) {
  const [showViewSelector, setShowViewSelector] = useState(false);
  const [selectedView, setSelectedView] = useState<MealViewType>(currentView);

  const currentViewOption = mealViewOptions.find(option => option.id === selectedView);

  const handleViewChange = (viewType: MealViewType) => {
    const option = mealViewOptions.find(opt => opt.id === viewType);
    
    if (option?.premium) {
      Alert.alert(
        '高級功能',
        '此功能需要升級到高級版本才能使用。',
        [
          { text: '取消', style: 'cancel' },
          { text: '了解更多', onPress: () => console.log('Navigate to premium') }
        ]
      );
      return;
    }

    setSelectedView(viewType);
    onViewChange?.(viewType);
    setShowViewSelector(false);
  };

  const renderCurrentView = () => {
    const props = {
      mealRecords,
      selectedDate,
      onMealPress,
      onDatePress,
    };

    switch (selectedView) {
      case 'daily_records':
        return <DailyRecordsView {...props} />;
      case 'weekly_overview':
        return <WeeklyOverviewView {...props} />;
      case 'nutrition_chart':
        return <NutritionChartView {...props} />;
      default:
        // 對於其他視圖，顯示開發中
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonEmoji}>🚧</Text>
            <Text style={styles.comingSoonTitle}>功能開發中</Text>
            <Text style={styles.comingSoonText}>
              {currentViewOption?.name} 功能正在開發中，敬請期待！
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* 視圖切換按鈕 */}
      <TouchableOpacity
        style={styles.viewToggleButton}
        onPress={() => setShowViewSelector(true)}
      >
        <Text style={styles.viewToggleEmoji}>{currentViewOption?.emoji}</Text>
        <Text style={styles.viewToggleText}>{currentViewOption?.name}</Text>
        <Text style={styles.viewToggleArrow}>▼</Text>
      </TouchableOpacity>

      {/* 當前視圖內容 */}
      <View style={styles.viewContent}>
        {renderCurrentView()}
      </View>

      {/* 視圖選擇器Modal */}
      <Modal
        visible={showViewSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowViewSelector(false)}>
              <Text style={styles.cancelButton}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>選擇餐食視圖</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {mealViewOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedView === option.id && styles.selectedOptionCard,
                  option.premium && styles.premiumOptionCard,
                ]}
                onPress={() => handleViewChange(option.id)}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <View style={styles.optionTextContainer}>
                      <View style={styles.optionTitleRow}>
                        <Text style={[
                          styles.optionName,
                          selectedView === option.id && styles.selectedOptionName,
                        ]}>
                          {option.name}
                        </Text>
                        {option.premium && (
                          <View style={styles.premiumBadge}>
                            <Text style={styles.premiumText}>PRO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.optionDescription,
                        selectedView === option.id && styles.selectedOptionDescription,
                      ]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {selectedView === option.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.footerText}>
              💡 提示：更多視圖正在開發中，敬請期待！
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewToggleEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  viewToggleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewToggleArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  viewContent: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  comingSoonEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  placeholder: {
    width: 48,
  },
  optionsContainer: {
    flex: 1,
    padding: 16,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  selectedOptionCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#007AFF08',
  },
  premiumOptionCard: {
    borderColor: '#FFD700',
    borderWidth: 1,
    backgroundColor: '#FFFBF0',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  selectedOptionName: {
    color: '#007AFF',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B8860B',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  selectedOptionDescription: {
    color: '#007AFF',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 