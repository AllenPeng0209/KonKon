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

interface BubbleChartViewProps {
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

const BubbleChartView: React.FC<BubbleChartViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const floatAnimations = useRef<Map<string, Animated.Value>>(new Map());

  // 氣泡顏色配置
  const bubbleColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // 根據重要性確定氣泡大小
  const getBubbleSize = (importance: string = 'medium') => {
    switch (importance) {
      case 'high': return 60;
      case 'medium': return 45;
      case 'low': return 30;
      default: return 45;
    }
  };

  // 獲取氣泡顏色
  const getBubbleColor = (event: Event) => {
    if (event.color) return event.color;
    const colorIndex = event.category ? event.category.length % bubbleColors.length : 0;
    return bubbleColors[colorIndex];
  };

  // 初始化動畫
  useEffect(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    daysInMonth.forEach((day: Date) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      dayEvents.forEach((event) => {
        if (!animationValues.current.has(event.id)) {
          animationValues.current.set(event.id, new Animated.Value(0));
          floatAnimations.current.set(event.id, new Animated.Value(0));
        }
      });
    });

    // 啟動氣泡出現動畫
    const animations = Array.from(animationValues.current.values()).map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      })
    );

    // 啟動浮動動畫
    const floatAnimationList = Array.from(floatAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel([...animations, ...floatAnimationList]).start();
  }, [selectedDate, events]);

  // 生成隨機位置的氣泡布局
  const generateBubbleLayout = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const bubbles: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      
      dayEvents.forEach((event, eventIndex) => {
        const size = getBubbleSize(event.importance);
        const color = getBubbleColor(event);
        
        // 計算氣泡位置（基於日期和事件索引）
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = (col * (screenWidth - 40) / 7) + 20;
        const baseY = row * 100 + 100;
        
        // 添加隨機偏移
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 40 + (eventIndex * 15);

        const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
        const floatValue = floatAnimations.current.get(event.id) || new Animated.Value(0);

        const translateY = floatValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        });

        bubbles.push(
          <Animated.View
            key={event.id}
            style={{
              position: 'absolute',
              left: baseX + offsetX - size / 2,
              top: baseY + offsetY,
              transform: [
                { scale: animValue },
                { translateY }
              ],
            }}
          >
            <TouchableOpacity
              onPress={() => onEventPress(event)}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontSize: size > 40 ? 12 : 8,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
                numberOfLines={size > 40 ? 2 : 1}
              >
                {event.title.length > 8 ? `${event.title.substring(0, 8)}...` : event.title}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      });
    });

    return bubbles;
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
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
      }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
        >
          <Text style={{ fontSize: 24, color: '#007AFF' }}>‹</Text>
        </TouchableOpacity>
        
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>
          💫 {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: '#007AFF' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 圖例 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 10,
        gap: 15
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#FF6B6B',
            marginRight: 5
          }} />
          <Text style={{ fontSize: 12, color: '#666' }}>高優先級</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 15,
            height: 15,
            borderRadius: 7.5,
            backgroundColor: '#4ECDC4',
            marginRight: 5
          }} />
          <Text style={{ fontSize: 12, color: '#666' }}>中優先級</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#96CEB4',
            marginRight: 5
          }} />
          <Text style={{ fontSize: 12, color: '#666' }}>低優先級</Text>
        </View>
      </View>

      {/* 氣泡圖區域 */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          height: 600, 
          position: 'relative',
          backgroundColor: '#F8F9FA',
          borderRadius: 10,
          margin: 10
        }}>
          {generateBubbleLayout()}
          
          {/* 背景網格線 */}
          {Array.from({ length: 6 }, (_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 100 + i * 100,
                height: 1,
                backgroundColor: '#E0E0E0',
                opacity: 0.3,
              }}
            />
          ))}
          
          {Array.from({ length: 7 }, (_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 20 + i * (screenWidth - 40) / 7,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: '#E0E0E0',
                opacity: 0.3,
              }}
            />
          ))}
        </View>

        {/* 統計信息 */}
        <View style={{
          margin: 10,
          padding: 15,
          backgroundColor: 'white',
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}>
          <ThemedText style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            📊 本月統計
          </ThemedText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF6B6B' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'high'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>高優先級</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4ECDC4' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'medium'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>中優先級</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#96CEB4' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'low'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>低優先級</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default BubbleChartView; 