import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Fish {
  id: string;
  event: any;
  x: Animated.Value;
  y: Animated.Value;
  type: string;
  size: number;
  isCaught: boolean;
}

const FISH_TYPES = [
  { type: 'work', emoji: '🐟', color: '#3498db', size: 40 },
  { type: 'meeting', emoji: '🐠', color: '#e74c3c', size: 50 },
  { type: 'personal', emoji: '🐡', color: '#f39c12', size: 35 },
  { type: 'important', emoji: '🦈', color: '#9b59b6', size: 60 },
  { type: 'leisure', emoji: '🐙', color: '#1abc9c', size: 45 },
];

export default function FishingPondView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [caughtCount, setCaughtCount] = useState(0);
  const [isNight, setIsNight] = useState(false);

  const getSelectedDateEvents = () => {
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    });
  };

  const getFishType = (event: any): string => {
    const title = event.title.toLowerCase();
    if (title.includes('會議') || title.includes('meeting')) return 'meeting';
    if (title.includes('重要') || title.includes('緊急')) return 'important';
    if (title.includes('工作') || title.includes('辦公')) return 'work';
    if (title.includes('娛樂') || title.includes('休息')) return 'leisure';
    return 'personal';
  };

  useEffect(() => {
    const selectedEvents = getSelectedDateEvents();
    const newFishes: Fish[] = selectedEvents.map((event, index) => {
      const fishType = getFishType(event);
      const fishData = FISH_TYPES.find(f => f.type === fishType) || FISH_TYPES[0];
      
      return {
        id: event.id || `fish-${index}`,
        event,
        x: new Animated.Value(Math.random() * (screenWidth - fishData.size)),
        y: new Animated.Value(100 + Math.random() * (screenHeight - 300)),
        type: fishType,
        size: fishData.size,
        isCaught: false,
      };
    });
    
    setFishes(newFishes);
    setCaughtCount(0);
    
    // 檢查是否為夜晚模式
    const hour = new Date().getHours();
    setIsNight(hour < 6 || hour > 18);
    
    // 開始游泳動畫
    newFishes.forEach((fish, index) => {
      startSwimmingAnimation(fish, index);
    });
  }, [selectedDate, events]);

  const startSwimmingAnimation = (fish: Fish, index: number) => {
    const delay = index * 500;
    
    setTimeout(() => {
      const swim = () => {
        if (fish.isCaught) return;
        
        const newX = Math.random() * (screenWidth - fish.size);
        const newY = 100 + Math.random() * (screenHeight - 300);
        
        Animated.parallel([
          Animated.timing(fish.x, {
            toValue: newX,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: false,
          }),
          Animated.timing(fish.y, {
            toValue: newY,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setTimeout(swim, 1000 + Math.random() * 2000);
        });
      };
      
      swim();
    }, delay);
  };

  const catchFish = (fish: Fish) => {
    fish.isCaught = true;
    setCaughtCount(prev => prev + 1);
    
    // 釣魚動畫
    Animated.parallel([
      Animated.timing(fish.y, {
        toValue: 50,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(fish.x, {
        toValue: screenWidth / 2 - fish.size / 2,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // 顯示事件詳情
      if (onEventPress) {
        onEventPress(fish.event);
      }
      
      // 魚消失
      setTimeout(() => {
        setFishes(prev => prev.filter(f => f.id !== fish.id));
      }, 2000);
    });
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
    const today = new Date().toISOString().split('T')[0];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    if (selectedDateStr === today) {
      return '今日釣魚';
    } else {
      return selectedDate.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }) + ' 釣魚';
    }
  };

  return (
    <View style={[styles.container, isNight && styles.nightMode]}>
      {/* 釣魚池標題 */}
      <View style={[styles.header, isNight && styles.nightHeader]}>
        <Text style={styles.title}>🎣 {formatSelectedDate()}</Text>
        <Text style={styles.subtitle}>
          池中有 {fishes.length} 條魚 · 已釣起 {caughtCount} 條
        </Text>
        <Text style={styles.weatherText}>
          {isNight ? '🌙 夜釣時光' : '☀️ 陽光明媚'}
        </Text>
      </View>

      {/* 釣魚池 */}
      <View style={[styles.pond, isNight && styles.nightPond]}>
        {/* 水波紋效果 */}
        <View style={styles.waterRipples}>
          {Array.from({ length: 5 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.ripple,
                {
                  left: Math.random() * screenWidth,
                  top: 100 + Math.random() * 200,
                  animationDelay: `${i * 0.5}s`,
                }
              ]}
            />
          ))}
        </View>

        {/* 魚群 */}
        {fishes.map((fish) => {
          const fishData = FISH_TYPES.find(f => f.type === fish.type) || FISH_TYPES[0];
          
          return (
            <Animated.View
              key={fish.id}
              style={[
                styles.fishContainer,
                {
                  left: fish.x,
                  top: fish.y,
                  width: fish.size,
                  height: fish.size,
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.fish,
                  fish.isCaught && styles.caughtFish,
                ]}
                onPress={() => !fish.isCaught && catchFish(fish)}
              >
                <Text style={[
                  styles.fishEmoji,
                  { fontSize: fish.size * 0.8 }
                ]}>
                  {fishData.emoji}
                </Text>
                
                {/* 魚的信息氣泡 */}
                <View style={[
                  styles.fishInfo,
                  { backgroundColor: fishData.color + '20' }
                ]}>
                  <Text style={styles.fishTime}>{formatTime(fish.event.start_ts)}</Text>
                  <Text style={styles.fishTitle} numberOfLines={1}>
                    {fish.event.title}
                  </Text>
                </View>
                
                {/* 氣泡 */}
                {!fish.isCaught && (
                  <View style={styles.bubbles}>
                    <Text style={styles.bubble}>💧</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* 釣魚竿 */}
        <View style={styles.fishingRod}>
          <View style={styles.rodHandle}>
            <Text style={styles.rodEmoji}>🎣</Text>
          </View>
          <View style={styles.fishingLine} />
        </View>

        {/* 空池狀態 */}
        {fishes.length === 0 && (
          <View style={styles.emptyPond}>
            <Text style={styles.emptyIcon}>🏞️</Text>
            <Text style={styles.emptyText}>池塘空空如也</Text>
            <Text style={styles.emptySubtext}>今天沒有魚兒游過來</Text>
          </View>
        )}
      </View>

      {/* 釣魚指南 */}
      <View style={[styles.guide, isNight && styles.nightGuide]}>
        <Text style={styles.guideTitle}>🎯 釣魚指南</Text>
        <View style={styles.fishTypes}>
          {FISH_TYPES.map(fishType => (
            <View key={fishType.type} style={styles.fishTypeItem}>
              <Text style={styles.fishTypeEmoji}>{fishType.emoji}</Text>
              <Text style={styles.fishTypeName}>
                {fishType.type === 'work' ? '工作魚' :
                 fishType.type === 'meeting' ? '會議魚' :
                 fishType.type === 'personal' ? '個人魚' :
                 fishType.type === 'important' ? '重要魚' : '娛樂魚'}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.guideTip}>
          💡 點擊游動的魚兒來釣起它們，查看事件詳情！
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3f2fd',
  },
  nightMode: {
    backgroundColor: '#0d1421',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
  },
  nightHeader: {
    backgroundColor: '#1e2832',
    borderBottomColor: '#37474f',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0277bd',
  },
  subtitle: {
    fontSize: 14,
    color: '#0288d1',
    marginTop: 4,
  },
  weatherText: {
    fontSize: 12,
    color: '#0288d1',
    marginTop: 2,
  },
  pond: {
    flex: 1,
    backgroundColor: '#4fc3f7',
    position: 'relative',
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  nightPond: {
    backgroundColor: '#1a237e',
  },
  waterRipples: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  ripple: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.7,
  },
  fishContainer: {
    position: 'absolute',
  },
  fish: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  caughtFish: {
    opacity: 0.5,
  },
  fishEmoji: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  fishInfo: {
    position: 'absolute',
    top: -30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  fishTime: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0277bd',
  },
  fishTitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#0277bd',
    textAlign: 'center',
  },
  bubbles: {
    position: 'absolute',
    top: -10,
    right: -5,
  },
  bubble: {
    fontSize: 8,
    opacity: 0.7,
  },
  fishingRod: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  rodHandle: {
    alignItems: 'center',
  },
  rodEmoji: {
    fontSize: 24,
  },
  fishingLine: {
    width: 2,
    height: 100,
    backgroundColor: '#8d6e63',
    marginLeft: 10,
    marginTop: -5,
  },
  emptyPond: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -40 }],
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  guide: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#bbdefb',
    padding: 16,
  },
  nightGuide: {
    backgroundColor: '#1e2832',
    borderTopColor: '#37474f',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0277bd',
    textAlign: 'center',
    marginBottom: 12,
  },
  fishTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  fishTypeItem: {
    alignItems: 'center',
    margin: 4,
  },
  fishTypeEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  fishTypeName: {
    fontSize: 10,
    color: '#0288d1',
    fontWeight: '600',
  },
  guideTip: {
    fontSize: 12,
    color: '#0288d1',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 