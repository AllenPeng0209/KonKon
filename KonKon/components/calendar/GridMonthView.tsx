import { StyleSheet, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { getCurrentLocale } from '../../lib/i18n';
import { CalendarViewProps } from './CalendarViewTypes';

// 配置多語言
const configureCalendarLocale = () => {
  const currentLocale = getCurrentLocale();
  
  if (currentLocale === 'zh-CN') {
    LocaleConfig.locales['zh-CN'] = {
      monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
      dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
      today: '今天'
    };
    LocaleConfig.defaultLocale = 'zh-CN';
  } else if (currentLocale === 'zh-TW') {
    LocaleConfig.locales['zh-TW'] = {
      monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
      dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
      today: '今天'
    };
    LocaleConfig.defaultLocale = 'zh-TW';
  } else if (currentLocale === 'ja-JP') {
    LocaleConfig.locales['ja-JP'] = {
      monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
      dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
      today: '今日'
    };
    LocaleConfig.defaultLocale = 'ja-JP';
  } else {
    LocaleConfig.locales['en'] = {
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      today: 'Today'
    };
    LocaleConfig.defaultLocale = 'en';
  }
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