import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

export default function ThreeDayView({
  events,
  selectedDate,
  onDatePress,
  onEventPress,
}: CalendarViewProps) {
  // 获取三天的日期（前一天、当天、后一天）
  const getThreeDayDates = (centerDate: Date) => {
    const dates = [];
    for (let i = -1; i <= 1; i++) {
      const date = new Date(centerDate);
      date.setDate(centerDate.getDate() + i);
      dates.push(date);
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
    });
  };

  const threeDayDates = getThreeDayDates(selectedDate);
  const today = new Date().toISOString().split('T')[0];

  const formatDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    if (dateString === today) {
      return '今天';
    } else if (dateString === new Date(Date.now() + 86400000).toISOString().split('T')[0]) {
      return '明天';
    } else if (dateString === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      return '昨天';
    }
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const isToday = (date: Date) => {
    return date.toISOString().split('T')[0] === today;
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {threeDayDates.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          
          return (
            <View key={index} style={styles.dayContainer}>
              {/* 日期头部 */}
              <TouchableOpacity
                style={[
                  styles.dayHeader,
                  isToday(date) && styles.todayHeader,
                ]}
                onPress={() => onDatePress(date)}
              >
                <Text style={[
                  styles.dayTitle,
                  isToday(date) && styles.todayTitle,
                ]}>
                  {formatDate(date)}
                </Text>
                <Text style={[
                  styles.dayDate,
                  isToday(date) && styles.todayDate,
                ]}>
                  {date.getDate()}日
                </Text>
                <Text style={styles.dayEventCount}>
                  {dayEvents.length} 个日程
                </Text>
              </TouchableOpacity>

              {/* 事件列表 */}
              <ScrollView style={styles.eventsContainer} showsVerticalScrollIndicator={false}>
                {dayEvents.length === 0 ? (
                  <View style={styles.noEvents}>
                    <Text style={styles.noEventsIcon}>📅</Text>
                    <Text style={styles.noEventsText}>暂无安排</Text>
                  </View>
                ) : (
                  dayEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventCard}
                      onPress={() => onEventPress(event)}
                    >
                      <View style={styles.eventTime}>
                        <Text style={styles.eventTimeText}>
                          {formatTime(event.start_ts)}
                        </Text>
                        {event.end_ts && (
                          <Text style={styles.eventEndTime}>
                            {formatTime(event.end_ts)}
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.eventContent}>
                        <View style={styles.eventHeader}>
                          <View 
                            style={[
                              styles.eventColorBar, 
                              { backgroundColor: event.color || '#3b82f6' }
                            ]} 
                          />
                          <Text style={styles.eventTitle} numberOfLines={2}>
                            {event.title}
                          </Text>
                        </View>
                        
                        {event.description && (
                          <Text style={styles.eventDescription} numberOfLines={2}>
                            {event.description}
                          </Text>
                        )}
                        
                        {event.location && (
                          <View style={styles.eventLocation}>
                            <Text style={styles.locationIcon}>📍</Text>
                            <Text style={styles.locationText} numberOfLines={1}>
                              {event.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
      
      {/* 底部指示器 */}
      <View style={styles.indicator}>
        {threeDayDates.map((date, index) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              index === 1 && styles.activeDot, // 中间的是当前选中的
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  },
  dayContainer: {
    width: 320, // 稍微小于屏幕宽度，显示一点下一页
    flex: 1,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  todayHeader: {
    backgroundColor: '#eff6ff',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  todayTitle: {
    color: '#3b82f6',
  },
  dayDate: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  todayDate: {
    color: '#3b82f6',
  },
  dayEventCount: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
  },
  noEvents: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEventsIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noEventsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  eventTime: {
    width: 60,
    marginRight: 12,
    alignItems: 'flex-start',
  },
  eventTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  eventEndTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventColorBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 20,
  },
  eventDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 6,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  indicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#3b82f6',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}); 