import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

const { width, height } = Dimensions.get('window');

// 日本四季主題配色和元素
const seasonalThemes = {
  spring: {
    name: '春 - 櫻花盛開',
    colors: ['#FFB6C1', '#FFC0CB', '#FFE4E1', '#FFFFFF'],
    background: '#FFF8F8',
    accent: '#FF69B4',
    elements: ['🌸', '🌺', '🌷', '🦋', '🌿'],
    pattern: 'sakura',
  },
  summer: {
    name: '夏 - 清涼綠意',
    colors: ['#90EE90', '#98FB98', '#ADFF2F', '#32CD32'],
    background: '#F0FFF0',
    accent: '#228B22',
    elements: ['🍃', '🌿', '🌱', '🎋', '🎆'],
    pattern: 'bamboo',
  },
  autumn: {
    name: '秋 - 楓葉飄舞',
    colors: ['#FF6347', '#FF7F50', '#FFA500', '#FFD700'],
    background: '#FFF8DC',
    accent: '#B22222',
    elements: ['🍁', '🍂', '🌰', '🎑', '🍄'],
    pattern: 'maple',
  },
  winter: {
    name: '冬 - 雪花紛飛',
    colors: ['#E6E6FA', '#F0F8FF', '#FFFFFF', '#B0C4DE'],
    background: '#F8F8FF',
    accent: '#4169E1',
    elements: ['❄️', '⛄', '🌨️', '🏔️', '❅'],
    pattern: 'snow',
  },
};

export default function SeasonalHarmonyView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
  onMonthChange,
}: CalendarViewProps) {
  const [animatedValues] = useState(() => 
    Array.from({ length: 42 }, () => new Animated.Value(0))
  );
  const [seasonAnimations] = useState(() => 
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );

  // 根據月份決定季節
  const getCurrentSeason = (month: string) => {
    const monthNum = parseInt(month.split('-')[1]);
    if (monthNum >= 3 && monthNum <= 5) return 'spring';
    if (monthNum >= 6 && monthNum <= 8) return 'summer';
    if (monthNum >= 9 && monthNum <= 11) return 'autumn';
    return 'winter';
  };

  const currentSeason = getCurrentSeason(currentMonth);
  const theme = seasonalThemes[currentSeason];

  useEffect(() => {
    // 啟動季節背景動畫
    const animations = seasonAnimations.map((anim, index) => 
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2000 + index * 300,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach(anim => anim.start());

    return () => animations.forEach(anim => anim.stop());
  }, [currentSeason]);

  useEffect(() => {
    // 日期格子的浮現動畫
    const staggered = animatedValues.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: index * 50,
        useNativeDriver: true,
      })
    );

    Animated.parallel(staggered).start();
  }, [currentMonth]);

  const getDaysInMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 前一個月的日期
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: '', isCurrentMonth: false });
    }
    
    // 當前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true });
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

    return events.filter(event => 
      event.start_ts >= dayStart && event.start_ts <= dayEnd
    );
  };

  const renderSeasonalBackground = () => {
    return (
      <View style={[styles.backgroundContainer, { backgroundColor: theme.background }]}>
        {seasonAnimations.map((anim, index) => {
          const element = theme.elements[index % theme.elements.length];
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [height, -50],
          });
          const rotate = anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.backgroundElement,
                {
                  left: (index * 73) % width,
                  transform: [
                    { translateY },
                    { rotate: currentSeason === 'autumn' ? rotate : '0deg' },
                  ],
                },
              ]}
            >
              <Text style={styles.elementIcon}>{element}</Text>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderHeader = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const monthNames = [
      '睦月', '如月', '弥生', '卯月', '皐月', '水無月',
      '文月', '葉月', '長月', '神無月', '霜月', '師走'
    ];

    return (
      <View style={[styles.header, { borderBottomColor: theme.accent }]}>
        <TouchableOpacity 
          onPress={() => onMonthChange?.(
            `${year}-${(month - 1).toString().padStart(2, '0')}`
          )}
          style={styles.navButton}
        >
          <Text style={[styles.navText, { color: theme.accent }]}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.seasonName, { color: theme.accent }]}>
            {theme.name}
          </Text>
          <Text style={[styles.monthYear, { color: theme.accent }]}>
            {year}年 {monthNames[month - 1]}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={() => onMonthChange?.(
            `${year}-${(month + 1).toString().padStart(2, '0')}`
          )}
          style={styles.navButton}
        >
          <Text style={[styles.navText, { color: theme.accent }]}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDay = (dayInfo: any, index: number) => {
    if (!dayInfo.isCurrentMonth) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const dayEvents = getEventsForDay(dayInfo.day);
    const isSelected = selectedDate.getDate() === dayInfo.day;
    const isToday = new Date().getDate() === dayInfo.day;

    return (
      <Animated.View
        key={index}
        style={[
          styles.dayContainer,
          {
            transform: [{ scale: animatedValues[index] }],
            opacity: animatedValues[index],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dayButton,
            {
              backgroundColor: isSelected ? theme.accent : 'transparent',
              borderColor: isToday ? theme.accent : theme.colors[0],
            },
          ]}
          onPress={() => {
            const [year, month] = currentMonth.split('-').map(Number);
            onDatePress(new Date(year, month - 1, dayInfo.day));
          }}
        >
          <Text style={[
            styles.dayText,
            {
              color: isSelected ? '#FFFFFF' : theme.accent,
              fontWeight: isToday ? 'bold' : 'normal',
            },
          ]}>
            {dayInfo.day}
          </Text>

          {dayEvents.length > 0 && (
            <View style={styles.eventsContainer}>
              {dayEvents.slice(0, 2).map((event, eventIndex) => (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventDot,
                    { backgroundColor: theme.colors[eventIndex % theme.colors.length] },
                  ]}
                  onPress={() => onEventPress(event)}
                >
                  <Text style={styles.eventEmoji}>
                    {theme.elements[eventIndex % theme.elements.length]}
                  </Text>
                </TouchableOpacity>
              ))}
              {dayEvents.length > 2 && (
                <Text style={[styles.moreEvents, { color: theme.accent }]}>
                  +{dayEvents.length - 2}
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const days = getDaysInMonth();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <View style={styles.container}>
      {renderSeasonalBackground()}
      
      <ScrollView style={styles.content}>
        {renderHeader()}

        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <View key={day} style={styles.weekDayContainer}>
              <Text style={[
                styles.weekDayText,
                {
                  color: index === 0 || index === 6 ? theme.accent : '#666',
                },
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((dayInfo, index) => renderDay(dayInfo, index))}
        </View>

        <View style={[styles.seasonInfo, { backgroundColor: theme.colors[0] }]}>
          <Text style={[styles.seasonInfoText, { color: theme.accent }]}>
            📅 和の暦 - {theme.name}
          </Text>
          <Text style={[styles.seasonDesc, { color: theme.accent }]}>
            日本の美しい四季を感じながら、家族の大切な時間を記録しましょう
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  backgroundElement: {
    position: 'absolute',
    zIndex: 1,
  },
  elementIcon: {
    fontSize: 24,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  navButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  navText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  seasonName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '300',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  emptyDay: {
    width: (width - 32) / 7,
    height: 60,
  },
  dayContainer: {
    width: (width - 32) / 7,
    height: 60,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventsContainer: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  eventDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventEmoji: {
    fontSize: 8,
  },
  moreEvents: {
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  seasonInfo: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    opacity: 0.9,
  },
  seasonInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  seasonDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
}); 