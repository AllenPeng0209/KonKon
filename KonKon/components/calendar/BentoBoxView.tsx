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

// 便當菜品配色 
const bentoColors = {
  rice: { bg: '#FFFEF7', border: '#F4E4BC', emoji: '🍚' },
  meat: { bg: '#FFE4E1', border: '#DEB887', emoji: '🍖' },
  vegetable: { bg: '#F0FFF0', border: '#90EE90', emoji: '🥬' },
  fish: { bg: '#E6F3FF', border: '#87CEEB', emoji: '🐟' },
  egg: { bg: '#FFF8DC', border: '#FFD700', emoji: '🥚' },
  fruit: { bg: '#FFF0F5', border: '#FFB6C1', emoji: '🍓' },
  soup: { bg: '#FFF8DC', border: '#DDA0DD', emoji: '🍲' },
  pickle: { bg: '#F0FFFF', border: '#20B2AA', emoji: '🥒' },
};

// 便當格子大小配置
const boxSizes = {
  large: { width: 2, height: 2 }, // 主菜
  medium: { width: 2, height: 1 }, // 副菜
  small: { width: 1, height: 1 }, // 小菜
};

export default function BentoBoxView({
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
  const [lidAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // 便當開蓋動畫
    Animated.timing(lidAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 格子逐個浮現
    const staggered = animatedValues.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 40,
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

  const categorizeEventAsDish = (event: any, index: number) => {
    const title = event.title.toLowerCase();
    const keys = Object.keys(bentoColors);
    
    // 根據事件類型分配菜品
    if (title.includes('work') || title.includes('仕事') || title.includes('会議')) {
      return bentoColors.meat;
    } else if (title.includes('school') || title.includes('学校') || title.includes('宿題')) {
      return bentoColors.vegetable;
    } else if (title.includes('health') || title.includes('病院') || title.includes('運動')) {
      return bentoColors.fish;
    } else if (title.includes('shopping') || title.includes('買い物')) {
      return bentoColors.fruit;
    } else if (title.includes('home') || title.includes('家事') || title.includes('料理')) {
      return bentoColors.soup;
    } else {
      const key = keys[index % keys.length] as keyof typeof bentoColors;
      return bentoColors[key];
    }
  };

  const renderBentoLid = () => {
    const translateY = lidAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -height],
    });

    return (
      <Animated.View 
        style={[
          styles.bentoLid,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.lidContent}>
          <Text style={styles.lidText}>🍱</Text>
          <Text style={styles.lidTitle}>家族の一か月弁当</Text>
          <Text style={styles.lidSubtitle}>みんなの予定がぎっしり詰まっています</Text>
        </View>
      </Animated.View>
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
          <Text style={styles.headerTitle}>🍱 {monthNames[month - 1]}の予定弁当</Text>
          <Text style={styles.monthYear}>{year}年 {month}月</Text>
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

  const renderBentoCompartment = (dayInfo: any, index: number) => {
    if (!dayInfo.isCurrentMonth) {
      return (
        <View key={index} style={styles.emptyCompartment}>
          <View style={styles.emptyDivider} />
        </View>
      );
    }

    const dayEvents = getEventsForDay(dayInfo.day);
    const isSelected = selectedDate.getDate() === dayInfo.day;
    const isToday = new Date().getDate() === dayInfo.day;

    return (
      <Animated.View
        key={index}
        style={[
          styles.compartment,
          {
            transform: [
              {
                scale: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            opacity: animatedValues[index],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.compartmentButton,
            {
              backgroundColor: isSelected ? '#FFE4B5' : '#FFFEF7',
              borderColor: isToday ? '#FF6B6B' : '#DDD',
              borderWidth: isToday ? 3 : 1,
            },
          ]}
          onPress={() => {
            const [year, month] = currentMonth.split('-').map(Number);
            onDatePress(new Date(year, month - 1, dayInfo.day));
          }}
        >
          {/* 日期標籤 */}
          <View style={[
            styles.dayLabel,
            { backgroundColor: isToday ? '#FF6B6B' : '#F5F5F5' },
          ]}>
            <Text style={[
              styles.dayText,
              { color: isToday ? '#FFF' : '#333' },
            ]}>
              {dayInfo.day}
            </Text>
          </View>

          {/* 便當菜品 */}
          <View style={styles.dishesContainer}>
            {dayEvents.length === 0 && (
              <View style={styles.emptyDish}>
                <Text style={styles.emptyDishText}>🍚</Text>
                <Text style={styles.emptyDishLabel}>空き</Text>
              </View>
            )}

            {dayEvents.slice(0, 4).map((event, eventIndex) => {
              const dish = categorizeEventAsDish(event, eventIndex);
              const dishPositions = [
                { top: 25, left: 8, width: 30, height: 20 }, // 主菜位置
                { top: 25, right: 8, width: 25, height: 15 }, // 副菜位置
                { bottom: 8, left: 8, width: 20, height: 15 }, // 小菜位置
                { bottom: 8, right: 8, width: 20, height: 15 }, // 小菜位置
              ];
              const position = dishPositions[eventIndex] || dishPositions[0];

              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.dish,
                    {
                      backgroundColor: dish.bg,
                      borderColor: dish.border,
                      ...position,
                    },
                  ]}
                  onPress={() => onEventPress(event)}
                >
                  <Text style={styles.dishEmoji}>{dish.emoji}</Text>
                  <Text style={styles.dishText} numberOfLines={1}>
                    {event.title.length > 4 ? 
                      event.title.substring(0, 4) + '...' : 
                      event.title
                    }
                  </Text>
                </TouchableOpacity>
              );
            })}

            {dayEvents.length > 4 && (
              <View style={styles.moreDishes}>
                <Text style={styles.moreDishesText}>
                  +{dayEvents.length - 4}品
                </Text>
              </View>
            )}
          </View>

          {/* 便當分隔線 */}
          <View style={styles.divider} />
          <View style={styles.dividerVertical} />
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
            <Text style={[
              styles.weekDayText,
              {
                color: index === 0 || index === 6 ? '#FF6B6B' : '#666',
              },
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLegend = () => {
    return (
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>🍱 お弁当の中身</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.legendContainer}>
            {Object.entries(bentoColors).map(([key, dish]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[
                  styles.legendDish,
                  { backgroundColor: dish.bg, borderColor: dish.border },
                ]}>
                  <Text style={styles.legendEmoji}>{dish.emoji}</Text>
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
      {/* 便當盒背景 */}
      <View style={styles.bentoBoxBackground} />
      
      {renderBentoLid()}
      
      <ScrollView style={styles.content}>
        {renderHeader()}
        {renderWeekDays()}

        {/* 便當格子網格 */}
        <View style={styles.bentoGrid}>
          {days.map((dayInfo, index) => renderBentoCompartment(dayInfo, index))}
        </View>

        {renderLegend()}

        {/* 便當底部裝飾 */}
        <View style={styles.bentoBottom}>
          <Text style={styles.bentoBottomText}>
            🥢 いただきます！今月もお疲れ様でした 🥢
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4E6',
  },
  bentoBoxBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8B4513',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#654321',
  },
  bentoLid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    backgroundColor: '#654321',
    borderRadius: 12,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lidContent: {
    alignItems: 'center',
  },
  lidText: {
    fontSize: 80,
    marginBottom: 20,
  },
  lidTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  lidSubtitle: {
    fontSize: 14,
    color: '#DDD',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    backgroundColor: '#FFFEF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#DDD',
    backgroundColor: '#FFF8DC',
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
    color: '#8B4513',
    marginBottom: 4,
  },
  monthYear: {
    fontSize: 14,
    color: '#666',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF8DC',
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyCompartment: {
    width: (width - 24) / 7,
    height: 80,
    margin: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#DDD',
  },
  compartment: {
    width: (width - 24) / 7,
    height: 80,
    margin: 1,
  },
  compartmentButton: {
    flex: 1,
    borderRadius: 6,
    position: 'relative',
    padding: 4,
  },
  dayLabel: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    height: 18,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dishesContainer: {
    flex: 1,
    position: 'relative',
    marginTop: 20,
  },
  emptyDish: {
    position: 'absolute',
    top: 10,
    left: 8,
    right: 8,
    bottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyDishText: {
    fontSize: 12,
    opacity: 0.5,
  },
  emptyDishLabel: {
    fontSize: 6,
    color: '#999',
  },
  dish: {
    position: 'absolute',
    borderRadius: 3,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishEmoji: {
    fontSize: 8,
  },
  dishText: {
    fontSize: 6,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
  moreDishes: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFE4B5',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  moreDishesText: {
    fontSize: 6,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  divider: {
    position: 'absolute',
    top: 45,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerVertical: {
    position: 'absolute',
    top: 25,
    bottom: 8,
    left: '50%',
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  legend: {
    margin: 12,
    padding: 12,
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
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
  legendDish: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendEmoji: {
    fontSize: 12,
  },
  legendText: {
    fontSize: 8,
    color: '#666',
    fontWeight: '500',
  },
  bentoBottom: {
    margin: 12,
    padding: 16,
    backgroundColor: '#FFF0F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  bentoBottomText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
    textAlign: 'center',
  },
}); 