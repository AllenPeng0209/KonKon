import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

interface Event {
  id: string;
  title: string;
  start_ts: number;
  end_ts?: number;
  importance?: 'low' | 'medium' | 'high';
  category?: string;
  color?: string;
}

// Helper function to convert timestamp to Date
const timestampToDate = (timestamp: number): Date => {
  const date = new Date(timestamp * 1000);
  return isNaN(date.getTime()) ? new Date() : date;
};

interface ARViewProps {
  events: Event[];
  selectedDate: Date;
  onDatePress: (date: Date) => void;
  onEventPress: (event: Event) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const formatYearMonth = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return `${new Date().getFullYear()}年${(new Date().getMonth() + 1).toString().padStart(2, '0')}月`;
  }
  return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月`;
};

const startOfMonth = (date: Date): Date => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date): Date => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
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
  if (!date1 || !date2 || !(date1 instanceof Date) || !(date2 instanceof Date) ||
      isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return false;
  }
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const ARView: React.FC<ARViewProps> = ({
  events,
  selectedDate: initialSelectedDate,
  onDatePress,
  onEventPress,
}) => {
  // 確保 initialSelectedDate 是有效的日期，否則使用當前日期作為備用
  const validInitialDate = initialSelectedDate && initialSelectedDate instanceof Date && !isNaN(initialSelectedDate.getTime()) 
    ? initialSelectedDate 
    : new Date();
  
  const [selectedDate, setSelectedDate] = useState<Date>(validInitialDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const hologramAnimations = useRef<Map<string, Animated.Value>>(new Map());
  const glitchAnimations = useRef<Map<string, Animated.Value>>(new Map());

  const arConfig = {
    high: { 
      color: '#00FFFF',
      hologramColor: '#00FFFF80',
      size: 60,
      intensity: 'HIGH',
      arIcon: '🔷'
    },
    medium: { 
      color: '#FF00FF',
      hologramColor: '#FF00FF80',
      size: 45,
      intensity: 'MED',
      arIcon: '🔸'
    },
    low: { 
      color: '#00FF00',
      hologramColor: '#00FF0080',
      size: 35,
      intensity: 'LOW',
      arIcon: '🔹'
    }
  };

  const getARConfig = (importance: string = 'medium') => {
    return arConfig[importance as keyof typeof arConfig] || arConfig.medium;
  };

  useEffect(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    daysInMonth.forEach((day: Date) => {
      const dayEvents = events.filter(event => isSameDay(timestampToDate(event.start_ts), day));
      dayEvents.forEach((event) => {
        if (!animationValues.current.has(event.id)) {
          animationValues.current.set(event.id, new Animated.Value(0));
          hologramAnimations.current.set(event.id, new Animated.Value(0));
          glitchAnimations.current.set(event.id, new Animated.Value(1));
        }
      });
    });

    const animations = Array.from(animationValues.current.values()).map((value, index) =>
      Animated.spring(value, {
        toValue: 1,
        delay: index * 80,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      })
    );

    const hologramAnimationList = Array.from(hologramAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 1500 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 1500 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    const glitchAnimationList = Array.from(glitchAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(Math.random() * 5000),
          Animated.timing(value, {
            toValue: 0.8,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 1.2,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 1,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel([...animations, ...hologramAnimationList, ...glitchAnimationList]).start();
  }, [selectedDate, events]);

  const generateARHolograms = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const holograms: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(timestampToDate(event.start_ts), day));
      
      if (dayEvents.length > 0) {
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = (col * (screenWidth - 50) / 7) + 25;
        const baseY = 80 + row * 130;

        dayEvents.forEach((event, eventIndex) => {
          const config = getARConfig(event.importance);
          
          const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
          const hologramValue = hologramAnimations.current.get(event.id) || new Animated.Value(0);
          const glitchValue = glitchAnimations.current.get(event.id) || new Animated.Value(1);

          const scale = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const hologramOpacity = hologramValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.9],
          });

          const hologramScale = hologramValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1],
          });

          holograms.push(
            <Animated.View
              key={event.id}
              style={{
                position: 'absolute',
                left: baseX - config.size / 2,
                top: baseY + eventIndex * 70,
                transform: [
                  { scale },
                  { scaleY: glitchValue }
                ],
              }}
            >
              {/* 全息投影底座 */}
              <View
                style={{
                  position: 'absolute',
                  bottom: -10,
                  left: -5,
                  right: -5,
                  height: 4,
                  backgroundColor: config.color,
                  borderRadius: 2,
                  opacity: 0.5,
                }}
              />

              {/* 全息投影光柱 */}
              <View
                style={{
                  position: 'absolute',
                  left: config.size / 2 - 1,
                  top: config.size,
                  width: 2,
                  height: 15,
                  backgroundColor: config.color,
                  opacity: 0.6,
                }}
              />

              <TouchableOpacity
                onPress={() => onEventPress(event)}
                style={{
                  width: config.size,
                  height: config.size,
                  position: 'relative',
                }}
              >
                {/* 主要全息體 */}
                <Animated.View
                  style={{
                    width: config.size,
                    height: config.size,
                    backgroundColor: config.hologramColor,
                    borderRadius: config.size / 2,
                    borderWidth: 2,
                    borderColor: config.color,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: hologramOpacity,
                    transform: [{ scale: hologramScale }],
                  }}
                >
                  {/* AR圖標 */}
                  <Text style={{ fontSize: 16, marginBottom: 2 }}>
                    {config.arIcon}
                  </Text>

                  {/* 事件標題 */}
                  <Text style={{
                    fontSize: config.size > 50 ? 8 : 6,
                    color: config.color,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    maxWidth: config.size - 10,
                    textShadowColor: config.color,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 3,
                  }} numberOfLines={2}>
                    {event.title}
                  </Text>
                </Animated.View>

                {/* 全息掃描線 */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: config.color,
                    opacity: hologramValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                    top: hologramValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, config.size - 2],
                    }),
                  }}
                />

                {/* AR標記框 */}
                <View style={{
                  position: 'absolute',
                  left: -8,
                  top: -8,
                  right: -8,
                  bottom: -8,
                  borderWidth: 1,
                  borderColor: config.color,
                  borderStyle: 'dashed',
                  opacity: 0.5,
                }}>
                  {/* 角落標記 */}
                  {[
                    { top: -2, left: -2 },
                    { top: -2, right: -2 },
                    { bottom: -2, left: -2 },
                    { bottom: -2, right: -2 },
                  ].map((position, i) => (
                    <View
                      key={i}
                      style={{
                        position: 'absolute',
                        width: 8,
                        height: 8,
                        borderWidth: 2,
                        borderColor: config.color,
                        ...position,
                      }}
                    />
                  ))}
                </View>

                {/* 強度指示器 */}
                <View
                  style={{
                    position: 'absolute',
                    top: -15,
                    right: -10,
                    backgroundColor: config.color,
                    borderRadius: 8,
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                  }}
                >
                  <Text style={{
                    fontSize: 6,
                    color: 'black',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                  }}>
                    {config.intensity}
                  </Text>
                </View>

                {/* 日期全息標籤 */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -20,
                    left: config.size / 2 - 8,
                    backgroundColor: config.color + '40',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: config.color,
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    minWidth: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 8,
                    color: config.color,
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                  }}>
                    {day.getDate()}
                  </Text>
                </View>

                {/* 光暈效果 */}
                <View
                  style={{
                    position: 'absolute',
                    left: -10,
                    top: -10,
                    right: -10,
                    bottom: -10,
                    backgroundColor: config.color + '20',
                    borderRadius: (config.size + 20) / 2,
                    zIndex: -1,
                  }}
                />
              </TouchableOpacity>
            </Animated.View>
          );
        });
      }
    });

    return holograms;
  };

  const generateAREnvironment = () => {
    const environment: React.ReactElement[] = [];
    
    // AR網格背景
    for (let i = 0; i < 15; i++) {
      environment.push(
        <View
          key={`grid-h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: i * 40,
            height: 1,
            backgroundColor: '#00FFFF',
            opacity: 0.1,
          }}
        />
      );
    }

    for (let i = 0; i < 10; i++) {
      environment.push(
        <View
          key={`grid-v-${i}`}
          style={{
            position: 'absolute',
            left: i * (screenWidth / 10),
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: '#00FFFF',
            opacity: 0.1,
          }}
        />
      );
    }

    // 浮動粒子效果
    for (let i = 0; i < 20; i++) {
      const colors = ['#00FFFF', '#FF00FF', '#00FF00'];
      environment.push(
        <View
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            left: Math.random() * screenWidth,
            top: Math.random() * 600,
            width: 2,
            height: 2,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: 1,
            opacity: 0.3 + Math.random() * 0.4,
          }}
        />
      );
    }

    return environment;
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#000020',
        borderBottomWidth: 2,
        borderBottomColor: '#00FFFF'
      }}>
        <TouchableOpacity
          onPress={() => {
            const currentSelected = selectedDate && selectedDate instanceof Date && !isNaN(selectedDate.getTime()) 
              ? selectedDate 
              : new Date();
            setSelectedDate(new Date(currentSelected.getFullYear(), currentSelected.getMonth() - 1));
          }}
        >
          <Text style={{ fontSize: 24, color: '#00FFFF' }}>‹</Text>
        </TouchableOpacity>
        
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#00FFFF', fontFamily: 'monospace' }}>
          🔮 AR時空 - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => {
            const currentSelected = selectedDate && selectedDate instanceof Date && !isNaN(selectedDate.getTime()) 
              ? selectedDate 
              : new Date();
            setSelectedDate(new Date(currentSelected.getFullYear(), currentSelected.getMonth() + 1));
          }}
        >
          <Text style={{ fontSize: 24, color: '#00FFFF' }}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 12,
        backgroundColor: '#000015',
        gap: 15
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#00FFFF', marginRight: 5 }}>🔷</Text>
          <Text style={{ fontSize: 10, color: '#00FFFF', fontFamily: 'monospace' }}>HIGH</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#FF00FF', marginRight: 5 }}>🔸</Text>
          <Text style={{ fontSize: 10, color: '#FF00FF', fontFamily: 'monospace' }}>MED</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#00FF00', marginRight: 5 }}>🔹</Text>
          <Text style={{ fontSize: 10, color: '#00FF00', fontFamily: 'monospace' }}>LOW</Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: '#000' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          minHeight: 800, 
          position: 'relative',
          paddingBottom: 50
        }}>
          {/* AR環境 */}
          {generateAREnvironment()}

          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 25,
            paddingVertical: 10,
            marginTop: 20,
            backgroundColor: '#000015'
          }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <View key={index} style={{ 
                flex: 1, 
                alignItems: 'center',
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: '#00FFFF',
                marginHorizontal: 1,
              }}>
                <Text style={{ fontWeight: 'bold', color: '#00FFFF', fontSize: 10, fontFamily: 'monospace' }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          {generateARHolograms()}
        </View>

        <View style={{
          margin: 15,
          padding: 20,
          backgroundColor: '#000020',
          borderRadius: 15,
          borderWidth: 2,
          borderColor: '#00FFFF',
          shadowColor: '#00FFFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 15,
          elevation: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>📊</Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#00FFFF', fontFamily: 'monospace' }}>
              AR分析面板
            </ThemedText>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#00FFFF', fontFamily: 'monospace' }}>
                {events.filter(e => {
                  const currentSelected = selectedDate && selectedDate instanceof Date && !isNaN(selectedDate.getTime()) 
                    ? selectedDate 
                    : new Date();
                  const eventDate = timestampToDate(e.start_ts);
                  return eventDate && eventDate instanceof Date && !isNaN(eventDate.getTime()) &&
                    eventDate.getMonth() === currentSelected.getMonth() && 
                    e.importance === 'high';
                }).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#00FFFF', fontFamily: 'monospace' }}>高強度全息</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FF00FF', fontFamily: 'monospace' }}>
                {events.filter(e => {
                  const currentSelected = selectedDate && selectedDate instanceof Date && !isNaN(selectedDate.getTime()) 
                    ? selectedDate 
                    : new Date();
                  const eventDate = timestampToDate(e.start_ts);
                  return eventDate && eventDate instanceof Date && !isNaN(eventDate.getTime()) &&
                    eventDate.getMonth() === currentSelected.getMonth() && 
                    e.importance === 'medium';
                }).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#FF00FF', fontFamily: 'monospace' }}>中強度投影</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#00FF00', fontFamily: 'monospace' }}>
                {events.filter(e => {
                  const currentSelected = selectedDate && selectedDate instanceof Date && !isNaN(selectedDate.getTime()) 
                    ? selectedDate 
                    : new Date();
                  const eventDate = timestampToDate(e.start_ts);
                  return eventDate && eventDate instanceof Date && !isNaN(eventDate.getTime()) &&
                    eventDate.getMonth() === currentSelected.getMonth() && 
                    e.importance === 'low';
                }).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#00FF00', fontFamily: 'monospace' }}>低強度顯示</Text>
            </View>
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#00FFFF', textAlign: 'center', fontFamily: 'monospace' }}>
              AR系統渲染了 {events.filter(e => {
                const currentSelected = selectedDate && selectedDate instanceof Date && !isNaN(selectedDate.getTime()) 
                  ? selectedDate 
                  : new Date();
                const eventDate = timestampToDate(e.start_ts);
                return eventDate && eventDate instanceof Date && !isNaN(eventDate.getTime()) &&
                  eventDate.getMonth() === currentSelected.getMonth();
              }).length} 個全息事件
              時空同步率：{Math.floor(Math.random() * 15 + 85)}% 🔮
            </Text>
          </View>

          <View style={{ 
            marginTop: 15, 
            backgroundColor: '#000015', 
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: '#00FFFF'
          }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00FFFF', marginBottom: 5, fontFamily: 'monospace' }}>
              🌐 AR狀態
            </Text>
            <Text style={{ fontSize: 11, color: '#00FFFF', lineHeight: 16, fontFamily: 'monospace' }}>
              全息投影穩定 | 空間錨點已校準
              實時渲染中... | 虛擬對象同步完成
              AR體驗模式：沉浸式時間管理
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default ARView; 