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

interface RunningTrackViewProps {
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

const RunningTrackView: React.FC<RunningTrackViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const runningAnimations = useRef<Map<string, Animated.Value>>(new Map());

  // 運動類型配置
  const activityConfig = {
    high: { 
      emoji: '🏃‍♂️', 
      color: '#E74C3C', 
      type: '競賽',
      speed: 'fast',
      distance: '10km+'
    },
    medium: { 
      emoji: '🚴‍♀️', 
      color: '#F39C12', 
      type: '訓練',
      speed: 'medium',
      distance: '5km'
    },
    low: { 
      emoji: '🚶‍♂️', 
      color: '#27AE60', 
      type: '散步',
      speed: 'slow',
      distance: '2km'
    }
  };

  // 運動場景圖標
  const sportIcons = {
    'work': '💼',
    'personal': '🏃',
    'meeting': '👥',
    'reminder': '⏰',
    'celebration': '🏆',
    'health': '🏥',
    'education': '📚',
    'travel': '✈️'
  };

  // 獲取活動配置
  const getActivityConfig = (importance: string = 'medium') => {
    return activityConfig[importance as keyof typeof activityConfig] || activityConfig.medium;
  };

  // 獲取運動圖標
  const getSportIcon = (event: Event) => {
    const category = event.category?.toLowerCase() || 'personal';
    return sportIcons[category as keyof typeof sportIcons] || '🏃';
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
          runningAnimations.current.set(event.id, new Animated.Value(0));
        }
      });
    });

    // 運動員出現動畫
    const animations = Array.from(animationValues.current.values()).map((value, index) =>
      Animated.spring(value, {
        toValue: 1,
        delay: index * 100,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    );

    // 跑步動畫
    const runAnimationList = Array.from(runningAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 1500 + Math.random() * 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 1500 + Math.random() * 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel([...animations, ...runAnimationList]).start();
  }, [selectedDate, events]);

  // 生成跑道
  const generateTrack = () => {
    const tracks: React.ReactElement[] = [];
    const numberOfTracks = 6; // 6條跑道（對應6週）

    for (let trackIndex = 0; trackIndex < numberOfTracks; trackIndex++) {
      // 跑道主體
      tracks.push(
        <View
          key={`track-${trackIndex}`}
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            top: 60 + trackIndex * 100,
            height: 80,
            backgroundColor: '#2ECC71',
            borderRadius: 10,
            borderWidth: 2,
            borderColor: '#27AE60',
          }}
        />
      );

      // 跑道線條
      for (let lane = 1; lane < 7; lane++) {
        tracks.push(
          <View
            key={`lane-${trackIndex}-${lane}`}
            style={{
              position: 'absolute',
              left: 20 + (lane * (screenWidth - 40) / 7),
              top: 60 + trackIndex * 100,
              width: 2,
              height: 80,
              backgroundColor: 'white',
              opacity: 0.7,
            }}
          />
        );
      }

      // 起跑線
      tracks.push(
        <View
          key={`start-line-${trackIndex}`}
          style={{
            position: 'absolute',
            left: 25,
            top: 65 + trackIndex * 100,
            width: 4,
            height: 70,
            backgroundColor: 'white',
          }}
        />
      );

      // 終點線
      tracks.push(
        <View
          key={`finish-line-${trackIndex}`}
          style={{
            position: 'absolute',
            right: 25,
            top: 65 + trackIndex * 100,
            width: 4,
            height: 70,
            backgroundColor: '#FFD700',
          }}
        />
      );

      // 跑道標識
      tracks.push(
        <View
          key={`track-label-${trackIndex}`}
          style={{
            position: 'absolute',
            left: 5,
            top: 95 + trackIndex * 100,
            width: 30,
            height: 30,
            backgroundColor: '#34495E',
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
            {trackIndex + 1}
          </Text>
        </View>
      );
    }

    return tracks;
  };

  // 生成運動員
  const generateRunners = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const runners: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      
      dayEvents.forEach((event, eventIndex) => {
        const activityConf = getActivityConfig(event.importance);
        const sportIcon = getSportIcon(event);
        
        // 計算跑道位置
        const weekIndex = Math.floor(dayIndex / 7);
        const dayOfWeek = dayIndex % 7;
        const laneX = 30 + dayOfWeek * ((screenWidth - 60) / 7);
        const trackY = 70 + weekIndex * 100;

        const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
        const runValue = runningAnimations.current.get(event.id) || new Animated.Value(0);

        const scale = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        // 根據速度設置不同的跑步動畫
        const runDistance = activityConf.speed === 'fast' ? 20 : 
                           activityConf.speed === 'medium' ? 15 : 10;

        const runTranslateX = runValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, runDistance],
        });

        const bounce = runValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, -3, 0],
        });

        runners.push(
          <Animated.View
            key={event.id}
            style={{
              position: 'absolute',
              left: laneX,
              top: trackY + eventIndex * 20,
              transform: [
                { scale },
                { translateX: runTranslateX },
                { translateY: bounce }
              ],
            }}
          >
            <TouchableOpacity
              onPress={() => onEventPress(event)}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                borderRadius: 25,
                padding: 8,
                borderWidth: 3,
                borderColor: activityConf.color,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 4,
                minWidth: 50,
              }}
            >
              {/* 運動類型 */}
              <Text style={{ fontSize: 16, marginBottom: 2 }}>
                {activityConf.emoji}
              </Text>
              
              {/* 運動類別圖標 */}
              <Text style={{ fontSize: 10, marginBottom: 2 }}>
                {sportIcon}
              </Text>
              
              {/* 活動類型標籤 */}
              <View style={{
                backgroundColor: activityConf.color + '20',
                borderRadius: 8,
                paddingHorizontal: 4,
                paddingVertical: 1,
                marginBottom: 2,
              }}>
                <Text style={{ 
                  fontSize: 8, 
                  color: activityConf.color,
                  fontWeight: 'bold'
                }}>
                  {activityConf.type}
                </Text>
              </View>

              {/* 事件標題 */}
              <Text style={{ 
                fontSize: 7, 
                color: '#333',
                textAlign: 'center',
                maxWidth: 40
              }} numberOfLines={1}>
                {event.title}
              </Text>
              
              {/* 距離標記 */}
              <Text style={{ 
                fontSize: 6, 
                color: activityConf.color,
                fontWeight: 'bold'
              }}>
                {activityConf.distance}
              </Text>

              {/* 日期 */}
              <View style={{
                backgroundColor: activityConf.color,
                borderRadius: 3,
                paddingHorizontal: 3,
                paddingVertical: 1,
                marginTop: 2,
              }}>
                <Text style={{ 
                  fontSize: 6, 
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {day.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        );

        // 添加速度線條效果（高強度運動）
        if (activityConf.speed === 'fast') {
          for (let i = 0; i < 3; i++) {
            runners.push(
              <Animated.View
                key={`speed-line-${event.id}-${i}`}
                style={{
                  position: 'absolute',
                  left: laneX - 10 - i * 5,
                  top: trackY + eventIndex * 20 + 15,
                  width: 8,
                  height: 2,
                  backgroundColor: activityConf.color,
                  opacity: runValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8],
                  }),
                  borderRadius: 1,
                }}
              />
            );
          }
        }
      });
    });

    return runners;
  };

  // 生成運動場裝飾
  const generateStadiumDecorations = () => {
    const decorations: React.ReactElement[] = [];
    
    // 觀眾席
    decorations.push(
      <View
        key="stadium-stands"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 20,
          height: 30,
          backgroundColor: '#95A5A6',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: 20,
        }}
      >
        {['👤', '👤', '👤', '👤', '👤'].map((person, index) => (
          <Text key={index} style={{ fontSize: 14, opacity: 0.6 }}>
            {person}
          </Text>
        ))}
      </View>
    );

    // 記分板
    decorations.push(
      <View
        key="scoreboard"
        style={{
          position: 'absolute',
          right: 20,
          top: 25,
          backgroundColor: '#2C3E50',
          borderRadius: 5,
          padding: 8,
          minWidth: 80,
        }}
      >
        <Text style={{ color: '#00FF00', fontSize: 10, textAlign: 'center' }}>
          MONTH SCORE
        </Text>
        <Text style={{ color: '#FFD700', fontSize: 14, textAlign: 'center', fontWeight: 'bold' }}>
          {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length}
        </Text>
      </View>
    );

    // 運動用具裝飾
    const equipments = ['⚽', '🏀', '🎾', '🏐', '🏓'];
    for (let i = 0; i < 5; i++) {
      decorations.push(
        <View
          key={`equipment-${i}`}
          style={{
            position: 'absolute',
            left: 50 + i * 60,
            top: 30,
            opacity: 0.3,
          }}
        >
          <Text style={{ fontSize: 16 }}>
            {equipments[i]}
          </Text>
        </View>
      );
    }

    return decorations;
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
          🏃‍♂️ 運動競技場 - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: '#ECF0F1' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 運動類型圖例 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 12,
        backgroundColor: '#ECF0F1',
        gap: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 5 }}>🏃‍♂️</Text>
          <Text style={{ fontSize: 12, color: '#2C3E50' }}>競賽(高強度)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 5 }}>🚴‍♀️</Text>
          <Text style={{ fontSize: 12, color: '#2C3E50' }}>訓練(中強度)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 5 }}>🚶‍♂️</Text>
          <Text style={{ fontSize: 12, color: '#2C3E50' }}>散步(低強度)</Text>
        </View>
      </View>

      {/* 運動場區域 */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#58D68D' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          minHeight: 700, 
          position: 'relative',
          paddingBottom: 50
        }}>
          {/* 運動場裝飾 */}
          {generateStadiumDecorations()}
          
          {/* 跑道 */}
          {generateTrack()}
          
          {/* 週標題（跑道標識） */}
          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 30,
            paddingVertical: 8,
            marginTop: 55,
            backgroundColor: '#34495E'
          }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <View key={index} style={{ 
                flex: 1, 
                alignItems: 'center',
                paddingVertical: 3
              }}>
                <Text style={{ fontWeight: 'bold', color: '#ECF0F1', fontSize: 10 }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          {/* 運動員 */}
          {generateRunners()}
        </View>

        {/* 運動統計卡片 */}
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
            <Text style={{ fontSize: 24, marginRight: 10 }}>
              🏆
            </Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>
              本月運動成績
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
              <Text style={{ fontSize: 12, color: '#666' }}>競賽項目</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F39C12' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'medium'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>訓練課程</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#27AE60' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'low'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>休閒運動</Text>
            </View>
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              本月您完成了 {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length} 次運動挑戰！
              堅持運動，保持健康的身心狀態 💪✨
            </Text>
          </View>

          {/* 運動建議 */}
          <View style={{ 
            marginTop: 15, 
            backgroundColor: '#F8F9FA', 
            borderRadius: 10,
            padding: 12
          }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 }}>
              💡 運動小貼士
            </Text>
            <Text style={{ fontSize: 11, color: '#666', lineHeight: 16 }}>
              記住要適度運動，保持規律的作息時間。每次運動前記得熱身，運動後要做拉伸。
              健康的身體是美好生活的基礎！
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default RunningTrackView; 