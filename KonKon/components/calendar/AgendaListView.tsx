import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

export default function AgendaListView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // 根据日期分组事件并按今天为中心重新排序
  const groupAndSortEventsByDate = () => {
    const grouped: { [key: string]: any[] } = {};
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    
    events.forEach(event => {
      const eventDate = new Date(event.start_ts * 1000);
      const dateKey = eventDate.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    // 按时间排序每个日期的事件
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.start_ts - b.start_ts);
    });
    
    // 只保留今天和未來的日期
    const todayAndFutureDates: string[] = [];
    
    Object.keys(grouped).forEach(dateKey => {
      if (dateKey >= todayKey) {
        todayAndFutureDates.push(dateKey);
      }
    });
    
    // 按日期正序排序：今天在最前，然後是未來
    todayAndFutureDates.sort();
    
    const orderedDates = todayAndFutureDates;
    
    return { grouped, orderedDates, todayKey };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      // 只顯示未來日期，不需要 "天前/天后" 標識
      const dateStr = date.toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
      
      // 計算距離今天的天數（只有未來）
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        return `${dateStr} (${diffDays}天後)`;
      } else {
        return dateStr;
      }
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

  const { grouped: groupedEvents, orderedDates, todayKey } = groupAndSortEventsByDate();

  // 自动滚动到顶部（今天在最前面）
  useEffect(() => {
    if (orderedDates.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 300);
    }
  }, [orderedDates]);

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {orderedDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>暂无日程安排</Text>
            <Text style={styles.emptyDescription}>您可以添加新的日程安排</Text>
          </View>
        ) : (
          orderedDates.map((dateKey: string) => (
            <View 
              key={dateKey} 
              style={styles.dateSection}
            >
              <View style={styles.dateHeader}>
                <Text style={styles.dateTitle}>
                  {formatDate(dateKey)}
                </Text>
                <Text style={styles.dateSubtitle}>
                  {groupedEvents[dateKey].length} 个日程
                </Text>
              </View>
              
              <View style={styles.eventsList}>
                {groupedEvents[dateKey].map((event, index) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventItem,
                      index === groupedEvents[dateKey].length - 1 && styles.lastEventItem,
                    ]}
                    onPress={() => onEventPress(event)}
                  >
                    <View style={styles.eventTime}>
                      <Text style={styles.eventTimeText}>
                        {formatTime(event.start_ts)}
                      </Text>
                      {event.end_ts && (
                        <Text style={styles.eventDuration}>
                          {formatDuration(event.start_ts, event.end_ts)}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <View 
                          style={[
                            styles.eventDot, 
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
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 32,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  dateSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventsList: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastEventItem: {
    borderBottomWidth: 0,
  },
  eventTime: {
    width: 80,
    marginRight: 16,
    alignItems: 'flex-start',
  },
  eventTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  eventDuration: {
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
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 6,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 20,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
}); 