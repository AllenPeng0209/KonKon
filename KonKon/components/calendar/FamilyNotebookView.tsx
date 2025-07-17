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

// 家庭成員角色標識
const familyRoles = {
  work: { emoji: '💼', color: '#4A90E2', label: '仕事' },
  school: { emoji: '🎒', color: '#7ED321', label: '学校' },
  home: { emoji: '🏠', color: '#F5A623', label: '家事' },
  health: { emoji: '🏥', color: '#D0021B', label: '健康' },
  fun: { emoji: '🎉', color: '#9013FE', label: '楽しみ' },
  shopping: { emoji: '🛒', color: '#50E3C2', label: '買い物' },
};

export default function FamilyNotebookView({
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
  const [pageFlipAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // 頁面翻動效果
    Animated.timing(pageFlipAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 逐個顯示日期
    const staggered = animatedValues.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 30,
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
      const prevMonthDay = new Date(year, month - 2, 0).getDate() - startDayOfWeek + i + 1;
      days.push({ day: prevMonthDay, isCurrentMonth: false, isPrevMonth: true });
    }
    
    // 當前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true });
    }

    // 下個月的日期
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ day, isCurrentMonth: false, isNextMonth: true });
    }

    return days;
  };

  const getEventsForDay = (day: number, isCurrentMonth: boolean = true) => {
    let targetYear, targetMonth;
    
    if (isCurrentMonth) {
      [targetYear, targetMonth] = currentMonth.split('-').map(Number);
    } else {
      // 處理前月或後月
      const [year, month] = currentMonth.split('-').map(Number);
      if (day > 15) {
        // 前月
        targetYear = month === 1 ? year - 1 : year;
        targetMonth = month === 1 ? 12 : month - 1;
      } else {
        // 後月
        targetYear = month === 12 ? year + 1 : year;
        targetMonth = month === 12 ? 1 : month + 1;
      }
    }

    const dayStart = new Date(targetYear, targetMonth - 1, day).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

    return events.filter(event => 
      event.start_ts >= dayStart && event.start_ts <= dayEnd
    );
  };

  const categorizeEvent = (event: any) => {
    const title = event.title.toLowerCase();
    if (title.includes('work') || title.includes('仕事') || title.includes('会議')) {
      return familyRoles.work;
    } else if (title.includes('school') || title.includes('学校') || title.includes('宿題')) {
      return familyRoles.school;
    } else if (title.includes('doctor') || title.includes('病院') || title.includes('健康')) {
      return familyRoles.health;
    } else if (title.includes('shopping') || title.includes('買い物') || title.includes('市場')) {
      return familyRoles.shopping;
    } else if (title.includes('party') || title.includes('遊び') || title.includes('映画')) {
      return familyRoles.fun;
    } else {
      return familyRoles.home;
    }
  };

  const renderNotebookBackground = () => {
    return (
      <View style={styles.notebookBackground}>
        {/* 筆記本線條 */}
        {Array.from({ length: 20 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.notebookLine,
              { top: 120 + index * 32 },
            ]}
          />
        ))}
        {/* 左側打孔 */}
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`hole-${index}`}
            style={[
              styles.hole,
              { top: 80 + index * 80 },
            ]}
          />
        ))}
        {/* 邊距線 */}
        <View style={styles.marginLine} />
      </View>
    );
  };

  const renderHeader = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];

    return (
      <Animated.View 
        style={[
          styles.header,
          {
            transform: [
              {
                rotateY: pageFlipAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-15deg', '0deg'],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => onMonthChange?.(
              `${year}-${(month - 1).toString().padStart(2, '0')}`
            )}
            style={styles.navButton}
          >
            <Text style={styles.navText}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>家族の記録帳</Text>
            <Text style={styles.monthYear}>
              {year}年 {monthNames[month - 1]}
            </Text>
            <View style={styles.decorativeLine} />
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

        {/* 家庭成員圖例 */}
        <View style={styles.familyLegend}>
          <Text style={styles.legendTitle}>📖 記録の種類</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.legendContainer}>
              {Object.entries(familyRoles).map(([key, role]) => (
                <View key={key} style={styles.legendItem}>
                  <Text style={styles.legendEmoji}>{role.emoji}</Text>
                  <Text style={[styles.legendText, { color: role.color }]}>
                    {role.label}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    );
  };

  const renderDay = (dayInfo: any, index: number) => {
    const dayEvents = getEventsForDay(dayInfo.day, dayInfo.isCurrentMonth);
    const isSelected = selectedDate.getDate() === dayInfo.day && dayInfo.isCurrentMonth;
    const isToday = new Date().getDate() === dayInfo.day && dayInfo.isCurrentMonth;

    return (
      <Animated.View
        key={index}
        style={[
          styles.dayContainer,
          {
            opacity: animatedValues[index],
            transform: [
              {
                translateY: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dayButton,
            {
              backgroundColor: isSelected ? '#FFE4B5' : 'transparent',
              opacity: dayInfo.isCurrentMonth ? 1 : 0.3,
            },
          ]}
          onPress={() => {
            if (dayInfo.isCurrentMonth) {
              const [year, month] = currentMonth.split('-').map(Number);
              onDatePress(new Date(year, month - 1, dayInfo.day));
            }
          }}
        >
          {/* 日期數字 */}
          <Text style={[
            styles.dayText,
            {
              color: isToday ? '#D0021B' : '#333',
              fontWeight: isToday ? 'bold' : 'normal',
            },
          ]}>
            {dayInfo.day}
          </Text>

          {/* 手寫標記風格的事件 */}
          {dayEvents.length > 0 && (
            <View style={styles.eventsContainer}>
              {dayEvents.slice(0, 3).map((event, eventIndex) => {
                const category = categorizeEvent(event);
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventNote,
                      { backgroundColor: category.color + '20' },
                    ]}
                    onPress={() => onEventPress(event)}
                  >
                    <Text style={styles.eventEmoji}>{category.emoji}</Text>
                    <Text style={[
                      styles.eventText,
                      { color: category.color },
                    ]} numberOfLines={1}>
                      {event.title.length > 6 ? 
                        event.title.substring(0, 6) + '...' : 
                        event.title
                      }
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {dayEvents.length > 3 && (
                <View style={styles.moreEventsNote}>
                  <Text style={styles.moreEventsText}>
                    他{dayEvents.length - 3}件
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 手寫風格的裝飾 */}
          {isToday && (
            <View style={styles.todayDecoration}>
              <Text style={styles.todayMark}>今日</Text>
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
      {renderNotebookBackground()}
      
      <ScrollView style={styles.content}>
        {renderHeader()}

        {/* 星期標題 */}
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <View key={day} style={styles.weekDayContainer}>
              <Text style={[
                styles.weekDayText,
                {
                  color: index === 0 ? '#D0021B' : index === 6 ? '#4A90E2' : '#666',
                },
              ]}>
                {day}曜日
              </Text>
            </View>
          ))}
        </View>

        {/* 日期網格 */}
        <View style={styles.daysGrid}>
          {days.map((dayInfo, index) => renderDay(dayInfo, index))}
        </View>

        {/* 底部記事 */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>💝 今月の思い出</Text>
          <View style={styles.noteContent}>
            <Text style={styles.noteText}>
              家族みんなで過ごす大切な時間を記録しています。
            </Text>
            <Text style={styles.noteText}>
              小さな日々の出来事も、後で振り返ると
            </Text>
            <Text style={styles.noteText}>
              かけがえのない思い出になります ♡
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF7',
  },
  notebookBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  notebookLine: {
    position: 'absolute',
    left: 40,
    right: 20,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  hole: {
    position: 'absolute',
    left: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  marginLine: {
    position: 'absolute',
    left: 35,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#FFB6C1',
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  navText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  monthYear: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  decorativeLine: {
    width: 80,
    height: 2,
    backgroundColor: '#FFB6C1',
    borderRadius: 1,
  },
  familyLegend: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  legendItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dayContainer: {
    width: (width - 80) / 7,
    height: 85,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.3)',
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  eventsContainer: {
    flex: 1,
  },
  eventNote: {
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 2,
    borderLeftColor: '#FFB6C1',
  },
  eventEmoji: {
    fontSize: 8,
    marginRight: 2,
  },
  eventText: {
    fontSize: 8,
    fontWeight: '500',
    flex: 1,
  },
  moreEventsNote: {
    alignItems: 'center',
    marginTop: 2,
  },
  moreEventsText: {
    fontSize: 7,
    color: '#999',
    fontStyle: 'italic',
  },
  todayDecoration: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#D0021B',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  todayMark: {
    fontSize: 6,
    color: '#FFF',
    fontWeight: 'bold',
  },
  noteSection: {
    margin: 40,
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 240, 245, 0.8)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB6C1',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  noteContent: {
    paddingHorizontal: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
    fontStyle: 'italic',
  },
}); 