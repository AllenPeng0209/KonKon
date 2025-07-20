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

interface AIPredictionViewProps {
  events: Event[];
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onEventPress: (event: Event) => void;
}

const { width: screenWidth } = Dimensions.get('window');

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

const AIPredictionView: React.FC<AIPredictionViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const scanAnimations = useRef<Map<string, Animated.Value>>(new Map());

  const predictionConfig = {
    high: { 
      probability: 95,
      color: '#00FF41',
      status: '高信度',
      aiIcon: '🤖'
    },
    medium: { 
      probability: 75,
      color: '#FFD700',
      status: '中信度',
      aiIcon: '🔮'
    },
    low: { 
      probability: 45,
      color: '#FF6B6B',
      status: '低信度',
      aiIcon: '🎲'
    }
  };

  const getPredictionConfig = (importance: string = 'medium') => {
    return predictionConfig[importance as keyof typeof predictionConfig] || predictionConfig.medium;
  };

  useEffect(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    daysInMonth.forEach((day: Date) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      dayEvents.forEach((event) => {
        if (!animationValues.current.has(event.id)) {
          animationValues.current.set(event.id, new Animated.Value(0));
          scanAnimations.current.set(event.id, new Animated.Value(0));
        }
      });
    });

    const animations = Array.from(animationValues.current.values()).map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        delay: index * 100,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    const scanAnimationList = Array.from(scanAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel([...animations, ...scanAnimationList]).start();
  }, [selectedDate, events]);

  const generateAIPredictions = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const predictions: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      
      if (dayEvents.length > 0) {
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = (col * (screenWidth - 40) / 7) + 20;
        const baseY = 80 + row * 120;

        dayEvents.forEach((event, eventIndex) => {
          const config = getPredictionConfig(event.importance);
          
          const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
          const scanValue = scanAnimations.current.get(event.id) || new Animated.Value(0);

          const opacity = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const scanTranslateX = scanValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 20],
          });

          predictions.push(
            <Animated.View
              key={event.id}
              style={{
                position: 'absolute',
                left: baseX - 35,
                top: baseY + eventIndex * 40,
                opacity,
              }}
            >
              <TouchableOpacity
                onPress={() => onEventPress(event)}
                style={{
                  backgroundColor: '#000011',
                  borderRadius: 12,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: config.color,
                  shadowColor: config.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  elevation: 8,
                  minWidth: 70,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* 掃描線效果 */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    backgroundColor: config.color,
                    opacity: 0.8,
                    transform: [{ translateX: scanTranslateX }],
                  }}
                />

                {/* AI圖標 */}
                <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 2 }}>
                  {config.aiIcon}
                </Text>

                {/* 預測概率 */}
                <View style={{
                  backgroundColor: config.color + '20',
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  marginBottom: 3,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: 8,
                    color: config.color,
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                  }}>
                    {config.probability}%
                  </Text>
                </View>

                {/* 狀態指示 */}
                <Text style={{
                  fontSize: 6,
                  color: config.color,
                  textAlign: 'center',
                  marginBottom: 3,
                  fontFamily: 'monospace',
                }}>
                  {config.status}
                </Text>

                {/* 事件標題 */}
                <Text style={{
                  fontSize: 7,
                  color: '#00FF41',
                  textAlign: 'center',
                  maxWidth: 60,
                  lineHeight: 9,
                  fontFamily: 'monospace',
                }} numberOfLines={2}>
                  {event.title}
                </Text>

                {/* 日期 */}
                <View style={{
                  backgroundColor: config.color,
                  borderRadius: 4,
                  paddingHorizontal: 3,
                  paddingVertical: 1,
                  marginTop: 3,
                  alignSelf: 'center',
                }}>
                  <Text style={{
                    fontSize: 6,
                    color: 'black',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                  }}>
                    {day.getDate().toString().padStart(2, '0')}
                  </Text>
                </View>

                {/* 數據流效果 */}
                <View style={{
                  position: 'absolute',
                  right: 2,
                  top: 2,
                  flexDirection: 'column',
                  gap: 1,
                }}>
                  {[1, 2, 3].map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: 3,
                        height: 1,
                        backgroundColor: config.color,
                        opacity: 0.5 + Math.random() * 0.5,
                      }}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        });
      }
    });

    return predictions;
  };

  const generateMatrixBackground = () => {
    const chars = ['0', '1', '｜', '－', '▲', '▼', '◆', '●'];
    const background: React.ReactElement[] = [];

    for (let i = 0; i < 50; i++) {
      background.push(
        <Text
          key={i}
          style={{
            position: 'absolute',
            left: Math.random() * screenWidth,
            top: Math.random() * 600,
            fontSize: 12,
            color: '#00FF41',
            opacity: 0.1 + Math.random() * 0.2,
            fontFamily: 'monospace',
          }}
        >
          {chars[Math.floor(Math.random() * chars.length)]}
        </Text>
      );
    }

    return background;
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#000011',
        borderBottomWidth: 1,
        borderBottomColor: '#00FF41'
      }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
        >
          <Text style={{ fontSize: 24, color: '#00FF41' }}>‹</Text>
        </TouchableOpacity>
        
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#00FF41', fontFamily: 'monospace' }}>
          🤖 AI預測系統 - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: '#00FF41' }}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 12,
        backgroundColor: '#001100',
        gap: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#00FF41', marginRight: 5 }}>🤖</Text>
          <Text style={{ fontSize: 12, color: '#00FF41', fontFamily: 'monospace' }}>95% 高信度</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#FFD700', marginRight: 5 }}>🔮</Text>
          <Text style={{ fontSize: 12, color: '#FFD700', fontFamily: 'monospace' }}>75% 中信度</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#FF6B6B', marginRight: 5 }}>🎲</Text>
          <Text style={{ fontSize: 12, color: '#FF6B6B', fontFamily: 'monospace' }}>45% 低信度</Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: '#000' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          minHeight: 700, 
          position: 'relative',
          paddingBottom: 50
        }}>
          {/* 矩陣背景 */}
          {generateMatrixBackground()}

          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 20,
            paddingVertical: 8,
            marginTop: 20,
            backgroundColor: '#001100'
          }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <View key={index} style={{ 
                flex: 1, 
                alignItems: 'center',
                paddingVertical: 3
              }}>
                <Text style={{ fontWeight: 'bold', color: '#00FF41', fontSize: 12, fontFamily: 'monospace' }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          {generateAIPredictions()}
        </View>

        <View style={{
          margin: 15,
          padding: 20,
          backgroundColor: '#000011',
          borderRadius: 15,
          borderWidth: 1,
          borderColor: '#00FF41',
          shadowColor: '#00FF41',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>📊</Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#00FF41', fontFamily: 'monospace' }}>
              AI分析報告
            </ThemedText>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#00FF41', fontFamily: 'monospace' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'high'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#00FF41', fontFamily: 'monospace' }}>高信度預測</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700', fontFamily: 'monospace' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'medium'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#FFD700', fontFamily: 'monospace' }}>中信度預測</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FF6B6B', fontFamily: 'monospace' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'low'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#FF6B6B', fontFamily: 'monospace' }}>低信度預測</Text>
            </View>
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#00FF41', textAlign: 'center', fontFamily: 'monospace' }}>
              AI系統分析了 {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length} 個數據點
              預測準確率：{Math.floor(Math.random() * 20 + 80)}% 🤖
            </Text>
          </View>

          <View style={{ 
            marginTop: 15, 
            backgroundColor: '#001100', 
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: '#00FF41'
          }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00FF41', marginBottom: 5, fontFamily: 'monospace' }}>
              🚀 AI建議
            </Text>
            <Text style={{ fontSize: 11, color: '#00FF41', lineHeight: 16, fontFamily: 'monospace' }}>
              根據數據分析，建議優先關注高信度預測事件。
              保持靈活性以應對低信度預測的不確定性。
              AI學習中...正在優化預測算法。
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default AIPredictionView; 