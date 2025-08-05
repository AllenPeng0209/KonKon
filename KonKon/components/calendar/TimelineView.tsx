import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentLocale, t } from '../../lib/i18n';
import { CalendarViewProps } from './CalendarViewTypes';

export default function TimelineView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  // 獲取選中日期的事件
  const getSelectedDateEvents = () => {
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    }).sort((a, b) => a.start_ts - b.start_ts);
  };

  // 生成時間線（24小時）
  const generateTimeline = () => {
    const timeline = [];
    for (let hour = 0; hour < 24; hour++) {
      timeline.push(hour);
    }
    return timeline;
  };

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const formatEventTime = (timestamp: number) => {
    const locale = getCurrentLocale();
    return new Date(timestamp * 1000).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getEventsForHour = (hour: number) => {
    return selectedDateEvents.filter(event => {
      const eventHour = new Date(event.start_ts * 1000).getHours();
      return eventHour === hour;
    });
  };

  const formatSelectedDate = () => {
    const today = new Date().toISOString().split('T')[0];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    if (selectedDateStr === today) {
      return t('home.today');
    } else {
      const locale = getCurrentLocale();
      return selectedDate.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
  };

  const selectedDateEvents = getSelectedDateEvents();
  const timeline = generateTimeline();

  return (
    <View style={styles.container}>
      {/* 日期頭部 */}
      <View style={styles.header}>
        <Text style={styles.dateTitle}>{formatSelectedDate()}</Text>
        <Text style={styles.eventCount}>
          {t('calendarCard.eventsCount', { count: selectedDateEvents.length })}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {selectedDateEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={styles.emptyTitle}>{t('calendarCard.noEvents')}</Text>
            <Text style={styles.emptyDescription}>{t('calendarCard.addNewEvent')}</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {timeline.map((hour) => {
              const hourEvents = getEventsForHour(hour);
              
              return (
                <View key={hour} style={styles.timeSlot}>
                  {/* 時間標籤 */}
                  <View style={styles.timeLabel}>
                    <Text style={styles.timeText}>{formatTime(hour)}</Text>
                  </View>
                  
                  {/* 時間線 */}
                  <View style={styles.timelineContainer}>
                    <View style={[
                      styles.timelineDot,
                      hourEvents.length > 0 && styles.activeTimelineDot
                    ]} />
                    <View style={[
                      styles.timelineLine,
                      hour === timeline.length - 1 && styles.lastTimelineLine
                    ]} />
                  </View>
                  
                  {/* 事件列表 */}
                  <View style={styles.eventsContainer}>
                    {hourEvents.map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={styles.eventCard}
                        onPress={() => onEventPress(event)}
                      >
                        <View style={styles.eventTimeContainer}>
                          <Text style={styles.eventTimeText}>
                            {formatEventTime(event.start_ts)}
                          </Text>
                          {event.end_ts && (
                            <Text style={styles.eventEndTimeText}>
                              {formatEventTime(event.end_ts)}
                            </Text>
                          )}
                        </View>
                        
                        <View style={styles.eventContent}>
                          <View style={styles.eventHeader}>
                            <View 
                              style={[
                                styles.eventIndicator, 
                                { backgroundColor: event.color || '#8b5cf6' }
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
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf5ff', // 淡紫色背景
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
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7c3aed',
    marginBottom: 4,
  },
  eventCount: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  timeline: {
    padding: 20,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 60,
    marginBottom: 8,
  },
  timeLabel: {
    width: 60,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  timelineContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
    marginTop: 6,
  },
  activeTimelineDot: {
    backgroundColor: '#8b5cf6',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  lastTimelineLine: {
    height: 0,
  },
  eventsContainer: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  eventTimeContainer: {
    width: 80,
    marginRight: 12,
    alignItems: 'flex-start',
  },
  eventTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  eventEndTimeText: {
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
  eventIndicator: {
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
}); 