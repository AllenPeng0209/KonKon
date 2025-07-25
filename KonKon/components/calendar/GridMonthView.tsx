import { StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { CalendarViewProps } from './CalendarViewTypes';

export default function GridMonthView({
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
    
    // 标记选中的日期（蓝色光标）
    markedDates[selectedDateString] = {
      selected: true,
      selectedColor: '#3b82f6',
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
    events.forEach((event) => {
      const eventDate = getLocalDateString(new Date(event.start_ts * 1000));
      
      if (markedDates[eventDate]) {
        markedDates[eventDate] = {
          ...markedDates[eventDate],
          marked: true,
          dotColor: event.color || '#ff6b6b',
        };
      } else {
        markedDates[eventDate] = {
          marked: true,
          dotColor: event.color || '#ff6b6b',
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
        current={currentMonth}
        markedDates={getCalendarMarkedDates()}
        onDayPress={handleDatePress}
        onMonthChange={handleMonthChange}
        enableSwipeMonths={true}
        hideArrows={false}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#2c3e50',
          selectedDayBackgroundColor: '#3b82f6',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3b82f6',
          dayTextColor: '#2c3e50',
          textDisabledColor: '#d1d5db',
          dotColor: '#ff6b6b',
          selectedDotColor: '#ffffff',
          arrowColor: '#3b82f6',
          disabledArrowColor: '#d1d5db',
          monthTextColor: '#1f2937',
          indicatorColor: '#3b82f6',
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontWeight: '600',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
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
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(135, 206, 235, 0.2)',
  },
  calendarContainer: {
    flex: 1,
    borderRadius: 12,
  },
  calendar: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
}); 