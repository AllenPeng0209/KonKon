import { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { MealViewProps } from './MealViewTypes';

const { width: screenWidth } = Dimensions.get('window');

// 獲取月份的所有日期
const getDaysInMonth = (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  
  const days = [];
  
  // 添加上個月的末尾日期
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, 0 - i);
    days.push({
      date: date.getDate(),
      isCurrentMonth: false,
      fullDate: date,
    });
  }
  
  // 添加當前月份的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    days.push({
      date: i,
      isCurrentMonth: true,
      fullDate: date,
    });
  }
  
  // 添加下個月的開始日期，補齊6週
  const totalCells = Math.ceil(days.length / 7) * 7;
  for (let i = 1; days.length < totalCells; i++) {
    const date = new Date(year, month, i);
    days.push({
      date: i,
      isCurrentMonth: false,
      fullDate: date,
    });
  }
  
  return days;
};

// 格式化日期為 YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 獲取指定日期的餐食記錄
const getMealsForDate = (mealRecords: any[], date: Date) => {
  const dateString = formatDate(date);
  return mealRecords.filter(meal => meal.date === dateString);
};

// 計算日期的總卡路里
const getTotalCalories = (meals: any[]) => {
  return meals.reduce((total, meal) => total + (meal.calories || 0), 0);
};

// 獲取餐食類型的emoji
const getMealTypeEmoji = (mealType: string) => {
  switch (mealType) {
    case 'breakfast': return '🌅';
    case 'lunch': return '☀️';
    case 'dinner': return '🌆';
    case 'snack': return '🍰';
    default: return '🍽️';
  }
};

export default function CalendarGridView({
  mealRecords,
  selectedDate,
  onMealPress,
  onDatePress,
}: MealViewProps) {
  const currentDate = selectedDate || new Date();
  const [viewDate, setViewDate] = useState(currentDate);
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const days = getDaysInMonth(year, month);
  
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date: Date) => {
    return date.toDateString() === currentDate.toDateString();
  };
  
  // 處理月份導航
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };
  
  // 處理日期點擊
  const handleDatePress = (date: Date) => {
    if (onDatePress) {
      onDatePress(date);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* 月份標題和導航 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {year}年 {month}月
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>
      
      {/* 星期標題 */}
      <View style={styles.weekHeader}>
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <View key={index} style={styles.weekDayContainer}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      {/* 日期網格 */}
      <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            const meals = getMealsForDate(mealRecords, day.fullDate);
            const totalCalories = getTotalCalories(meals);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayContainer,
                  !day.isCurrentMonth && styles.otherMonthDay,
                  isToday(day.fullDate) && styles.todayContainer,
                  isSelected(day.fullDate) && styles.selectedContainer,
                ]}
                onPress={() => handleDatePress(day.fullDate)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.otherMonthText,
                  isToday(day.fullDate) && styles.todayText,
                  isSelected(day.fullDate) && styles.selectedText,
                ]}>
                  {day.date}
                </Text>
                
                {/* 餐食記錄指示器 */}
                {meals.length > 0 && (
                  <View style={styles.mealsContainer}>
                    {/* 顯示餐食類型emoji */}
                    <View style={styles.mealTypesRow}>
                      {Array.from(new Set(meals.map(m => m.mealType))).slice(0, 3).map((type, idx) => (
                        <Text key={idx} style={styles.mealTypeEmoji}>
                          {getMealTypeEmoji(type)}
                        </Text>
                      ))}
                    </View>
                    
                    {/* 顯示總卡路里 */}
                    {totalCalories > 0 && (
                      <Text style={styles.caloriesText}>
                        {totalCalories}cal
                      </Text>
                    )}
                  </View>
                )}
                
                {/* 空白狀態的提示點 */}
                {meals.length === 0 && day.isCurrentMonth && (
                  <View style={styles.emptyIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '500',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    letterSpacing: 0.3,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.2,
  },
  calendarContainer: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  dayContainer: {
    width: (screenWidth - 64) / 7, // 考慮左右邊距和padding
    minHeight: 80,
    padding: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    marginVertical: 2,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayContainer: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  selectedContainer: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  otherMonthText: {
    color: '#C7C7CC',
  },
  todayText: {
    color: '#1976D2',
    fontWeight: '700',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mealsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 2,
  },
  mealTypeEmoji: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  caloriesText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5EA',
    marginTop: 8,
  },
}); 