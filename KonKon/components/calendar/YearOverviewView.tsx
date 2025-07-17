import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function YearOverviewView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
  onMonthChange,
}: CalendarViewProps) {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  
  // 獲取某月的天數
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 獲取某月第一天是星期幾
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // 檢查某日期是否有事件
  const hasEventsOnDate = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.some(event => {
      const eventDate = new Date(event.start_ts * 1000).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // 渲染單個月份
  const renderMonth = (monthIndex: number) => {
    const month = monthIndex + 1;
    const daysInMonth = getDaysInMonth(currentYear, month);
    const firstDay = getFirstDayOfMonth(currentYear, month);
    
    const days = [];
    
    // 添加空白天數
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // 添加實際天數
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const handleMonthPress = () => {
      const monthStr = `${currentYear}-${String(month).padStart(2, '0')}`;
      if (onMonthChange) {
        onMonthChange(monthStr);
      }
    };

    const isCurrentMonth = month === today.getMonth() + 1 && currentYear === today.getFullYear();

    return (
      <TouchableOpacity
        key={monthIndex}
        style={[styles.monthContainer, isCurrentMonth && styles.currentMonthContainer]}
        onPress={handleMonthPress}
      >
        <Text style={[styles.monthTitle, isCurrentMonth && styles.currentMonthTitle]}>
          {MONTHS[monthIndex]}
        </Text>
        
        {/* 星期標題 */}
        <View style={styles.weekdaysContainer}>
          {WEEKDAYS.map((weekday, index) => (
            <Text key={index} style={styles.weekdayText}>
              {weekday}
            </Text>
          ))}
        </View>
        
        {/* 日期網格 */}
        <View style={styles.daysGrid}>
          {days.map((day, index) => {
            if (day === null) {
              return <View key={index} style={styles.emptyDay} />;
            }
            
            const isToday = 
              day === today.getDate() && 
              month === today.getMonth() + 1 && 
              currentYear === today.getFullYear();
            
            const hasEvents = hasEventsOnDate(currentYear, month, day);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayContainer,
                  isToday && styles.todayContainer,
                  hasEvents && styles.eventDayContainer,
                ]}
                onPress={() => {
                  const pressedDate = new Date(currentYear, month - 1, day);
                  onDatePress(pressedDate);
                }}
              >
                <Text style={[
                  styles.dayText,
                  isToday && styles.todayText,
                  hasEvents && styles.eventDayText,
                ]}>
                  {day}
                </Text>
                {hasEvents && <View style={styles.eventDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.yearTitle}>{currentYear}年</Text>
        <Text style={styles.subtitle}>點擊月份查看詳細日程</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.monthsContainer}
      >
        <View style={styles.monthsGrid}>
          {Array.from({ length: 12 }, (_, index) => renderMonth(index))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  yearTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  monthsContainer: {
    padding: 16,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthContainer: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  currentMonthContainer: {
    borderColor: '#3b82f6',
    backgroundColor: '#fefeff',
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentMonthTitle: {
    color: '#3b82f6',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  weekdayText: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
    width: 20,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: 20,
    height: 20,
    margin: 1,
  },
  dayContainer: {
    width: 20,
    height: 20,
    margin: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayContainer: {
    backgroundColor: '#3b82f6',
  },
  eventDayContainer: {
    backgroundColor: '#fef3c7',
  },
  dayText: {
    fontSize: 9,
    color: '#374151',
    fontWeight: '500',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  eventDayText: {
    color: '#92400e',
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#f59e0b',
  },
}); 