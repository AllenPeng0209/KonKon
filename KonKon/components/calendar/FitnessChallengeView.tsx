import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';

interface Event {
  id: string;
  title: string;
  date: Date;
  importance?: 'low' | 'medium' | 'high';
  category?: string;
  color?: string;
}

interface FitnessChallengeViewProps {
  events: Event[];
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onEventPress: (event: Event) => void;
}

const { width: screenWidth } = Dimensions.get('window');

// 原生Date工具函數
const formatYearMonth = (date: Date): string => {
  return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月`;
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const eachDayOfInterval = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const FitnessChallengeView: React.FC<FitnessChallengeViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const progressAnimations = useRef<Map<string, Animated.Value>>(new Map());

  // 健身挑戰配置
  const challengeConfig = {
    high: { 
      emoji: '🏋️‍♂️', 
      color: '#E74C3C', 
      level: '困難',
      intensity: 'HARD',
      progress: 100
    },
    medium: { 
      emoji: '🤸‍♀️', 
      color: '#F39C12', 
      level: '中等',
      intensity: 'MEDIUM',
      progress: 70
    },
    low: { 
      emoji: '🧘‍♀️', 
      color: '#27AE60', 
      level: '簡單',
      intensity: 'EASY',
      progress: 40
    }
  };

  // 健身器材圖標
  const equipmentIcons = {
    'work': '💻',
    'personal': '🏃‍♂️',
    'meeting': '🤝',
    'reminder': '⏰',
    'celebration': '🏆',
    'health': '💪',
    'education': '📚',
    'travel': '🎒'
  };

  // 獲取挑戰配置
  const getChallengeConfig = (importance: string = 'medium') => {
    return challengeConfig[importance as keyof typeof challengeConfig] || challengeConfig.medium;
  };

  // 獲取器材圖標
  const getEquipmentIcon = (event: Event) => {
    const category = event.category?.toLowerCase() || 'personal';
    return equipmentIcons[category as keyof typeof equipmentIcons] || '🏃‍♂️';
  };

  // 動畫初始化
  useEffect(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    daysInMonth.forEach((day: Date) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      dayEvents.forEach((event) => {
        if (!animationValues.current.has(event.id)) {
          animationValues.current.set(event.id, new Animated.Value(0));
          progressAnimations.current.set(event.id, new Animated.Value(0));
        }
      });
    });

    // 挑戰出現動畫
    const animations = Array.from(animationValues.current.values()).map((value, index) =>
      Animated.spring(value, {
        toValue: 1,
        delay: index * 100,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    );

    // 進度條動畫
    const progressAnimationList = Array.from(progressAnimations.current.values()).map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );

    Animated.parallel([...animations, ...progressAnimationList]).start();
  }, [selectedDate, events]);

  // 生成健身房背景
  const generateGymBackground = () => {
    const background: React.ReactElement[] = [];
    
    // 健身房地板
    background.push(
      <View
        key="gym-floor"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: '#2C3E50',
        }}
      />
    );

    // 健身器材裝飾
    const gymEquipment = ['🏋️', '🤸', '🧘', '🚴', '🏃'];
    for (let i = 0; i < 10; i++) {
      background.push(
        <View
          key={`equipment-${i}`}
          style={{
            position: 'absolute',
            left: 30 + Math.random() * (screenWidth - 80),
            top: 20 + Math.random() * 30,
            opacity: 0.2,
          }}
        >
          <Text style={{ fontSize: 20, color: '#ECF0F1' }}>
            {gymEquipment[Math.floor(Math.random() * gymEquipment.length)]}
          </Text>
        </View>
      );
    }

    return background;
  };

  // 生成健身挑戰
  const generateChallenges = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const challenges: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      
      if (dayEvents.length > 0) {
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = (col * (screenWidth - 40) / 7) + 20;
        const baseY = 70 + row * 110;

        dayEvents.forEach((event, eventIndex) => {
          const challengeConf = getChallengeConfig(event.importance);
          const equipment = getEquipmentIcon(event);
          
          const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
          const progressValue = progressAnimations.current.get(event.id) || new Animated.Value(0);

          const scale = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const progressWidth = progressValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, challengeConf.progress],
          });

          challenges.push(
            <Animated.View
              key={event.id}
              style={{
                position: 'absolute',
                left: baseX - 30,
                top: baseY + eventIndex * 35,
                transform: [{ scale }],
              }}
            >
              <TouchableOpacity
                onPress={() => onEventPress(event)}
                style={{
                  backgroundColor: '#34495E',
                  borderRadius: 15,
                  padding: 10,
                  borderWidth: 2,
                  borderColor: challengeConf.color,
                  shadowColor: challengeConf.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 4,
                  elevation: 6,
                  minWidth: 70,
                  alignItems: 'center',
                }}
              >
                {/* 健身動作 */}
                <Text style={{ fontSize: 18, marginBottom: 3 }}>
                  {challengeConf.emoji}
                </Text>
                
                {/* 器材圖標 */}
                <Text style={{ fontSize: 10, marginBottom: 3 }}>
                  {equipment}
                </Text>
                
                {/* 難度標籤 */}
                <View style={{
                  backgroundColor: challengeConf.color,
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginBottom: 5,
                }}>
                  <Text style={{ 
                    fontSize: 7, 
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {challengeConf.level}
                  </Text>
                </View>

                {/* 進度條背景 */}
                <View style={{
                  width: 50,
                  height: 6,
                  backgroundColor: '#2C3E50',
                  borderRadius: 3,
                  marginBottom: 3,
                }}>
                  {/* 進度條 */}
                  <Animated.View
                    style={{
                      height: '100%',
                      backgroundColor: challengeConf.color,
                      borderRadius: 3,
                      width: progressWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    }}
                  />
                </View>

                {/* 事件標題 */}
                <Text style={{ 
                  fontSize: 7, 
                  color: '#ECF0F1',
                  textAlign: 'center',
                  maxWidth: 50,
                  lineHeight: 9
                }} numberOfLines={2}>
                  {event.title}
                </Text>
                
                {/* 日期 */}
                <View style={{
                  backgroundColor: challengeConf.color,
                  borderRadius: 6,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  marginTop: 3,
                }}>
                  <Text style={{ 
                    fontSize: 7, 
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {day.getDate()}日
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 強度指示器 */}
              <View
                style={{
                  position: 'absolute',
                  right: -5,
                  top: -5,
                  backgroundColor: challengeConf.color,
                  borderRadius: 8,
                  paddingHorizontal: 3,
                  paddingVertical: 1,
                }}
              >
                <Text style={{
                  fontSize: 6,
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {challengeConf.intensity}
                </Text>
              </View>
            </Animated.View>
          );
        });
      }
    });

    return challenges;
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* 標題區域 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#E74C3C',
        borderBottomWidth: 1,
        borderBottomColor: '#C0392B'
      }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
        >
          <Text style={{ fontSize: 24, color: 'white' }}>‹</Text>
        </TouchableOpacity>
        
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
          💪 健身挑戰 - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: 'white' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 難度圖例 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 12,
        backgroundColor: '#FADBD8',
        gap: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 5 }}>🏋️‍♂️</Text>
          <Text style={{ fontSize: 12, color: '#E74C3C' }}>困難挑戰</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 5 }}>🤸‍♀️</Text>
          <Text style={{ fontSize: 12, color: '#E74C3C' }}>中等訓練</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 5 }}>🧘‍♀️</Text>
          <Text style={{ fontSize: 12, color: '#E74C3C' }}>輕鬆運動</Text>
        </View>
      </View>

      {/* 健身房區域 */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          minHeight: 700, 
          position: 'relative',
          paddingBottom: 50
        }}>
          {/* 健身房背景 */}
          {generateGymBackground()}
          
          {/* 週標題 */}
          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 20,
            paddingVertical: 8,
            marginTop: 20,
            backgroundColor: '#E74C3C'
          }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <View key={index} style={{ 
                flex: 1, 
                alignItems: 'center',
                paddingVertical: 3
              }}>
                <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 12 }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          {/* 健身挑戰 */}
          {generateChallenges()}
        </View>

        {/* 健身統計卡片 */}
        <View style={{
          margin: 15,
          padding: 20,
          backgroundColor: 'white',
          borderRadius: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderLeftWidth: 5,
          borderLeftColor: '#E74C3C',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>
              🏆
            </Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>
              本月健身成就
            </ThemedText>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#E74C3C' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'high'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>困難挑戰</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F39C12' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'medium'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>中等訓練</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#27AE60' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'low'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>輕鬆運動</Text>
            </View>
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              本月您完成了 {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length} 個健身挑戰！
              堅持就是勝利，加油！💪🔥
            </Text>
          </View>

          {/* 健身建議 */}
          <View style={{ 
            marginTop: 15, 
            backgroundColor: '#FADBD8', 
            borderRadius: 10,
            padding: 12
          }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#E74C3C', marginBottom: 5 }}>
              💡 健身小貼士
            </Text>
            <Text style={{ fontSize: 11, color: '#666', lineHeight: 16 }}>
              每天堅持運動30分鐘，循序漸進增加強度。記住要適當休息，
              保證充足睡眠和合理飲食。健康的身體是最好的投資！
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default FitnessChallengeView; 