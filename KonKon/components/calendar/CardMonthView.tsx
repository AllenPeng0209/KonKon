import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { t } from '../../lib/i18n';
import { CalendarViewProps } from './CalendarViewTypes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 響應式計算函數
const getResponsiveSize = () => {
  const isSmallScreen = screenWidth < 375; // iPhone SE 等小屏幕
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414; // 標準手機屏幕
  const isLargeScreen = screenWidth >= 414; // 大屏手機
  
  return {
    // 外邊距
    containerMargin: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
    
    // 內邊距
    headerPadding: isSmallScreen ? 12 : isMediumScreen ? 16 : 20,
    weeksPadding: isSmallScreen ? 4 : isMediumScreen ? 6 : 8,
    
    // 字體大小
    monthTitleSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
    eventSummarySize: isSmallScreen ? 10 : isMediumScreen ? 11 : 12,
    weekdaySize: isSmallScreen ? 10 : isMediumScreen ? 11 : 12,
    dayNumberSize: isSmallScreen ? 11 : isMediumScreen ? 12 : 13,
    eventChipSize: isSmallScreen ? 8 : isMediumScreen ? 9 : 10,
    
    // 按鈕尺寸
    navButtonSize: isSmallScreen ? 32 : isMediumScreen ? 36 : 40,
    navButtonTextSize: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
    
    // 日期格子尺寸（基於屏幕寬度動態計算）
    dayCardWidth: (screenWidth - (isSmallScreen ? 16 : isMediumScreen ? 24 : 32) - (isSmallScreen ? 8 : isMediumScreen ? 12 : 16)) / 7 - 1,
    dayCardMinHeight: Math.max(60, (screenHeight - 200) / 8), // 確保至少60px高度，並根據屏幕高度調整
    dayCardPadding: isSmallScreen ? 3 : isMediumScreen ? 4 : 6,
  };
};

const responsiveSize = getResponsiveSize();

export default function CardMonthView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
  onMonthChange,
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
    }).slice(0, screenWidth < 375 ? 2 : 4); // 小屏幕顯示更少事件
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

  // 獲取上個月和下個月的字符串
  const getPreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    if (month === 1) {
      return `${year - 1}-12`;
    }
    return `${year}-${String(month - 1).padStart(2, '0')}`;
  };

  const getNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    if (month === 12) {
      return `${year + 1}-01`;
    }
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  };

  // 處理滑動手勢
  const handleGestureStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END && onMonthChange) {
      const translationX = event.nativeEvent.translationX;
      const velocityX = event.nativeEvent.velocityX;
      
      // 根據滑動距離和速度判斷是否觸發月份切換
      if (Math.abs(translationX) > 50 || Math.abs(velocityX) > 300) {
        if (translationX > 0) {
          // 向右滑動，切換到上個月
          onMonthChange(getPreviousMonth());
        } else {
          // 向左滑動，切換到下個月
          onMonthChange(getNextMonth());
        }
      }
    }
  };

  // 格式化月份標題
  const formatMonthTitle = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return t('calendarCard.yearMonth', { year, month });
  };

  // 獲取本地化的星期幾名稱
  const getLocalizedWeekdays = () => {
    return [
      t('calendarCard.weekdays.monday'),
      t('calendarCard.weekdays.tuesday'),
      t('calendarCard.weekdays.wednesday'),
      t('calendarCard.weekdays.thursday'),
      t('calendarCard.weekdays.friday'),
      t('calendarCard.weekdays.saturday'),
      t('calendarCard.weekdays.sunday'),
    ];
  };

  const monthDates = generateMonthDates();
  const weeks = [];
  
  // 将日期分组为周
  for (let i = 0; i < monthDates.length; i += 7) {
    weeks.push(monthDates.slice(i, i + 7));
  }

  const weekdays = getLocalizedWeekdays();
  const totalEvents = events.filter(event => {
    const eventDate = new Date(event.start_ts * 1000);
    const [year, month] = currentMonth.split('-').map(Number);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month - 1;
  }).length;

  return (
    <PanGestureHandler
      onHandlerStateChange={handleGestureStateChange}
      shouldCancelWhenOutside={true}
    >
      <View style={styles.container}>
        {/* Header with navigation */}
        <View style={styles.header}>
          <View style={styles.monthNavigation}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => onMonthChange?.(getPreviousMonth())}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            
            <View style={styles.monthTitleContainer}>
              <Text style={styles.monthTitle}>{formatMonthTitle()}</Text>
              <Text style={styles.eventSummary}>
                {totalEvents > 0 ? t('calendarCard.eventsCount', { count: totalEvents }) : t('calendarCard.noEvents')}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => onMonthChange?.(getNextMonth())}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekdays header */}
        <View style={styles.weekdaysHeader}>
          {weekdays.map((day, index) => (
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
                        }).length > (screenWidth < 375 ? 2 : 4) && (
                          <View style={styles.moreEventsChip}>
                            <Text style={styles.moreEventsText}>
                              +{events.filter(event => {
                                const eventDateString = new Date(event.start_ts * 1000).toISOString().split('T')[0];
                                const targetDateString = date.toISOString().split('T')[0];
                                return eventDateString === targetDateString;
                              }).length - (screenWidth < 375 ? 2 : 4)}
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
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    margin: responsiveSize.containerMargin,
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
    padding: responsiveSize.headerPadding,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: responsiveSize.navButtonSize,
    height: responsiveSize.navButtonSize,
    borderRadius: responsiveSize.navButtonSize / 2,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: responsiveSize.navButtonTextSize,
    fontWeight: '600',
    color: '#475569',
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: responsiveSize.monthTitleSize,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  eventSummary: {
    fontSize: responsiveSize.eventSummarySize,
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
    fontSize: responsiveSize.weekdaySize,
    fontWeight: '600',
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  weeksContainer: {
    padding: responsiveSize.weeksPadding,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: responsiveSize.weeksPadding,
    justifyContent: 'space-between',
  },
  dayCard: {
    width: responsiveSize.dayCardWidth,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: responsiveSize.dayCardPadding,
    marginHorizontal: 0.5,
    minHeight: responsiveSize.dayCardMinHeight,
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
    fontSize: responsiveSize.dayNumberSize,
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
    fontSize: responsiveSize.eventChipSize,
    fontWeight: '500',
    lineHeight: responsiveSize.eventChipSize + 2,
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
    fontSize: responsiveSize.eventChipSize - 1,
    fontWeight: '500',
  },
}); 