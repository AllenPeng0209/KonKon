import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { MealViewProps } from './MealViewTypes';

export default function DailyRecordsView({ 
  mealRecords, 
  selectedDate, 
  onMealPress 
}: MealViewProps) {
  const todayRecords = mealRecords.filter(record => 
    record.date === selectedDate.toISOString().split('T')[0]
  );

  const mealTypeOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  const sortedRecords = todayRecords.sort((a, b) => 
    mealTypeOrder.indexOf(a.mealType) - mealTypeOrder.indexOf(b.mealType)
  );

  const totalCalories = todayRecords.reduce((sum, record) => sum + record.calories, 0);

  const mealTypeInfo = {
    breakfast: { name: '早餐', emoji: '🌅' },
    lunch: { name: '午餐', emoji: '☀️' },
    dinner: { name: '晚餐', emoji: '🌆' },
    snack: { name: '點心', emoji: '🍰' }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 今日標題 */}
      <View style={styles.header}>
        <Text style={styles.dateTitle}>
          📅 {selectedDate.toLocaleDateString('zh-CN', { 
            month: 'long', 
            day: 'numeric',
            weekday: 'long' 
          })}
        </Text>
        <View style={styles.totalCalories}>
          <Text style={styles.totalCaloriesNumber}>{totalCalories}</Text>
          <Text style={styles.totalCaloriesUnit}>卡</Text>
        </View>
      </View>

      {/* 餐食記錄 */}
      <View style={styles.recordsContainer}>
        {sortedRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>今日還沒有餐食記錄</Text>
            <Text style={styles.emptySubtext}>點擊下方添加按鈕開始記錄</Text>
          </View>
        ) : (
          sortedRecords.map((record) => (
            <TouchableOpacity
              key={record.id}
              style={styles.mealCard}
              onPress={() => onMealPress?.(record)}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealTimeInfo}>
                  <Text style={styles.mealEmoji}>
                    {mealTypeInfo[record.mealType].emoji}
                  </Text>
                  <Text style={styles.mealTypeLabel}>
                    {mealTypeInfo[record.mealType].name}
                  </Text>
                  <Text style={styles.mealTime}>{record.time}</Text>
                </View>
                <View style={styles.mealCalories}>
                  <Text style={styles.caloriesText}>{record.calories}</Text>
                  <Text style={styles.caloriesUnit}>卡</Text>
                </View>
              </View>
              
              <Text style={styles.mealTitle}>{record.title}</Text>
              
              {record.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {record.tags.map((tag, index) => (
                    <Text key={index} style={styles.tag}>#{tag}</Text>
                  ))}
                </View>
              )}

              {record.nutrition && (
                <View style={styles.nutritionPreview}>
                  <Text style={styles.nutritionText}>
                    蛋白質 {record.nutrition.protein}g · 
                    碳水 {record.nutrition.carbs}g · 
                    脂肪 {record.nutrition.fat}g
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* 營養統計 */}
      {todayRecords.length > 0 && (
        <View style={styles.nutritionSummary}>
          <Text style={styles.nutritionTitle}>📊 今日營養統計</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalCalories}</Text>
              <Text style={styles.nutritionLabel}>總卡路里</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {todayRecords.reduce((sum, r) => sum + (r.nutrition?.protein || 0), 0)}g
              </Text>
              <Text style={styles.nutritionLabel}>蛋白質</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {todayRecords.reduce((sum, r) => sum + (r.nutrition?.carbs || 0), 0)}g
              </Text>
              <Text style={styles.nutritionLabel}>碳水</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {todayRecords.reduce((sum, r) => sum + (r.nutrition?.fat || 0), 0)}g
              </Text>
              <Text style={styles.nutritionLabel}>脂肪</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  totalCalories: {
    alignItems: 'center',
  },
  totalCaloriesNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  totalCaloriesUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  recordsContainer: {
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  mealCard: {
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
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealEmoji: {
    fontSize: 24,
  },
  mealTypeLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  mealTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  mealCalories: {
    alignItems: 'center',
  },
  caloriesText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  caloriesUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  mealTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  nutritionPreview: {
    marginTop: 4,
  },
  nutritionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  nutritionSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
}); 