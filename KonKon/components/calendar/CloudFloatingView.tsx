import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CloudEvent {
  id: string;
  event: any;
  x: Animated.Value;
  y: Animated.Value;
  size: number;
  type: 'sunny' | 'cloudy' | 'stormy';
}

export default function CloudFloatingView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  const [cloudEvents, setCloudEvents] = useState<CloudEvent[]>([]);
  
  // 獲取選中日期的事件
  const getSelectedDateEvents = () => {
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    });
  };

  // 根據事件重要性決定雲朵類型
  const getCloudType = (event: any): 'sunny' | 'cloudy' | 'stormy' => {
    const title = event.title.toLowerCase();
    if (title.includes('重要') || title.includes('緊急') || title.includes('會議')) {
      return 'stormy';
    } else if (title.includes('娛樂') || title.includes('休息') || title.includes('假期')) {
      return 'sunny';
    }
    return 'cloudy';
  };

  // 獲取雲朵圖標
  const getCloudIcon = (type: 'sunny' | 'cloudy' | 'stormy') => {
    switch (type) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'stormy': return '⛈️';
    }
  };

  // 初始化雲朵動畫
  useEffect(() => {
    const selectedEvents = getSelectedDateEvents();
    const newCloudEvents: CloudEvent[] = selectedEvents.map((event, index) => {
      const cloudType = getCloudType(event);
      const size = cloudType === 'stormy' ? 80 : cloudType === 'cloudy' ? 60 : 50;
      
      return {
        id: event.id || `event-${index}`,
        event,
        x: new Animated.Value(Math.random() * (screenWidth - size)),
        y: new Animated.Value(Math.random() * (screenHeight - 300) + 100),
        size,
        type: cloudType,
      };
    });
    
    setCloudEvents(newCloudEvents);
    
    // 開始浮動動畫
    newCloudEvents.forEach((cloudEvent, index) => {
      startFloatingAnimation(cloudEvent, index);
    });
  }, [selectedDate, events]);

  // 雲朵浮動動畫
  const startFloatingAnimation = (cloudEvent: CloudEvent, index: number) => {
    const animateDuration = 3000 + Math.random() * 2000; // 3-5秒
    const delay = index * 500; // 錯開動畫時間
    
    const animate = () => {
      const newX = Math.random() * (screenWidth - cloudEvent.size);
      const newY = Math.random() * (screenHeight - 300) + 100;
      
      Animated.parallel([
        Animated.timing(cloudEvent.x, {
          toValue: newX,
          duration: animateDuration,
          useNativeDriver: false,
        }),
        Animated.timing(cloudEvent.y, {
          toValue: newY,
          duration: animateDuration,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // 動畫結束後繼續下一輪
        setTimeout(animate, 1000);
      });
    };
    
    setTimeout(animate, delay);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <View style={styles.container}>
      {/* 天空背景 */}
      <View style={styles.skyBackground}>
        <Text style={styles.dateTitle}>{formatSelectedDate()}</Text>
        <Text style={styles.weatherInfo}>
          {cloudEvents.length === 0 ? '晴朗無雲 ☀️' : `${cloudEvents.length} 個雲朵事件`}
        </Text>
      </View>

      {/* 浮動雲朵 */}
      {cloudEvents.map((cloudEvent) => (
        <Animated.View
          key={cloudEvent.id}
          style={[
            styles.cloudContainer,
            {
              left: cloudEvent.x,
              top: cloudEvent.y,
              width: cloudEvent.size,
              height: cloudEvent.size * 0.7,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cloud}
            onPress={() => onEventPress && onEventPress(cloudEvent.event)}
          >
            <Text style={[
              styles.cloudIcon,
              { fontSize: cloudEvent.size * 0.4 }
            ]}>
              {getCloudIcon(cloudEvent.type)}
            </Text>
            <View style={styles.eventInfo}>
              <Text style={[
                styles.eventTitle,
                { fontSize: cloudEvent.size * 0.15 }
              ]} numberOfLines={1}>
                {cloudEvent.event.title}
              </Text>
              <Text style={[
                styles.eventTime,
                { fontSize: cloudEvent.size * 0.12 }
              ]}>
                {formatTime(cloudEvent.event.start_ts)}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* 地面 */}
      <View style={styles.ground}>
        <Text style={styles.groundText}>🌱🌿🌳🌲🏔️</Text>
      </View>

      {/* 雲朵說明 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>☀️</Text>
          <Text style={styles.legendText}>輕鬆事件</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>☁️</Text>
          <Text style={styles.legendText}>一般事件</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>⛈️</Text>
          <Text style={styles.legendText}>重要事件</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // 天空藍
  },
  skyBackground: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  weatherInfo: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cloudContainer: {
    position: 'absolute',
  },
  cloud: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cloudIcon: {
    marginBottom: 4,
  },
  eventInfo: {
    alignItems: 'center',
  },
  eventTitle: {
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  eventTime: {
    color: '#7f8c8d',
    marginTop: 2,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#8FBC8F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groundText: {
    fontSize: 24,
    letterSpacing: 2,
  },
  legend: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
}); 