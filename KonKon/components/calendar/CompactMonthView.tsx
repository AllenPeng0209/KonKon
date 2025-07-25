import { StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { CalendarViewProps } from './CalendarViewTypes';

export default function CompactMonthView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
  onMonthChange,
}: CalendarViewProps) {
  // 获取本地日期字符串（避免时区问题）
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 生成日历标记数据
  const getCalendarMarkedDates = () => {
    const markedDates: { [key: string]: any } = {};
    const today = getLocalDateString(new Date());
    const selectedDateString = getLocalDateString(selectedDate);
    
    // 标记选中的日期（绿色光标）
    markedDates[selectedDateString] = {
      selected: true,
      selectedColor: '#10b981',
      selectedTextColor: '#ffffff',
    };
    
    // 如果今天不是选中日期，为今天设置特殊的文字颜色
    if (today !== selectedDateString) {
      markedDates[today] = {
        selected: false,
        // todayTextColor 在 theme 中定义
      };
    }
    
    // 标记有事件的日期
    events.forEach(event => {
      const eventDate = getLocalDateString(new Date(event.start_ts * 1000));
      if (markedDates[eventDate]) {
        markedDates[eventDate] = {
          ...markedDates[eventDate],
          marked: true,
          dotColor: event.color || '#f59e0b',
        };
      } else {
        markedDates[eventDate] = {
          marked: true,
          dotColor: event.color || '#f59e0b',
        };
      }
    });
    
    return markedDates;
  };

  const handleDatePress = (dateData: DateData) => {
    const clickedDate = new Date(dateData.dateString);
    onDatePress(clickedDate);
  };

  const handleMonthChange = (month: DateData) => {
    if (onMonthChange) {
      onMonthChange(month.dateString.slice(0, 7));
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        key={currentMonth}
        current={currentMonth}
        markedDates={getCalendarMarkedDates()}
        onDayPress={handleDatePress}
        onMonthChange={handleMonthChange}
        enableSwipeMonths={true}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#374151',
          selectedDayBackgroundColor: '#10b981',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#10b981',
          dayTextColor: '#374151',
          textDisabledColor: '#d1d5db',
          dotColor: '#f59e0b',
          selectedDotColor: '#ffffff',
          arrowColor: '#10b981',
          disabledArrowColor: '#d1d5db',
          monthTextColor: '#111827',
          indicatorColor: '#10b981',
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontWeight: '500',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
        hideExtraDays={true}
        firstDay={1}
        showWeekNumbers={false}
        disableMonthChange={false}
        hideDayNames={false}
        showSixWeeks={false}
        disabledByDefault={false}
        markingType={'dot'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    margin: 8, // 更小的边距
    borderRadius: 12, // 更小的圆角
    padding: 12, // 更小的内边距
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  calendar: {
    borderRadius: 8,
  },
}); 