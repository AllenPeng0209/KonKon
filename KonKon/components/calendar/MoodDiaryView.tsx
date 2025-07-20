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

interface MoodDiaryViewProps {
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

const MoodDiaryView: React.FC<MoodDiaryViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const heartbeatAnimations = useRef<Map<string, Animated.Value>>(new Map());

  // 心情配置
  const moodConfig = {
    high: { 
      emoji: '😍', 
      color: '#E74C3C', 
      mood: '超開心',
      bgColor: '#FFE6E6',
      intensity: 'high'
    },
    medium: { 
      emoji: '😊', 
      color: '#F39C12', 
      mood: '愉快',
      bgColor: '#FFF3E0',
      intensity: 'medium'
    },
    low: { 
      emoji: '😌', 
      color: '#3498DB', 
      mood: '平靜',
      bgColor: '#E3F2FD',
      intensity: 'low'
    }
  };

  // 情緒表情庫
  const emotionEmojis = {
    'work': ['😤', '💼', '📊', '⚡'],
    'personal': ['🤗', '💕', '🌸', '✨'],
    'meeting': ['🤝', '💬', '📝', '👥'],
    'reminder': ['🤔', '💭', '⏰', '📌'],
    'celebration': ['🥳', '🎉', '🎂', '🌟'],
    'health': ['😷', '💊', '🏥', '💪'],
    'education': ['🤓', '📚', '✏️', '🎓'],
    'travel': ['😎', '✈️', '🗺️', '📸']
  };

  // 獲取心情配置
  const getMoodConfig = (importance: string = 'medium') => {
    return moodConfig[importance as keyof typeof moodConfig] || moodConfig.medium;
  };

  // 獲取情緒表情
  const getEmotionEmoji = (event: Event) => {
    const category = event.category?.toLowerCase() || 'personal';
    const emojis = emotionEmojis[category as keyof typeof emotionEmojis] || emotionEmojis.personal;
    return emojis[Math.floor(Math.random() * emojis.length)];
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
          heartbeatAnimations.current.set(event.id, new Animated.Value(1));
        }
      });
    });

    // 心情出現動畫
    const animations = Array.from(animationValues.current.values()).map((value, index) =>
      Animated.spring(value, {
        toValue: 1,
        delay: index * 80,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      })
    );

    // 心跳動畫
    const heartbeatAnimationList = Array.from(heartbeatAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1.2,
            duration: 800 + Math.random() * 400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 1,
            duration: 800 + Math.random() * 400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel([...animations, ...heartbeatAnimationList]).start();
  }, [selectedDate, events]);

  // 生成日記頁面背景
  const generateDiaryBackground = () => {
    const pages: React.ReactElement[] = [];
    
    // 日記本背景
    pages.push(
      <View
        key="diary-background"
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          top: 10,
          bottom: 10,
          backgroundColor: '#FFF8E1',
          borderRadius: 15,
          shadowColor: '#8D6E63',
          shadowOffset: { width: 2, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 8,
        }}
      />
    );

    // 日記線條
    for (let i = 0; i < 25; i++) {
      pages.push(
        <View
          key={`diary-line-${i}`}
          style={{
            position: 'absolute',
            left: 40,
            right: 30,
            top: 80 + i * 25,
            height: 1,
            backgroundColor: '#E1BEE7',
            opacity: 0.3,
          }}
        />
      );
    }

    // 日記本裝訂線
    pages.push(
      <View
        key="diary-binding"
        style={{
          position: 'absolute',
          left: 30,
          top: 20,
          bottom: 20,
          width: 3,
          backgroundColor: '#D32F2F',
          borderRadius: 2,
        }}
      />
    );

    // 裝飾貼紙
    const stickers = ['💕', '⭐', '🌸', '🎀', '💫'];
    for (let i = 0; i < 8; i++) {
      pages.push(
        <View
          key={`sticker-${i}`}
          style={{
            position: 'absolute',
            left: 20 + Math.random() * (screenWidth - 80),
            top: 20 + Math.random() * 40,
            opacity: 0.4,
          }}
        >
          <Text style={{ fontSize: 16 }}>
            {stickers[Math.floor(Math.random() * stickers.length)]}
          </Text>
        </View>
      );
    }

    return pages;
  };

  // 生成心情日記
  const generateMoodEntries = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const entries: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      
      if (dayEvents.length > 0) {
        // 計算位置
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = 45 + col * ((screenWidth - 90) / 7);
        const baseY = 80 + row * 100;

        dayEvents.forEach((event, eventIndex) => {
          const moodConf = getMoodConfig(event.importance);
          const emotionEmoji = getEmotionEmoji(event);
          
          const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
          const heartbeatValue = heartbeatAnimations.current.get(event.id) || new Animated.Value(1);

          const scale = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          entries.push(
            <Animated.View
              key={event.id}
              style={{
                position: 'absolute',
                left: baseX - 25,
                top: baseY + eventIndex * 35,
                transform: [
                  { scale },
                  { scale: heartbeatValue }
                ],
              }}
            >
              <TouchableOpacity
                onPress={() => onEventPress(event)}
                style={{
                  backgroundColor: moodConf.bgColor,
                  borderRadius: 20,
                  padding: 10,
                  borderWidth: 2,
                  borderColor: moodConf.color,
                  shadowColor: moodConf.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                  minWidth: 60,
                  alignItems: 'center',
                }}
              >
                {/* 主要心情表情 */}
                <Text style={{ fontSize: 20, marginBottom: 3 }}>
                  {moodConf.emoji}
                </Text>
                
                {/* 情境表情 */}
                <Text style={{ fontSize: 12, marginBottom: 3 }}>
                  {emotionEmoji}
                </Text>
                
                {/* 心情標籤 */}
                <View style={{
                  backgroundColor: moodConf.color + '20',
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginBottom: 3,
                }}>
                  <Text style={{ 
                    fontSize: 8, 
                    color: moodConf.color,
                    fontWeight: 'bold'
                  }}>
                    {moodConf.mood}
                  </Text>
                </View>

                {/* 事件標題 */}
                <Text style={{ 
                  fontSize: 7, 
                  color: '#333',
                  textAlign: 'center',
                  maxWidth: 45,
                  lineHeight: 10
                }} numberOfLines={2}>
                  {event.title}
                </Text>
                
                {/* 日期標記 */}
                <View style={{
                  backgroundColor: moodConf.color,
                  borderRadius: 8,
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

              {/* 心情光暈效果 */}
              <View
                style={{
                  position: 'absolute',
                  left: -5,
                  top: -5,
                  right: -5,
                  bottom: -5,
                  backgroundColor: moodConf.color + '10',
                  borderRadius: 25,
                  zIndex: -1,
                }}
              />
            </Animated.View>
          );
        });
      } else {
        // 沒有事件時顯示空白日記格
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = 45 + col * ((screenWidth - 90) / 7);
        const baseY = 80 + row * 100;

        entries.push(
          <View
            key={`empty-${dayIndex}`}
            style={{
              position: 'absolute',
              left: baseX - 15,
              top: baseY,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: '#F5F5F5',
              borderWidth: 1,
              borderColor: '#DDD',
              borderStyle: 'dashed',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 10, color: '#999' }}>
              {day.getDate()}
            </Text>
          </View>
        );
      }
    });

    return entries;
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
        backgroundColor: '#8E24AA',
        borderBottomWidth: 1,
        borderBottomColor: '#7B1FA2'
      }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
        >
          <Text style={{ fontSize: 24, color: '#FCE4EC' }}>‹</Text>
        </TouchableOpacity>
        
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#FCE4EC' }}>
          💕 心情日記 - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: '#FCE4EC' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 心情圖例 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 12,
        backgroundColor: '#FCE4EC',
        gap: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, marginRight: 5 }}>😍</Text>
          <Text style={{ fontSize: 12, color: '#8E24AA' }}>超開心</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, marginRight: 5 }}>😊</Text>
          <Text style={{ fontSize: 12, color: '#8E24AA' }}>愉快</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, marginRight: 5 }}>😌</Text>
          <Text style={{ fontSize: 12, color: '#8E24AA' }}>平靜</Text>
        </View>
      </View>

      {/* 日記區域 */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#F3E5F5' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          minHeight: 700, 
          position: 'relative',
          paddingBottom: 50
        }}>
          {/* 日記背景 */}
          {generateDiaryBackground()}
          
          {/* 週標題 */}
          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 45,
            paddingVertical: 8,
            marginTop: 50,
            backgroundColor: '#8E24AA'
          }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <View key={index} style={{ 
                flex: 1, 
                alignItems: 'center',
                paddingVertical: 3
              }}>
                <Text style={{ fontWeight: 'bold', color: '#FCE4EC', fontSize: 12 }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          {/* 心情日記條目 */}
          {generateMoodEntries()}
        </View>

        {/* 心情統計卡片 */}
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
          borderLeftColor: '#8E24AA',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>
              📊
            </Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>
              本月心情分析
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
              <Text style={{ fontSize: 12, color: '#666' }}>超開心時刻</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F39C12' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'medium'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>愉快經歷</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#3498DB' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'low'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>平靜日子</Text>
            </View>
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              本月您記錄了 {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length} 個珍貴回憶！
              每一份心情都是生活最美好的見證 💕✨
            </Text>
          </View>

          {/* 心情建議 */}
          <View style={{ 
            marginTop: 15, 
            backgroundColor: '#FCE4EC', 
            borderRadius: 10,
            padding: 12
          }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#8E24AA', marginBottom: 5 }}>
              💝 心情小語
            </Text>
            <Text style={{ fontSize: 11, color: '#666', lineHeight: 16 }}>
              記住要珍惜每一個美好的瞬間，即使是平凡的日子也蘊含著小確幸。
              保持積極樂觀的心態，讓生活充滿陽光和微笑！
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default MoodDiaryView; 