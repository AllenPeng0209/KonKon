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

interface Cube3DViewProps {
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

const Cube3DView: React.FC<Cube3DViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const rotationAnimations = useRef<Map<string, Animated.Value>>(new Map());

  const cubeConfig = {
    high: { 
      color: '#E74C3C', 
      size: 50,
      glow: '#FF6B6B40',
      depth: 8
    },
    medium: { 
      color: '#F39C12', 
      size: 40,
      glow: '#FFB84D40',
      depth: 6
    },
    low: { 
      color: '#3498DB', 
      size: 30,
      glow: '#5DADE240',
      depth: 4
    }
  };

  const getCubeConfig = (importance: string = 'medium') => {
    return cubeConfig[importance as keyof typeof cubeConfig] || cubeConfig.medium;
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
          rotationAnimations.current.set(event.id, new Animated.Value(0));
        }
      });
    });

    const animations = Array.from(animationValues.current.values()).map((value, index) =>
      Animated.spring(value, {
        toValue: 1,
        delay: index * 50,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    );

    const rotationAnimationList = Array.from(rotationAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration: 4000 + Math.random() * 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    );

    Animated.parallel([...animations, ...rotationAnimationList]).start();
  }, [selectedDate, events]);

  const generate3DCubes = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const cubes: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      
      if (dayEvents.length > 0) {
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = (col * (screenWidth - 60) / 7) + 30;
        const baseY = 100 + row * 120;

        dayEvents.forEach((event, eventIndex) => {
          const config = getCubeConfig(event.importance);
          
          const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
          const rotateValue = rotationAnimations.current.get(event.id) || new Animated.Value(0);

          const scale = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const rotateY = rotateValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          cubes.push(
            <Animated.View
              key={event.id}
              style={{
                position: 'absolute',
                left: baseX - config.size / 2,
                top: baseY + eventIndex * 60,
                transform: [
                  { scale },
                  { rotateY },
                  { perspective: 1000 }
                ],
              }}
            >
              <TouchableOpacity
                onPress={() => onEventPress(event)}
                style={{
                  width: config.size,
                  height: config.size,
                  position: 'relative',
                }}
              >
                {/* 方塊前面 */}
                <View
                  style={{
                    position: 'absolute',
                    width: config.size,
                    height: config.size,
                    backgroundColor: config.color,
                    borderRadius: 8,
                    shadowColor: config.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ 
                    fontSize: config.size > 40 ? 12 : 8, 
                    color: 'white', 
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }} numberOfLines={2}>
                    {event.title.length > 6 ? `${event.title.substring(0, 6)}...` : event.title}
                  </Text>
                </View>

                {/* 方塊右側 */}
                <View
                  style={{
                    position: 'absolute',
                    left: config.size,
                    top: -config.depth,
                    width: config.depth,
                    height: config.size,
                    backgroundColor: config.color,
                    opacity: 0.7,
                    transform: [{ skewY: '30deg' }],
                  }}
                />

                {/* 方塊頂部 */}
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: -config.depth,
                    width: config.size,
                    height: config.depth,
                    backgroundColor: config.color,
                    opacity: 0.8,
                    transform: [{ skewX: '30deg' }],
                  }}
                />

                {/* 發光效果 */}
                <View
                  style={{
                    position: 'absolute',
                    left: -5,
                    top: -5,
                    width: config.size + 10,
                    height: config.size + 10,
                    backgroundColor: config.glow,
                    borderRadius: 13,
                    zIndex: -1,
                  }}
                />

                {/* 日期標籤 */}
                <View
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: -8,
                    backgroundColor: '#2C3E50',
                    borderRadius: 10,
                    width: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: 'white',
                  }}
                >
                  <Text style={{ 
                    fontSize: 8, 
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {day.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        });
      }
    });

    return cubes;
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#2C3E50',
        borderBottomWidth: 1,
        borderBottomColor: '#34495E'
      }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
        >
          <Text style={{ fontSize: 24, color: '#ECF0F1' }}>‹</Text>
        </TouchableOpacity>
        
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#ECF0F1' }}>
          🧊 3D魔方世界 - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: '#ECF0F1' }}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 12,
        backgroundColor: '#34495E',
        gap: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, backgroundColor: '#E74C3C', marginRight: 5, borderRadius: 2 }} />
          <Text style={{ fontSize: 12, color: '#ECF0F1' }}>大方塊</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, backgroundColor: '#F39C12', marginRight: 5, borderRadius: 2 }} />
          <Text style={{ fontSize: 12, color: '#ECF0F1' }}>中方塊</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, backgroundColor: '#3498DB', marginRight: 5, borderRadius: 2 }} />
          <Text style={{ fontSize: 12, color: '#ECF0F1' }}>小方塊</Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: '#1A252F' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          minHeight: 700, 
          position: 'relative',
          paddingBottom: 50
        }}>
          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 30,
            paddingVertical: 10,
            marginTop: 20,
            backgroundColor: '#2C3E50'
          }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <View key={index} style={{ 
                flex: 1, 
                alignItems: 'center',
                paddingVertical: 5
              }}>
                <Text style={{ fontWeight: 'bold', color: '#ECF0F1', fontSize: 12 }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          {generate3DCubes()}
        </View>

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
          borderLeftColor: '#2C3E50',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>📊</Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>本月3D統計</ThemedText>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#E74C3C' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'high'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>大型方塊</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F39C12' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'medium'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>中型方塊</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#3498DB' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'low'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>小型方塊</Text>
            </View>
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              在這個3D世界中，您構建了 {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length} 個立體回憶！
              每個方塊都承載著獨特的時光 🧊✨
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default Cube3DView; 