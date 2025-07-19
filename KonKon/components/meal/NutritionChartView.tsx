import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import type { MealViewProps } from './MealViewTypes';

export default function NutritionChartView({ 
  mealRecords, 
  selectedDate 
}: MealViewProps) {
  // 獲取最近7天的數據
  const getRecentDays = (date: Date, days: number = 7) => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(date);
      day.setDate(date.getDate() - i);
      result.push(day);
    }
    return result;
  };

  const recentDays = getRecentDays(selectedDate);

  // 計算每天的營養數據
  const dailyNutrition = recentDays.map(date => {
    const dateString = date.toISOString().split('T')[0];
    const dayMeals = mealRecords.filter(record => record.date === dateString);
    
    return {
      date: dateString,
      day: date.getDate(),
      calories: dayMeals.reduce((sum, meal) => sum + meal.calories, 0),
      protein: dayMeals.reduce((sum, meal) => sum + (meal.nutrition?.protein || 0), 0),
      carbs: dayMeals.reduce((sum, meal) => sum + (meal.nutrition?.carbs || 0), 0),
      fat: dayMeals.reduce((sum, meal) => sum + (meal.nutrition?.fat || 0), 0),
      meals: dayMeals.length,
    };
  });

  // 計算統計數據
  const totalCalories = dailyNutrition.reduce((sum, day) => sum + day.calories, 0);
  const avgCalories = Math.round(totalCalories / 7);
  const maxCalories = Math.max(...dailyNutrition.map(d => d.calories));
  const totalProtein = dailyNutrition.reduce((sum, day) => sum + day.protein, 0);
  const avgProtein = Math.round(totalProtein / 7);

  // 營養目標 (示例)
  const targets = {
    calories: 1800,
    protein: 60,
    carbs: 200,
    fat: 60,
  };

  // 計算進度百分比
  const getProgress = (actual: number, target: number) => 
    Math.min(Math.round((actual / target) * 100), 100);

  // 營養分佈 (基於最近7天平均)
  const avgNutrition = {
    protein: Math.round(totalProtein / 7),
    carbs: Math.round(dailyNutrition.reduce((sum, day) => sum + day.carbs, 0) / 7),
    fat: Math.round(dailyNutrition.reduce((sum, day) => sum + day.fat, 0) / 7),
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 標題 */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 營養分析</Text>
        <Text style={styles.subtitle}>最近7天營養數據</Text>
      </View>

      {/* 卡路里趨勢圖 */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>📈 卡路里趨勢</Text>
        <View style={styles.calorieChart}>
          {dailyNutrition.map((day, index) => {
            const height = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
            const isToday = day.date === selectedDate.toISOString().split('T')[0];
            
            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: `${height}%`,
                        backgroundColor: isToday ? '#007AFF' : '#e5e7eb'
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.barLabel, isToday && styles.todayLabel]}>
                  {day.day}
                </Text>
                <Text style={[styles.barValue, isToday && styles.todayValue]}>
                  {day.calories}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.chartLegend}>
          <Text style={styles.legendText}>平均: {avgCalories} 卡 | 目標: {targets.calories} 卡</Text>
        </View>
      </View>

      {/* 營養目標進度 */}
      <View style={styles.goalsContainer}>
        <Text style={styles.goalsTitle}>🎯 營養目標達成</Text>
        
        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>卡路里</Text>
            <Text style={styles.goalValue}>{avgCalories} / {targets.calories}</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${getProgress(avgCalories, targets.calories)}%`,
                  backgroundColor: '#4ECDC4' 
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>蛋白質</Text>
            <Text style={styles.goalValue}>{avgProtein}g / {targets.protein}g</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${getProgress(avgProtein, targets.protein)}%`,
                  backgroundColor: '#45B7D1' 
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>碳水化合物</Text>
            <Text style={styles.goalValue}>{avgNutrition.carbs}g / {targets.carbs}g</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${getProgress(avgNutrition.carbs, targets.carbs)}%`,
                  backgroundColor: '#96CEB4' 
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>脂肪</Text>
            <Text style={styles.goalValue}>{avgNutrition.fat}g / {targets.fat}g</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${getProgress(avgNutrition.fat, targets.fat)}%`,
                  backgroundColor: '#FECA57' 
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* 營養分佈餅圖 (簡化版本) */}
      <View style={styles.distributionContainer}>
        <Text style={styles.distributionTitle}>🥧 營養素分佈</Text>
        <View style={styles.distributionChart}>
          <View style={styles.pieChart}>
            {/* 簡化的餅圖顯示 */}
            <View style={styles.pieSlice}>
              <Text style={styles.pieLabel}>蛋白質</Text>
              <Text style={styles.pieValue}>{avgNutrition.protein}g</Text>
              <Text style={styles.piePercent}>
                {Math.round((avgNutrition.protein * 4 / (avgCalories || 1)) * 100)}%
              </Text>
            </View>
            <View style={styles.pieSlice}>
              <Text style={styles.pieLabel}>碳水</Text>
              <Text style={styles.pieValue}>{avgNutrition.carbs}g</Text>
              <Text style={styles.piePercent}>
                {Math.round((avgNutrition.carbs * 4 / (avgCalories || 1)) * 100)}%
              </Text>
            </View>
            <View style={styles.pieSlice}>
              <Text style={styles.pieLabel}>脂肪</Text>
              <Text style={styles.pieValue}>{avgNutrition.fat}g</Text>
              <Text style={styles.piePercent}>
                {Math.round((avgNutrition.fat * 9 / (avgCalories || 1)) * 100)}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 建議 */}
      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsTitle}>💡 營養建議</Text>
        <View style={styles.recommendation}>
          <Text style={styles.recommendationEmoji}>🎯</Text>
          <Text style={styles.recommendationText}>
            {avgCalories < targets.calories * 0.8 
              ? '卡路里攝入偏低，建議增加健康食物攝入'
              : avgCalories > targets.calories * 1.2
              ? '卡路里攝入偏高，建議控制飲食份量'
              : '卡路里攝入適中，保持良好習慣'
            }
          </Text>
        </View>
        <View style={styles.recommendation}>
          <Text style={styles.recommendationEmoji}>💪</Text>
          <Text style={styles.recommendationText}>
            {avgProtein < targets.protein * 0.8
              ? '蛋白質攝入不足，建議增加瘦肉、蛋類攝入'
              : '蛋白質攝入充足，有助肌肉健康'
            }
          </Text>
        </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  chartContainer: {
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
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  calorieChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 12,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 80,
    width: 20,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  todayLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  barValue: {
    fontSize: 10,
    color: '#9ca3af',
  },
  todayValue: {
    color: '#007AFF',
    fontWeight: '600',
  },
  chartLegend: {
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalsContainer: {
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
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionContainer: {
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
  distributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  distributionChart: {
    alignItems: 'center',
  },
  pieChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  pieSlice: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 16,
    marginHorizontal: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  pieLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  pieValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  piePercent: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  recommendationsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationEmoji: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
}); 