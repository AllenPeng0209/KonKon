import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../lib/i18n';
import { CalendarViewProps } from './CalendarViewTypes';

const { width: screenWidth } = Dimensions.get('window');

export default function WeeklyGridView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
}: CalendarViewProps) {
  // 獲取本地化的星期名稱
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

  // 获取当前周的日期
  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一开始
    startOfWeek.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(currentDate);
    }
    return weekDates;
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

  // 生成时间槽（从6:00到23:00）
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const weekDates = getWeekDates(selectedDate);
  const timeSlots = generateTimeSlots();
  const today = new Date().toISOString().split('T')[0];
  const weekdays = getLocalizedWeekdays();

  const formatTimeSlot = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const isToday = (date: Date) => {
    return date.toISOString().split('T')[0] === today;
  };

  const renderEventInSlot = (event: any, date: Date) => {
    const eventStartTime = new Date(event.start_ts * 1000);
    const eventEndTime = event.end_ts ? new Date(event.end_ts * 1000) : eventStartTime;
    
    // 计算事件在时间槽中的位置
    const startHour = eventStartTime.getHours();
    const endHour = eventEndTime.getHours();
    const duration = Math.max(1, endHour - startHour);
    
    return (
      <TouchableOpacity
        key={event.id}
        style={[
          styles.eventBlock,
          {
            backgroundColor: event.color || '#3b82f6',
            height: duration * 60 - 4, // 每小时60px，留4px间隙
          }
        ]}
        onPress={() => onEventPress(event)}
      >
        <Text style={styles.eventText} numberOfLines={2}>
          {event.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 周視圖頭部 */}
      <View style={styles.weekHeader}>
        <View style={styles.timeColumn} />
        {weekDates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayHeader,
              isToday(date) && styles.todayHeader,
            ]}
            onPress={() => onDatePress(date)}
          >
            <Text style={[
              styles.dayHeaderText,
              isToday(date) && styles.todayHeaderText,
            ]}>
              {weekdays[index]}
            </Text>
            <Text style={[
              styles.dateText,
              isToday(date) && styles.todayDateText,
            ]}>
              {date.getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 滾動區域 */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.timeGrid}>
          {timeSlots.map((hour) => (
            <View key={hour} style={styles.timeRow}>
              {/* 時間標籤 */}
              <View style={styles.timeLabel}>
                <Text style={styles.timeLabelText}>
                  {formatTimeSlot(hour)}
                </Text>
              </View>
              
              {/* 一週的時間槽 */}
              {weekDates.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const hourEvents = dayEvents.filter(event => {
                  const eventStartTime = new Date(event.start_ts * 1000);
                  return eventStartTime.getHours() === hour;
                });

                return (
                  <View key={index} style={styles.timeSlot}>
                    {hourEvents.map(event => renderEventInSlot(event, date))}
                  </View>
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
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  timeColumn: {
    width: 60,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  todayHeader: {
    backgroundColor: '#eff6ff',
  },
  dayHeaderText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  todayHeaderText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '600',
  },
  todayDateText: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderRadius: 16,
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
  },
  scrollView: {
    flex: 1,
  },
  timeGrid: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timeLabel: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  timeLabelText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  timeSlot: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
    position: 'relative',
    padding: 2,
  },
  eventBlock: {
    borderRadius: 6,
    padding: 4,
    position: 'absolute',
    left: 2,
    right: 2,
    top: 2,
  },
  eventText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
}); 