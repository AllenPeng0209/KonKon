import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(screenWidth, screenHeight) * 0.8;
const CENTER_X = screenWidth / 2;
const CENTER_Y = screenHeight / 2;

interface ConstellationMonth {
  month: number;
  name: string;
  constellation: string;
  sign: string;
  color: string;
  angle: number;
}

interface StarEvent {
  id: string;
  event: any;
  x: number;
  y: number;
  opacity: Animated.Value;
}

const CONSTELLATIONS: ConstellationMonth[] = [
  { month: 1, name: '一月', constellation: '摩羯座', sign: '♑', color: '#8B4513', angle: 0 },
  { month: 2, name: '二月', constellation: '水瓶座', sign: '♒', color: '#00CED1', angle: 30 },
  { month: 3, name: '三月', constellation: '雙魚座', sign: '♓', color: '#9370DB', angle: 60 },
  { month: 4, name: '四月', constellation: '白羊座', sign: '♈', color: '#FF6347', angle: 90 },
  { month: 5, name: '五月', constellation: '金牛座', sign: '♉', color: '#32CD32', angle: 120 },
  { month: 6, name: '六月', constellation: '雙子座', sign: '♊', color: '#FFD700', angle: 150 },
  { month: 7, name: '七月', constellation: '巨蟹座', sign: '♋', color: '#C0C0C0', angle: 180 },
  { month: 8, name: '八月', constellation: '獅子座', sign: '♌', color: '#FFA500', angle: 210 },
  { month: 9, name: '九月', constellation: '處女座', sign: '♍', color: '#6B8E23', angle: 240 },
  { month: 10, name: '十月', constellation: '天秤座', sign: '♎', color: '#FF69B4', angle: 270 },
  { month: 11, name: '十一月', constellation: '天蠍座', sign: '♏', color: '#8B0000', angle: 300 },
  { month: 12, name: '十二月', constellation: '射手座', sign: '♐', color: '#4B0082', angle: 330 },
];

export default function ConstellationWheelView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
}: CalendarViewProps) {
  const [starEvents, setStarEvents] = useState<StarEvent[]>([]);
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  
  const currentMonthNum = selectedDate.getMonth() + 1;
  const selectedConstellation = CONSTELLATIONS.find(c => c.month === currentMonthNum);

  // 獲取當月事件
  const getCurrentMonthEvents = () => {
    return events.filter(event => {
      const eventDate = new Date(event.start_ts * 1000);
      return eventDate.getMonth() + 1 === currentMonthNum;
    });
  };

  // 生成星星事件
  useEffect(() => {
    const monthEvents = getCurrentMonthEvents();
    const radius = WHEEL_SIZE / 2 - 80;
    const centerX = CENTER_X;
    const centerY = CENTER_Y;
    
    const newStarEvents: StarEvent[] = monthEvents.map((event, index) => {
      const angle = (index / Math.max(monthEvents.length, 1)) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * (radius * 0.7 + Math.random() * radius * 0.3);
      const y = centerY + Math.sin(angle) * (radius * 0.7 + Math.random() * radius * 0.3);
      
      return {
        id: event.id || `star-${index}`,
        event,
        x,
        y,
        opacity: new Animated.Value(0.3),
      };
    });
    
    setStarEvents(newStarEvents);
    
    // 開始閃爍動畫
    newStarEvents.forEach((star, index) => {
      startTwinkleAnimation(star, index);
    });
  }, [selectedDate, events]);

  // 星星閃爍動畫
  const startTwinkleAnimation = (star: StarEvent, index: number) => {
    const delay = index * 200;
    
    const twinkle = () => {
      Animated.sequence([
        Animated.timing(star.opacity, {
          toValue: 1,
          duration: 1000 + Math.random() * 1000,
          useNativeDriver: false,
        }),
        Animated.timing(star.opacity, {
          toValue: 0.3,
          duration: 1000 + Math.random() * 1000,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setTimeout(twinkle, Math.random() * 2000);
      });
    };
    
    setTimeout(twinkle, delay);
  };

  // 輪盤旋轉到指定月份
  const rotateToMonth = (monthNum: number) => {
    const targetConstellation = CONSTELLATIONS.find(c => c.month === monthNum);
    if (targetConstellation) {
      const targetAngle = -targetConstellation.angle;
      currentRotation.current = targetAngle;
      
      Animated.timing(wheelRotation, {
        toValue: targetAngle,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      // 切換到該月份
      const newDate = new Date(selectedDate);
      newDate.setMonth(monthNum - 1);
      onDatePress(newDate);
    }
  };

  // 渲染月份扇形
  const renderMonthSegment = (constellation: ConstellationMonth, index: number) => {
    const isSelected = constellation.month === currentMonthNum;
    const radius = WHEEL_SIZE / 2 - 20;
    const innerRadius = radius * 0.6;
    
    // 計算扇形中心點
    const angle = (constellation.angle + 15) * Math.PI / 180;
    const labelRadius = radius * 0.8;
    const labelX = CENTER_X + Math.cos(angle) * labelRadius;
    const labelY = CENTER_Y + Math.sin(angle) * labelRadius;

    return (
      <TouchableOpacity
        key={constellation.month}
        style={[
          styles.monthSegment,
          {
            left: labelX - 35,
            top: labelY - 35,
            backgroundColor: isSelected ? constellation.color : 'rgba(255, 255, 255, 0.1)',
            borderColor: constellation.color,
          }
        ]}
        onPress={() => rotateToMonth(constellation.month)}
      >
        <Text style={[
          styles.constellationSign,
          { color: isSelected ? '#ffffff' : constellation.color }
        ]}>
          {constellation.sign}
        </Text>
        <Text style={[
          styles.monthName,
          { color: isSelected ? '#ffffff' : constellation.color }
        ]}>
          {constellation.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <View style={styles.container}>
      {/* 星空背景 */}
      <View style={styles.starField}>
        {Array.from({ length: 50 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.backgroundStar,
              {
                left: Math.random() * screenWidth,
                top: Math.random() * screenHeight,
                opacity: Math.random() * 0.8 + 0.2,
              }
            ]}
          />
        ))}
      </View>

      {/* 中心信息 */}
      <View style={styles.centerInfo}>
        <Text style={styles.currentMonth}>{selectedConstellation?.name}</Text>
        <Text style={styles.currentConstellation}>{selectedConstellation?.constellation}</Text>
        <Text style={styles.constellationSignLarge}>{selectedConstellation?.sign}</Text>
        <Text style={styles.eventCount}>
          {getCurrentMonthEvents().length} 個事件
        </Text>
      </View>

      {/* 星座輪盤 */}
      <Animated.View
        style={[
          styles.wheel,
          {
            transform: [{ rotate: wheelRotation.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }) }],
          }
        ]}
      >
        {CONSTELLATIONS.map(renderMonthSegment)}
      </Animated.View>

      {/* 事件星星 */}
      {starEvents.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.starEventContainer,
            {
              left: star.x - 20,
              top: star.y - 20,
              opacity: star.opacity,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.starEvent}
            onPress={() => onEventPress && onEventPress(star.event)}
          >
            <Text style={styles.starIcon}>⭐</Text>
            <View style={styles.starTooltip}>
              <Text style={styles.starTitle} numberOfLines={1}>
                {star.event.title}
              </Text>
              <Text style={styles.starTime}>
                {formatTime(star.event.start_ts)}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* 控制說明 */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          點擊星座符號切換月份 ✨
        </Text>
        <Text style={styles.instructionText}>
          點擊星星查看事件詳情 ⭐
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426', // 深藍夜空
  },
  starField: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  centerInfo: {
    position: 'absolute',
    left: CENTER_X - 60,
    top: CENTER_Y - 60,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  currentMonth: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  currentConstellation: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 2,
  },
  constellationSignLarge: {
    fontSize: 24,
    color: '#FFD700',
    marginTop: 4,
  },
  eventCount: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  wheel: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    left: CENTER_X - WHEEL_SIZE / 2,
    top: CENTER_Y - WHEEL_SIZE / 2,
  },
  monthSegment: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  constellationSign: {
    fontSize: 20,
    fontWeight: '700',
  },
  monthName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  starEventContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  starEvent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: 20,
  },
  starTooltip: {
    position: 'absolute',
    top: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  starTitle: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  starTime: {
    fontSize: 8,
    color: '#cccccc',
    marginTop: 2,
  },
  instructions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 4,
  },
}); 