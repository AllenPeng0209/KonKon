import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

const { width: screenWidth } = Dimensions.get('window');

export default function CardMonthView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
}: CalendarViewProps) {
  // 生成当前月的所有日期
  const generateMonthDates = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    // 调整到周一开始
    const startDay = firstDay.getDay();
    startDate.setDate(firstDay.getDate() - (startDay === 0 ? 6 : startDay - 1));
    
    // 调整到周日结束
    const endDay = lastDay.getDay();
    endDate.setDate(lastDay.getDate() + (endDay === 0 ? 0 : 7 - endDay));
    
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // 获取指定日期的事件
  const getEventsForDate = (date: Date) => {
    const targetDayStart = new Date(date);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    }).slice(0, 2); // 最多显示2个事件
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    const [year, month] = currentMonth.split('-').map(Number);
    return date.getFullYear() === year && date.getMonth() === month - 1;
  };

  const formatEventTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const monthDates = generateMonthDates();
  const weeks = [];
  
  // 将日期分组为周
  for (let i = 0; i < monthDates.length; i += 7) {
    weeks.push(monthDates.slice(i, i + 7));
  }

  const monthTitle = new Date(currentMonth + '-01').toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <View style={styles.container}>
      {/* 月份头部 */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{monthTitle}</Text>
      </View>

      {/* 星期标题 */}
      <View style={styles.weekdaysHeader}>
        {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
          <View key={index} style={styles.weekdayItem}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.weeksContainer}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((date, dayIndex) => {
                const dayEvents = getEventsForDate(date);
                const today = isToday(date);
                const currentMonth = isCurrentMonth(date);
                
                return (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.dayCard,
                      today && styles.todayCard,
                      !currentMonth && styles.otherMonthCard,
                    ]}
                    onPress={() => onDatePress(date)}
                  >
                    {/* 日期数字 */}
                    <View style={styles.dayHeader}>
                      <Text style={[
                        styles.dayNumber,
                        today && styles.todayNumber,
                        !currentMonth && styles.otherMonthNumber,
                      ]}>
                        {date.getDate()}
                      </Text>
                      {dayEvents.length > 0 && (
                        <View style={styles.eventCountBadge}>
                          <Text style={styles.eventCountText}>
                            {dayEvents.length}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 事件列表 */}
                    <View style={styles.dayEvents}>
                      {dayEvents.map((event, eventIndex) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.eventChip,
                            { backgroundColor: event.color || '#6366f1' }
                          ]}
                          onPress={() => onEventPress(event)}
                        >
                          <Text style={styles.eventChipText} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      
                      {events.filter(event => {
                        const eventDate = new Date(event.start_ts * 1000);
                        eventDate.setHours(0, 0, 0, 0);
                        const targetDate = new Date(date);
                        targetDate.setHours(0, 0, 0, 0);
                        return eventDate.getTime() === targetDate.getTime();
                      }).length > 2 && (
                        <View style={styles.moreEventsChip}>
                          <Text style={styles.moreEventsText}>
                            +{events.filter(event => {
                              const eventDateString = new Date(event.start_ts * 1000).toISOString().split('T')[0];
                              const targetDateString = date.toISOString().split('T')[0];
                              return eventDateString === targetDateString;
                            }).length - 2}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    margin: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  eventSummary: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weekdaysHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  weekdayItem: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  weeksContainer: {
    padding: 8,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 6,
    marginHorizontal: 0.5,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  todayCard: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  otherMonthCard: {
    backgroundColor: '#f8fafc',
    opacity: 0.6,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  todayNumber: {
    color: '#6366f1',
    fontWeight: '700',
  },
  otherMonthNumber: {
    color: '#94a3b8',
  },
  eventCountBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCountText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  dayEvents: {
    flex: 1,
  },
  eventChip: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 1,
  },
  eventChipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
  },
  moreEventsChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    alignItems: 'center',
  },
  moreEventsText: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '500',
  },
}); 