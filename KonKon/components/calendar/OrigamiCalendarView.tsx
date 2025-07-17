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

// 摺紙顏色主題
const origamiColors = {
  crane: { primary: '#FF69B4', secondary: '#FFB6C1', emoji: '🕊️' },
  flower: { primary: '#FF6B6B', secondary: '#FFA07A', emoji: '🌸' },
  butterfly: { primary: '#9370DB', secondary: '#DDA0DD', emoji: '🦋' },
  star: { primary: '#FFD700', secondary: '#FFF8DC', emoji: '⭐' },
  heart: { primary: '#DC143C', secondary: '#FFB6C1', emoji: '💖' },
  fish: { primary: '#4169E1', secondary: '#87CEEB', emoji: '🐠' },
  leaf: { primary: '#32CD32', secondary: '#98FB98', emoji: '🍃' },
  bird: { primary: '#FF8C00', secondary: '#FFDAB9', emoji: '🐦' },
};

export default function OrigamiCalendarView({
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
  const [foldAnimations] = useState(() => 
    Array.from({ length: 42 }, () => new Animated.Value(0))
  );
  const [craneAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // 千紙鶴飛舞動畫
    Animated.loop(
      Animated.sequence([
        Animated.timing(craneAnimation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(craneAnimation, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 摺紙展開動畫
    const staggered = animatedValues.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: index * 50,
        useNativeDriver: true,
      })
    );

    // 摺痕動畫
    const foldStaggered = foldAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 30 + 200,
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      ...staggered,
      ...foldStaggered,
    ]).start();
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

    // 填滿6週
    while (days.length < 42) {
      days.push({ day: '', isCurrentMonth: false });
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

  const getOrigamiType = (event: any, index: number) => {
    const title = event.title.toLowerCase();
    const types = Object.keys(origamiColors);
    
    if (title.includes('love') || title.includes('愛') || title.includes('結婚')) {
      return origamiColors.heart;
    } else if (title.includes('work') || title.includes('仕事') || title.includes('会議')) {
      return origamiColors.crane;
    } else if (title.includes('school') || title.includes('学校') || title.includes('勉強')) {
      return origamiColors.star;
    } else if (title.includes('nature') || title.includes('自然') || title.includes('散歩')) {
      return origamiColors.leaf;
    } else if (title.includes('celebration') || title.includes('祝い') || title.includes('パーティー')) {
      return origamiColors.flower;
    } else {
      const type = types[index % types.length] as keyof typeof origamiColors;
      return origamiColors[type];
    }
  };

  const renderPaperBackground = () => {
    return (
      <View style={styles.paperBackground}>
        {/* 紙張紋理 */}
        <View style={styles.paperTexture} />
        
        {/* 飛舞的千紙鶴 */}
        {Array.from({ length: 3 }).map((_, index) => {
          const translateX = craneAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, width + 50],
          });
          const translateY = craneAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [100 + index * 150, 200 + index * 150],
          });
          const rotate = craneAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.flyingCrane,
                {
                  transform: [
                    { translateX },
                    { translateY },
                    { rotate },
                  ],
                },
              ]}
            >
              <Text style={styles.craneEmoji}>🕊️</Text>
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
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => onMonthChange?.(
            `${year}-${(month - 1).toString().padStart(2, '0')}`
          )}
          style={styles.navButton}
        >
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>📋 {monthNames[month - 1]}の折り紙暦</Text>
          <Text style={styles.monthYear}>{year}年 {month}月</Text>
          <View style={styles.decorativeFold} />
        </View>

        <TouchableOpacity 
          onPress={() => onMonthChange?.(
            `${year}-${(month + 1).toString().padStart(2, '0')}`
          )}
          style={styles.navButton}
        >
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderOrigamiDay = (dayInfo: any, index: number) => {
    if (!dayInfo.isCurrentMonth) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const dayEvents = getEventsForDay(dayInfo.day);
    const isSelected = selectedDate.getDate() === dayInfo.day;
    const isToday = new Date().getDate() === dayInfo.day;

    // 摺紙變換
    const rotateX = foldAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: ['45deg', '0deg'],
    });

    const rotateY = foldAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: ['45deg', '0deg'],
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.origamiContainer,
          {
            transform: [
              { 
                scale: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                })
              },
              { rotateX },
              { rotateY },
            ],
            opacity: animatedValues[index],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.origamiPaper,
            {
              backgroundColor: isSelected ? '#FFE4B5' : '#FFFEF7',
              borderColor: isToday ? '#FF69B4' : '#E0E0E0',
              borderWidth: isToday ? 3 : 1,
            },
          ]}
          onPress={() => {
            const [year, month] = currentMonth.split('-').map(Number);
            onDatePress(new Date(year, month - 1, dayInfo.day));
          }}
        >
          {/* 摺痕效果 */}
          <View style={styles.foldLines}>
            <View style={[styles.foldLine, styles.diagonalFold1]} />
            <View style={[styles.foldLine, styles.diagonalFold2]} />
            <View style={[styles.foldLine, styles.verticalFold]} />
            <View style={[styles.foldLine, styles.horizontalFold]} />
          </View>

          {/* 日期數字 */}
          <View style={[
            styles.dayNumber,
            { backgroundColor: isToday ? '#FF69B4' : 'transparent' },
          ]}>
            <Text style={[
              styles.dayText,
              { 
                color: isToday ? '#FFF' : '#333',
                fontWeight: isToday ? 'bold' : 'normal',
              },
            ]}>
              {dayInfo.day}
            </Text>
          </View>

          {/* 摺紙事件 */}
          {dayEvents.length > 0 && (
            <View style={styles.origamiEvents}>
              {dayEvents.slice(0, 3).map((event, eventIndex) => {
                const origamiType = getOrigamiType(event, eventIndex);
                const positions = [
                  { top: 20, left: 8 },
                  { top: 35, right: 8 },
                  { bottom: 8, left: 8 },
                ];
                const position = positions[eventIndex] || positions[0];

                return (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.origamiEvent,
                      {
                        backgroundColor: origamiType.primary + '20',
                        borderColor: origamiType.primary,
                        ...position,
                      },
                    ]}
                    onPress={() => onEventPress(event)}
                  >
                    <Text style={styles.origamiEmoji}>
                      {origamiType.emoji}
                    </Text>
                    <View style={[
                      styles.eventFold,
                      { backgroundColor: origamiType.secondary },
                    ]} />
                  </TouchableOpacity>
                );
              })}

              {dayEvents.length > 3 && (
                <View style={styles.moreOrigami}>
                  <Text style={styles.moreText}>
                    +{dayEvents.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 紙張陰影 */}
          <View style={styles.paperShadow} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderWeekDays = () => {
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    return (
      <View style={styles.weekHeader}>
        {weekDays.map((day, index) => (
          <View key={day} style={styles.weekDayContainer}>
            <View style={styles.weekDayPaper}>
              <Text style={[
                styles.weekDayText,
                {
                  color: index === 0 || index === 6 ? '#FF69B4' : '#666',
                },
              ]}>
                {day}曜日
              </Text>
              <View style={styles.weekDayFold} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLegend = () => {
    return (
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>📋 折り紙の種類</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.legendContainer}>
            {Object.entries(origamiColors).map(([key, type]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[
                  styles.legendOrigami,
                  { 
                    backgroundColor: type.primary + '30',
                    borderColor: type.primary,
                  },
                ]}>
                  <Text style={styles.legendEmoji}>{type.emoji}</Text>
                  <View style={[
                    styles.legendFold,
                    { backgroundColor: type.secondary },
                  ]} />
                </View>
                <Text style={styles.legendText}>{key}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const days = getDaysInMonth();

  return (
    <View style={styles.container}>
      {renderPaperBackground()}
      
      <ScrollView style={styles.content}>
        {renderHeader()}
        {renderWeekDays()}

        {/* 摺紙日期網格 */}
        <View style={styles.origamiGrid}>
          {days.map((dayInfo, index) => renderOrigamiDay(dayInfo, index))}
        </View>

        {renderLegend()}

        {/* 底部摺紙裝飾 */}
        <View style={styles.bottomDecoration}>
          <Text style={styles.bottomText}>
            🕊️ 心を込めて折った、家族の大切な時間 🕊️
          </Text>
          <View style={styles.decorationFolds}>
            <View style={styles.decorationFold} />
            <View style={styles.decorationFold} />
            <View style={styles.decorationFold} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  paperBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFEF7',
  },
  paperTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.1,
  },
  flyingCrane: {
    position: 'absolute',
    zIndex: 1,
  },
  craneEmoji: {
    fontSize: 24,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  navButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  navText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  monthYear: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  decorativeFold: {
    width: 60,
    height: 3,
    backgroundColor: '#FF69B4',
    borderRadius: 1,
    position: 'relative',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayPaper: {
    backgroundColor: '#FFF',
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  weekDayText: {
    fontSize: 10,
    fontWeight: '600',
  },
  weekDayFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  origamiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyDay: {
    width: (width - 24) / 7,
    height: 85,
    margin: 1,
  },
  origamiContainer: {
    width: (width - 24) / 7,
    height: 85,
    margin: 1,
  },
  origamiPaper: {
    flex: 1,
    borderRadius: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foldLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  foldLine: {
    position: 'absolute',
    backgroundColor: '#E0E0E0',
    opacity: 0.5,
  },
  diagonalFold1: {
    width: 1,
    height: '70%',
    top: '15%',
    left: '30%',
    transform: [{ rotate: '45deg' }],
  },
  diagonalFold2: {
    width: 1,
    height: '70%',
    top: '15%',
    right: '30%',
    transform: [{ rotate: '-45deg' }],
  },
  verticalFold: {
    width: 1,
    height: '60%',
    top: '20%',
    left: '50%',
  },
  horizontalFold: {
    height: 1,
    width: '60%',
    left: '20%',
    top: '50%',
  },
  dayNumber: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  origamiEvents: {
    flex: 1,
    position: 'relative',
    marginTop: 20,
  },
  origamiEvent: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  origamiEmoji: {
    fontSize: 8,
  },
  eventFold: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreOrigami: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FFE4B5',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  moreText: {
    fontSize: 6,
    color: '#666',
    fontWeight: 'bold',
  },
  paperShadow: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    left: 2,
    top: 2,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    zIndex: -1,
  },
  legend: {
    margin: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  legendItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendOrigami: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  legendEmoji: {
    fontSize: 10,
  },
  legendFold: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 8,
    color: '#666',
    fontWeight: '500',
  },
  bottomDecoration: {
    margin: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bottomText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  decorationFolds: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  decorationFold: {
    width: 20,
    height: 20,
    backgroundColor: '#FF69B4',
    marginHorizontal: 4,
    transform: [{ rotate: '45deg' }],
    opacity: 0.3,
  },
}); 