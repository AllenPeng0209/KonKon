import { StyleSheet, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { getCurrentLocale, t } from '../../lib/i18n';
import { CalendarViewProps } from './CalendarViewTypes';

// 配置多語言
const configureCalendarLocale = () => {
  const currentLocale = getCurrentLocale();

  LocaleConfig.locales[currentLocale] = {
    monthNames: [
      t('calendar.months.january'),
      t('calendar.months.february'),
      t('calendar.months.march'),
      t('calendar.months.april'),
      t('calendar.months.may'),
      t('calendar.months.june'),
      t('calendar.months.july'),
      t('calendar.months.august'),
      t('calendar.months.september'),
      t('calendar.months.october'),
      t('calendar.months.november'),
      t('calendar.months.december'),
    ],
    monthNamesShort: [
      t('calendar.monthsShort.jan'),
      t('calendar.monthsShort.feb'),
      t('calendar.monthsShort.mar'),
      t('calendar.monthsShort.apr'),
      t('calendar.monthsShort.may'),
      t('calendar.monthsShort.jun'),
      t('calendar.monthsShort.jul'),
      t('calendar.monthsShort.aug'),
      t('calendar.monthsShort.sep'),
      t('calendar.monthsShort.oct'),
      t('calendar.monthsShort.nov'),
      t('calendar.monthsShort.dec'),
    ],
    dayNames: [
      t('calendar.days.sunday'),
      t('calendar.days.monday'),
      t('calendar.days.tuesday'),
      t('calendar.days.wednesday'),
      t('calendar.days.thursday'),
      t('calendar.days.friday'),
      t('calendar.days.saturday'),
    ],
    dayNamesShort: [
      t('calendar.daysShort.sun'),
      t('calendar.daysShort.mon'),
      t('calendar.daysShort.tue'),
      t('calendar.daysShort.wed'),
      t('calendar.daysShort.thu'),
      t('calendar.daysShort.fri'),
      t('calendar.daysShort.sat'),
    ],
    today: t('calendar.today'),
  };
  LocaleConfig.defaultLocale = currentLocale;
};

export default function GridMonthView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
  onMonthChange,
}: CalendarViewProps) {
  // 配置語言
  configureCalendarLocale();
  
  // 獲取本地日期字符串（避免時區問題）
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 生成日曆標記數據
  const getCalendarMarkedDates = () => {
    const markedDates: { [key: string]: any } = {};
    const today = getLocalDateString(new Date());
    const selectedDateString = getLocalDateString(selectedDate);
    
    // 標記選中的日期（藍色光標）
    markedDates[selectedDateString] = {
      selected: true,
      selectedColor: '#3b82f6',
      selectedTextColor: '#ffffff',
    };
    
    // 如果今天不是選中日期，為今天設置特殊的文字顏色
    if (today !== selectedDateString) {
      markedDates[today] = {
        selected: false,
        // todayTextColor 在 theme 中定義
      };
    }
    
    // 標記有事件的日期
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