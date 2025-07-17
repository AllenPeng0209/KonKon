import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

export default function DayFocusView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  // 获取选中日期的事件
  const getSelectedDateEvents = () => {
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    }).sort((a, b) => a.start_ts - b.start_ts);
  };

  const formatSelectedDate = () => {
    const today = new Date().toISOString().split('T')[0];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    if (selectedDateStr === today) {
      return '今天';
    } else {
      return selectedDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDuration = (startTs: number, endTs?: number) => {
    if (!endTs) return '';
    const duration = (endTs - startTs) / 3600; // 转换为小时
    if (duration < 1) {
      const minutes = Math.round(duration * 60);
      return `${minutes}分钟`;
    } else {
      return `${duration.toFixed(1)}小时`;
    }
  };

  // 计算今日统计信息
  const getEventStats = (events: any[]) => {
    const totalEvents = events.length;
    const totalDuration = events.reduce((acc, event) => {
      if (event.end_ts) {
        return acc + (event.end_ts - event.start_ts) / 3600;
      }
      return acc + 1; // 默认1小时
    }, 0);
    
    return { totalEvents, totalDuration };
  };

  const dayEvents = getSelectedDateEvents();
  const { totalEvents, totalDuration } = getEventStats(dayEvents);

  return (
    <View style={styles.container}>
      {/* 大标题日期 */}
      <View style={styles.header}>
        <Text style={styles.dateTitle}>{formatSelectedDate()}</Text>
        <Text style={styles.dayNumber}>{selectedDate.getDate()}</Text>
        
        {/* 统计信息 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalEvents}</Text>
            <Text style={styles.statLabel}>个日程</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalDuration.toFixed(1)}</Text>
            <Text style={styles.statLabel}>小时</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {dayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌟</Text>
            <Text style={styles.emptyTitle}>享受自由时光</Text>
            <Text style={styles.emptyDescription}>今天是您的专属时间</Text>
            <Text style={styles.emptySubtext}>可以添加新的日程安排</Text>
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {dayEvents.map((event, index) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventCard,
                  index === 0 && styles.firstEventCard,
                ]}
                onPress={() => onEventPress(event)}
              >
                {/* 时间信息 */}
                <View style={styles.eventTimeSection}>
                  <Text style={styles.eventStartTime}>
                    {formatTime(event.start_ts)}
                  </Text>
                  {event.end_ts && (
                    <>
                      <Text style={styles.timeSeparator}>—</Text>
                      <Text style={styles.eventEndTime}>
                        {formatTime(event.end_ts)}
                      </Text>
                    </>
                  )}
                  {event.end_ts && (
                    <Text style={styles.eventDuration}>
                      {formatDuration(event.start_ts, event.end_ts)}
                    </Text>
                  )}
                </View>

                {/* 事件内容 */}
                <View style={styles.eventContent}>
                  <View style={styles.eventTitleSection}>
                    <View 
                      style={[
                        styles.eventColorIndicator, 
                        { backgroundColor: event.color || '#ef4444' }
                      ]} 
                    />
                    <Text style={styles.eventTitle}>
                      {event.title}
                    </Text>
                  </View>
                  
                  {event.description && (
                    <Text style={styles.eventDescription}>
                      {event.description}
                    </Text>
                  )}
                  
                  {event.location && (
                    <View style={styles.eventLocation}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>
                        {event.location}
                      </Text>
                    </View>
                  )}

                  {/* 事件标签 */}
                  <View style={styles.eventTags}>
                    <View style={styles.eventTag}>
                      <Text style={styles.eventTagText}>
                        #{event.type || '日程'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff5f5', // 淡红色背景
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
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    backgroundColor: '#fef2f2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  dayNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ef4444',
    marginBottom: 16,
    lineHeight: 48,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  eventsContainer: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#fef2f2',
  },
  firstEventCard: {
    borderColor: '#fecaca',
    borderWidth: 2,
  },
  eventTimeSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  eventStartTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  timeSeparator: {
    fontSize: 16,
    color: '#6b7280',
    marginVertical: 2,
  },
  eventEndTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  eventDuration: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventContent: {
    flex: 1,
  },
  eventTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventColorIndicator: {
    width: 6,
    height: 24,
    borderRadius: 3,
    marginRight: 12,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 24,
  },
  eventDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 12,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  eventTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  eventTag: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginTop: 4,
  },
  eventTagText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
}); 