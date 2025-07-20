import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

interface Event {
  id: string;
  title: string;
  date: Date;
  importance?: 'low' | 'medium' | 'high';
  category?: string;
  color?: string;
}

interface SeasonalLandscapeViewProps {
  events: Event[];
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onEventPress: (event: Event) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

const SeasonalLandscapeView: React.FC<SeasonalLandscapeViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const swayAnimations = useRef<Map<string, Animated.Value>>(new Map());

  // 獲取季節信息
  const getSeason = (date: Date) => {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  };

  // 季節配置
  const seasonConfig = {
    spring: {
      background: '#E8F5E8',
      sky: '#87CEEB',
      ground: '#90EE90',
      emoji: '🌸',
      title: '春日花園',
      elements: ['🌱', '🌷', '🦋', '🐛', '☀️'],
      colors: ['#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C']
    },
    summer: {
      background: '#FFF8DC',
      sky: '#00BFFF',
      ground: '#32CD32',
      emoji: '☀️',
      title: '夏日海灘',
      elements: ['🌞', '🏖️', '🌊', '🦀', '🏄‍♀️'],
      colors: ['#FFD700', '#00CED1', '#FF6347', '#32CD32', '#FF69B4']
    },
    autumn: {
      background: '#FDF5E6',
      sky: '#DEB887',
      ground: '#D2691E',
      emoji: '🍂',
      title: '秋日森林',
      elements: ['🍂', '🍄', '🦔', '🌰', '🕷️'],
      colors: ['#FF8C00', '#B22222', '#CD853F', '#DAA520', '#A0522D']
    },
    winter: {
      background: '#F0F8FF',
      sky: '#B0C4DE',
      ground: '#FFFAFA',
      emoji: '❄️',
      title: '冬日雪景',
      elements: ['❄️', '⛄', '🏔️', '🧊', '🦉'],
      colors: ['#87CEEB', '#4682B4', '#DCDCDC', '#B0E0E6', '#F0F8FF']
    }
  };

  const currentSeason = getSeason(selectedDate);
  const config = seasonConfig[currentSeason];

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
          swayAnimations.current.set(event.id, new Animated.Value(0));
        }
      });
    });

    // 啟動出現動畫
    const animations = Array.from(animationValues.current.values()).map((value) =>
      Animated.spring(value, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    );

    // 啟動搖擺動畫
    const swayAnimationList = Array.from(swayAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 3000 + Math.random() * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: -1,
            duration: 3000 + Math.random() * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel([...animations, ...swayAnimationList]).start();
  }, [selectedDate, events]);

  // 生成風景元素
  const generateLandscapeElements = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const elements: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      
      if (dayEvents.length > 0) {
        // 計算位置
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = (col * (screenWidth - 40) / 7) + 20;
        const baseY = 150 + row * 80;

        dayEvents.forEach((event, eventIndex) => {
          const elementEmoji = config.elements[eventIndex % config.elements.length];
          const elementColor = config.colors[eventIndex % config.colors.length];
          
          const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
          const swayValue = swayAnimations.current.get(event.id) || new Animated.Value(0);

          const rotateZ = swayValue.interpolate({
            inputRange: [-1, 1],
            outputRange: ['-5deg', '5deg'],
          });

          const scale = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          elements.push(
            <Animated.View
              key={event.id}
              style={{
                position: 'absolute',
                left: baseX - 20,
                top: baseY + eventIndex * 25,
                transform: [
                  { scale },
                  { rotateZ }
                ],
              }}
            >
              <TouchableOpacity
                onPress={() => onEventPress(event)}
                style={{
                  backgroundColor: elementColor + '20',
                  borderRadius: 15,
                  padding: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: elementColor,
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 5 }}>
                  {elementEmoji}
                </Text>
                <Text style={{ 
                  color: elementColor, 
                  fontSize: 12, 
                  fontWeight: 'bold',
                  maxWidth: 60
                }} numberOfLines={1}>
                  {event.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        });
      }

      // 添加裝飾性背景元素
      if (dayIndex % 3 === 0) {
        const decorEmoji = config.elements[Math.floor(Math.random() * config.elements.length)];
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = (col * (screenWidth - 40) / 7) + 20;
        const baseY = 120 + row * 80;

        elements.push(
          <View
            key={`decor-${dayIndex}`}
            style={{
              position: 'absolute',
              left: baseX + Math.random() * 30 - 15,
              top: baseY + Math.random() * 20,
              opacity: 0.3,
            }}
          >
            <Text style={{ fontSize: 14 }}>
              {decorEmoji}
            </Text>
          </View>
        );
      }
    });

    return elements;
  };

  // 生成天空效果
  const generateSkyEffects = () => {
    const effects: React.ReactElement[] = [];
    
    for (let i = 0; i < 8; i++) {
      const emoji = currentSeason === 'winter' ? '❄️' : 
                   currentSeason === 'autumn' ? '🍂' : 
                   currentSeason === 'spring' ? '🌸' : '☁️';
      
      effects.push(
        <Animated.View
          key={`sky-${i}`}
          style={{
            position: 'absolute',
            left: Math.random() * screenWidth,
            top: 60 + Math.random() * 40,
            transform: [{
              translateX: swayAnimations.current.get('sky') ? 
                swayAnimations.current.get('sky')!.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-20, 20]
                }) : 0
            }]
          }}
        >
          <Text style={{ fontSize: 16, opacity: 0.6 }}>
            {emoji}
          </Text>
        </Animated.View>
      );
    }
    
    return effects;
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
        backgroundColor: config.sky,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
      }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
        >
          <Text style={{ fontSize: 24, color: 'white' }}>‹</Text>
        </TouchableOpacity>
        
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
          {config.emoji} {config.title} - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: 'white' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 風景區域 */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: config.background }}
        showsVerticalScrollIndicator={false}
      >
        {/* 天空層 */}
        <View style={{ 
          height: 100, 
          backgroundColor: config.sky,
          position: 'relative'
        }}>
          {generateSkyEffects()}
        </View>

        {/* 主要風景區域 */}
        <View style={{ 
          height: 500, 
          position: 'relative',
          backgroundColor: config.ground,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          marginTop: -10
        }}>
          {/* 週標題 */}
          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: config.ground + '80'
          }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', color: '#333' }}>{day}</Text>
              </View>
            ))}
          </View>

          {generateLandscapeElements()}
        </View>

        {/* 季節信息卡片 */}
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
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>
              {config.emoji}
            </Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>
              {config.title}特色
            </ThemedText>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {config.elements.map((element, index) => (
              <View 
                key={index}
                style={{
                  backgroundColor: config.colors[index] + '20',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, marginRight: 4 }}>
                  {element}
                </Text>
                <Text style={{ fontSize: 12, color: config.colors[index], fontWeight: 'bold' }}>
                  {currentSeason === 'spring' ? '春意' :
                   currentSeason === 'summer' ? '夏日' :
                   currentSeason === 'autumn' ? '秋韻' : '冬雪'}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              本月共有 {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length} 個事件
              在這個美麗的{config.title}中等待您的探索！
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default SeasonalLandscapeView; 