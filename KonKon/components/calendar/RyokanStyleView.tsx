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

// 旅館活動類型
const ryokanActivities = {
  onsen: { emoji: '♨️', color: '#87CEEB', bg: '#F0F8FF', label: '温泉' },
  meal: { emoji: '🍱', color: '#DEB887', bg: '#FFF8DC', label: '食事' },
  tea: { emoji: '🍵', color: '#90EE90', bg: '#F0FFF0', label: '茶道' },
  garden: { emoji: '🌸', color: '#FFB6C1', bg: '#FFF0F5', label: '庭園' },
  rest: { emoji: '🏮', color: '#DDA0DD', bg: '#F8F0FF', label: '休憩' },
  meditation: { emoji: '🧘', color: '#F0E68C', bg: '#FFFACD', label: '瞑想' },
  ceremony: { emoji: '🎌', color: '#FF6B6B', bg: '#FFF5F5', label: '儀式' },
  reading: { emoji: '📖', color: '#D2B48C', bg: '#FDF5E6', label: '読書' },
};

export default function RyokanStyleView({
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
  const [lanternAnimation] = useState(new Animated.Value(0));
  const [waveAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // 燈籠搖擺動畫
    Animated.loop(
      Animated.sequence([
        Animated.timing(lanternAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(lanternAnimation, {
          toValue: -1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(lanternAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 波紋動畫
    Animated.loop(
      Animated.timing(waveAnimation, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // 榻榻米格子浮現
    const staggered = animatedValues.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 60,
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

  const categorizeAsRyokanActivity = (event: any, index: number) => {
    const title = event.title.toLowerCase();
    const activities = Object.keys(ryokanActivities);
    
    if (title.includes('spa') || title.includes('温泉') || title.includes('bath')) {
      return ryokanActivities.onsen;
    } else if (title.includes('meal') || title.includes('食事') || title.includes('dinner') || title.includes('lunch')) {
      return ryokanActivities.meal;
    } else if (title.includes('tea') || title.includes('茶') || title.includes('ceremony')) {
      return ryokanActivities.tea;
    } else if (title.includes('garden') || title.includes('庭') || title.includes('walk')) {
      return ryokanActivities.garden;
    } else if (title.includes('meditation') || title.includes('瞑想') || title.includes('zen')) {
      return ryokanActivities.meditation;
    } else if (title.includes('rest') || title.includes('休憩') || title.includes('sleep')) {
      return ryokanActivities.rest;
    } else if (title.includes('ceremony') || title.includes('儀式') || title.includes('ritual')) {
      return ryokanActivities.ceremony;
    } else {
      const activity = activities[index % activities.length] as keyof typeof ryokanActivities;
      return ryokanActivities[activity];
    }
  };

  const renderRyokanBackground = () => {
    return (
      <View style={styles.ryokanBackground}>
                 {/* 榻榻米紋理 */}
         <View style={styles.tatamiTexture}>
           {Array.from({ length: 20 }).map((_, index) => (
             <View key={index} style={[
               styles.backgroundTatami,
               {
                 top: (index % 4) * height / 4,
                 left: Math.floor(index / 4) * width / 5,
               },
             ]} />
           ))}
         </View>

        {/* 搖曳的燈籠 */}
        <Animated.View style={[
          styles.lantern,
          {
            transform: [
              {
                rotate: lanternAnimation.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-5deg', '5deg'],
                }),
              },
            ],
          },
        ]}>
          <Text style={styles.lanternEmoji}>🏮</Text>
        </Animated.View>

        {/* 池塘波紋 */}
        <View style={styles.pond}>
          <Animated.View style={[
            styles.wave,
            {
              transform: [
                {
                  scale: waveAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 2],
                  }),
                },
              ],
              opacity: waveAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 0],
              }),
            },
          ]} />
        </View>
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
          <Text style={styles.headerTitle}>🏮 {monthNames[month - 1]}の旅館手帳</Text>
          <Text style={styles.monthYear}>{year}年 {month}月</Text>
          <View style={styles.headerDecoration}>
            <View style={styles.decorationElement} />
            <Text style={styles.decorationText}>～心の安らぎ～</Text>
            <View style={styles.decorationElement} />
          </View>
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

  const renderTatamiDay = (dayInfo: any, index: number) => {
    if (!dayInfo.isCurrentMonth) {
      return <View key={index} style={styles.emptyTatami} />;
    }

    const dayEvents = getEventsForDay(dayInfo.day);
    const isSelected = selectedDate.getDate() === dayInfo.day;
    const isToday = new Date().getDate() === dayInfo.day;

    return (
      <Animated.View
        key={index}
        style={[
          styles.tatamiContainer,
          {
            transform: [
              {
                scale: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
              {
                translateY: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
            opacity: animatedValues[index],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tatamiMat,
            {
              backgroundColor: isSelected ? '#FFF8DC' : '#F5F5DC',
              borderColor: isToday ? '#FF6B6B' : '#DEB887',
              borderWidth: isToday ? 3 : 1,
            },
          ]}
          onPress={() => {
            const [year, month] = currentMonth.split('-').map(Number);
            onDatePress(new Date(year, month - 1, dayInfo.day));
          }}
        >
          {/* 榻榻米邊框 */}
          <View style={styles.tatamiEdge} />
          
          {/* 日期標記 */}
          <View style={[
            styles.dayMark,
            { backgroundColor: isToday ? '#FF6B6B' : '#8B4513' },
          ]}>
            <Text style={[
              styles.dayText,
              { color: isToday ? '#FFF' : '#F5F5DC' },
            ]}>
              {dayInfo.day}
            </Text>
          </View>

          {/* 旅館活動安排 */}
          {dayEvents.length > 0 && (
            <View style={styles.activitiesArea}>
              {dayEvents.slice(0, 3).map((event, eventIndex) => {
                const activity = categorizeAsRyokanActivity(event, eventIndex);
                const positions = [
                  { top: 25, left: 6, right: 6 },
                  { top: 45, left: 6, right: 6 },
                  { bottom: 6, left: 6, right: 6 },
                ];
                const position = positions[eventIndex] || positions[0];

                return (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.activityItem,
                      {
                        backgroundColor: activity.bg,
                        borderLeftColor: activity.color,
                        ...position,
                      },
                    ]}
                    onPress={() => onEventPress(event)}
                  >
                    <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                    <Text style={[
                      styles.activityText,
                      { color: activity.color },
                    ]} numberOfLines={1}>
                      {event.title.length > 6 ? 
                        event.title.substring(0, 6) + '…' : 
                        event.title
                      }
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {dayEvents.length > 3 && (
                <View style={styles.moreActivities}>
                  <Text style={styles.moreText}>
                    他{dayEvents.length - 3}件
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 榻榻米紋理線條 */}
          <View style={styles.tatamiLines}>
            <View style={styles.tatamiLine} />
            <View style={styles.tatamiLine} />
            <View style={styles.tatamiLine} />
          </View>
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
            <View style={styles.weekDayPlaque}>
              <Text style={[
                styles.weekDayText,
                {
                  color: index === 0 || index === 6 ? '#8B4513' : '#5D4037',
                },
              ]}>
                {day}
              </Text>
              <View style={styles.plaqueDecoration} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderActivityLegend = () => {
    return (
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>🏮 旅館のおもてなし</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.legendContainer}>
            {Object.entries(ryokanActivities).map(([key, activity]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[
                  styles.legendActivity,
                  { 
                    backgroundColor: activity.bg,
                    borderColor: activity.color,
                  },
                ]}>
                  <Text style={styles.legendEmoji}>{activity.emoji}</Text>
                </View>
                <Text style={styles.legendText}>{activity.label}</Text>
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
      {renderRyokanBackground()}
      
      <ScrollView style={styles.content}>
        {renderHeader()}
        {renderWeekDays()}

        {/* 榻榻米日期網格 */}
        <View style={styles.tatamiGrid}>
          {days.map((dayInfo, index) => renderTatamiDay(dayInfo, index))}
        </View>

        {renderActivityLegend()}

        {/* 旅館底部裝飾 */}
        <View style={styles.ryokanFooter}>
          <View style={styles.footerDecoration}>
            <Text style={styles.footerText}>
              ♨️ 心静かに過ごす、家族の温かい時間 ♨️
            </Text>
            <View style={styles.footerPattern}>
              <View style={styles.patternElement} />
              <View style={styles.patternElement} />
              <View style={styles.patternElement} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  ryokanBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tatamiTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  backgroundTatami: {
    position: 'absolute',
    width: width / 5,
    height: height / 4,
    backgroundColor: '#DEB887',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  lantern: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 1,
  },
  lanternEmoji: {
    fontSize: 32,
    opacity: 0.8,
  },
  pond: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#87CEEB',
    opacity: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4682B4',
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
    backgroundColor: 'rgba(245, 245, 220, 0.95)',
    borderBottomWidth: 2,
    borderBottomColor: '#8B4513',
  },
  navButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  navText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 4,
  },
  monthYear: {
    fontSize: 14,
    color: '#8B4513',
    marginBottom: 8,
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decorationElement: {
    width: 20,
    height: 2,
    backgroundColor: '#8B4513',
    marginHorizontal: 8,
  },
  decorationText: {
    fontSize: 10,
    color: '#5D4037',
    fontStyle: 'italic',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(222, 184, 135, 0.7)',
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayPlaque: {
    backgroundColor: '#8B4513',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'relative',
  },
  weekDayText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F5F5DC',
  },
  plaqueDecoration: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 4,
    height: 4,
    backgroundColor: '#DAA520',
    borderRadius: 2,
  },
  tatamiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyTatami: {
    width: (width - 24) / 7,
    height: 90,
    margin: 1,
  },
  tatamiContainer: {
    width: (width - 24) / 7,
    height: 90,
    margin: 1,
  },
  tatamiMat: {
    flex: 1,
    borderRadius: 4,
    position: 'relative',
    shadowColor: '#8B4513',
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  tatamiEdge: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 2,
  },
  dayMark: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 14,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  activitiesArea: {
    position: 'absolute',
    top: 20,
    left: 4,
    right: 4,
    bottom: 8,
  },
  activityItem: {
    position: 'absolute',
    height: 14,
    borderRadius: 3,
    borderLeftWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 7,
    marginRight: 2,
  },
  activityText: {
    fontSize: 6,
    fontWeight: '500',
    flex: 1,
  },
  moreActivities: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B4513',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  moreText: {
    fontSize: 6,
    color: '#F5F5DC',
    fontWeight: 'bold',
  },
  tatamiLines: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    right: 6,
  },
  tatamiLine: {
    height: 1,
    backgroundColor: '#8B4513',
    marginVertical: 1,
    opacity: 0.3,
  },
  legend: {
    margin: 12,
    padding: 12,
    backgroundColor: 'rgba(245, 245, 220, 0.95)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D4037',
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
  legendActivity: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendEmoji: {
    fontSize: 12,
  },
  legendText: {
    fontSize: 8,
    color: '#5D4037',
    fontWeight: '600',
  },
  ryokanFooter: {
    margin: 12,
    backgroundColor: 'rgba(245, 245, 220, 0.95)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  footerDecoration: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#5D4037',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  footerPattern: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  patternElement: {
    width: 16,
    height: 16,
    backgroundColor: '#8B4513',
    marginHorizontal: 4,
    transform: [{ rotate: '45deg' }],
    opacity: 0.6,
  },
}); 