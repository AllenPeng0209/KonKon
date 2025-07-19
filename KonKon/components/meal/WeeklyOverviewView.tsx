import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { MealViewProps } from './MealViewTypes';

export default function WeeklyOverviewView({ 
  mealRecords, 
  selectedDate, 
  onMealPress,
  onDatePress 
}: MealViewProps) {
  // 獲取當前週的日期範圍
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 週一開始
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);
  const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

  // 獲取每天的餐食記錄
  const getDayMeals = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return mealRecords.filter(record => record.date === dateString);
  };

  // 計算週間統計
  const weeklyStats = weekDates.reduce((stats, date) => {
    const dayMeals = getDayMeals(date);
    const dayCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const dayProtein = dayMeals.reduce((sum, meal) => sum + (meal.nutrition?.protein || 0), 0);
    
    return {
      totalCalories: stats.totalCalories + dayCalories,
      totalMeals: stats.totalMeals + dayMeals.length,
      totalProtein: stats.totalProtein + dayProtein,
      maxCalories: Math.max(stats.maxCalories, dayCalories),
    };
  }, { totalCalories: 0, totalMeals: 0, totalProtein: 0, maxCalories: 0 });

  const avgCalories = Math.round(weeklyStats.totalCalories / 7);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 週間標題 */}
      <View style={styles.header}>
        <Text style={styles.weekTitle}>
          📅 本週概覽
        </Text>
        <Text style={styles.weekRange}>
          {weekDates[0].toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - {' '}
          {weekDates[6].toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        </Text>
      </View>

      {/* 週間統計 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{weeklyStats.totalCalories}</Text>
          <Text style={styles.statLabel}>總卡路里</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{avgCalories}</Text>
          <Text style={styles.statLabel}>日均卡路里</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{weeklyStats.totalMeals}</Text>
          <Text style={styles.statLabel}>餐食次數</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Math.round(weeklyStats.totalProtein)}g</Text>
          <Text style={styles.statLabel}>總蛋白質</Text>
        </View>
      </View>

      {/* 每日概覽 */}
      <View style={styles.daysContainer}>
        {weekDates.map((date, index) => {
          const dayMeals = getDayMeals(date);
          const dayCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCard,
                isToday && styles.todayCard,
                isSelected && styles.selectedCard
              ]}
              onPress={() => onDatePress?.(date)}
            >
              <View style={styles.dayHeader}>
                <Text style={[
                  styles.dayName,
                  isToday && styles.todayText,
                  isSelected && styles.selectedText
                ]}>
                  {dayNames[index]}
                </Text>
                <Text style={[
                  styles.dayDate,
                  isToday && styles.todayText,
                  isSelected && styles.selectedText
                ]}>
                  {date.getDate()}
                </Text>
              </View>

              <View style={styles.dayCalories}>
                <Text style={[
                  styles.caloriesNumber,
                  isToday && styles.todayText,
                  isSelected && styles.selectedText
                ]}>
                  {dayCalories}
                </Text>
                <Text style={[
                  styles.caloriesUnit,
                  isToday && styles.todayText,
                  isSelected && styles.selectedText
                ]}>
                  卡
                </Text>
              </View>

              <View style={styles.mealsPreview}>
                {dayMeals.slice(0, 3).map((meal, mealIndex) => (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.mealDot}
                    onPress={() => onMealPress?.(meal)}
                  >
                    <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                  </TouchableOpacity>
                ))}
                {dayMeals.length > 3 && (
                  <View style={styles.moreMeals}>
                    <Text style={styles.moreMealsText}>+{dayMeals.length - 3}</Text>
                  </View>
                )}
              </View>

              {dayMeals.length === 0 && (
                <View style={styles.emptyDay}>
                  <Text style={styles.emptyDayText}>無記錄</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 進度指標 */}
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>📈 週間進度</Text>
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            {weekDates.map((date, index) => {
              const dayMeals = getDayMeals(date);
              const hasComplete = dayMeals.length >= 3; // 假設3餐為完整
              
              return (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    hasComplete && styles.progressSegmentComplete
                  ]}
                />
              );
            })}
          </View>
        </View>
        <Text style={styles.progressText}>
          本週已完成 {weekDates.filter(date => getDayMeals(date).length >= 3).length} / 7 天的完整記錄
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  weekTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  weekRange: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  daysContainer: {
    marginBottom: 20,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  todayCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  selectedCard: {
    backgroundColor: '#007AFF10',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  todayText: {
    color: '#007AFF',
  },
  selectedText: {
    color: '#007AFF',
  },
  dayCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  caloriesNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  caloriesUnit: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  mealsPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mealDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 16,
  },
  moreMeals: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMealsText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyDayText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  progressBar: {
    marginBottom: 12,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  progressSegmentComplete: {
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 