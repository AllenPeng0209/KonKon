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

interface MusicStaffViewProps {
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

const MusicStaffView: React.FC<MusicStaffViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const bounceAnimations = useRef<Map<string, Animated.Value>>(new Map());

  // 音符配置
  const noteConfig = {
    high: { symbol: '♪', color: '#FF6B6B', size: 20, position: 1 }, // 高音區
    medium: { symbol: '♫', color: '#4ECDC4', size: 18, position: 3 }, // 中音區
    low: { symbol: '♩', color: '#45B7D1', size: 16, position: 5 }, // 低音區
  };

  // 樂器圖標配置
  const instrumentIcons = {
    'work': '🎼',
    'personal': '🎵',
    'meeting': '🎺',
    'reminder': '🔔',
    'celebration': '🎉',
    'health': '🎭',
    'education': '📝',
    'travel': '🎸'
  };

  // 獲取音符配置
  const getNoteConfig = (importance: string = 'medium') => {
    return noteConfig[importance as keyof typeof noteConfig] || noteConfig.medium;
  };

  // 獲取樂器圖標
  const getInstrumentIcon = (event: Event) => {
    const category = event.category?.toLowerCase() || 'personal';
    return instrumentIcons[category as keyof typeof instrumentIcons] || '🎵';
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
          bounceAnimations.current.set(event.id, new Animated.Value(0));
        }
      });
    });

    // 音符出現動畫（像音符從天而降）
    const animations = Array.from(animationValues.current.values()).map((value, index) =>
      Animated.spring(value, {
        toValue: 1,
        delay: index * 100,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      })
    );

    // 音符跳動動畫
    const bounceAnimationList = Array.from(bounceAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 800 + Math.random() * 400,
            easing: Easing.sin,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 800 + Math.random() * 400,
            easing: Easing.sin,
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel([...animations, ...bounceAnimationList]).start();
  }, [selectedDate, events]);

  // 生成五線譜
  const generateMusicStaff = () => {
    const staffLines: React.ReactElement[] = [];
    const lineSpacing = 40;
    const numberOfStaffs = 5; // 5個五線譜段落

    // 創建五線譜線條
    for (let staffIndex = 0; staffIndex < numberOfStaffs; staffIndex++) {
      for (let lineIndex = 0; lineIndex < 5; lineIndex++) {
        staffLines.push(
          <View
            key={`staff-${staffIndex}-${lineIndex}`}
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              top: 60 + staffIndex * 150 + lineIndex * lineSpacing,
              height: 2,
              backgroundColor: '#333',
              opacity: 0.8,
            }}
          />
        );
      }

      // 添加五線譜左側的譜號
      staffLines.push(
        <View
          key={`clef-${staffIndex}`}
          style={{
            position: 'absolute',
            left: 25,
            top: 50 + staffIndex * 150,
            width: 30,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F5F5F5',
            borderRadius: 15,
            borderWidth: 2,
            borderColor: '#333',
          }}
        >
          <Text style={{ fontSize: 24, color: '#333' }}>
            𝄞
          </Text>
        </View>
      );
    }

    return staffLines;
  };

  // 生成音符
  const generateNotes = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const notes: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      
      dayEvents.forEach((event, eventIndex) => {
        const noteConf = getNoteConfig(event.importance);
        const icon = getInstrumentIcon(event);
        
        // 計算音符位置
        const weekIndex = Math.floor(dayIndex / 7);
        const dayOfWeek = dayIndex % 7;
        const baseX = 60 + dayOfWeek * ((screenWidth - 80) / 7);
        const baseY = 60 + weekIndex * 150 + (noteConf.position * 20);

        const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
        const bounceValue = bounceAnimations.current.get(event.id) || new Animated.Value(0);

        const scale = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        const bounce = bounceValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        });

        notes.push(
          <Animated.View
            key={event.id}
            style={{
              position: 'absolute',
              left: baseX,
              top: baseY + eventIndex * 25,
              transform: [
                { scale },
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
                borderRadius: 20,
                padding: 5,
                borderWidth: 2,
                borderColor: noteConf.color,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 3,
              }}
            >
              {/* 樂器圖標 */}
              <Text style={{ fontSize: 12, marginBottom: 2 }}>
                {icon}
              </Text>
              
              {/* 音符符號 */}
              <Text style={{ 
                fontSize: noteConf.size, 
                color: noteConf.color,
                fontWeight: 'bold'
              }}>
                {noteConf.symbol}
              </Text>
              
              {/* 事件標題 */}
              <Text style={{ 
                fontSize: 8, 
                color: '#333',
                textAlign: 'center',
                maxWidth: 50,
                marginTop: 2
              }} numberOfLines={1}>
                {event.title}
              </Text>
              
              {/* 日期標示 */}
              <Text style={{ 
                fontSize: 6, 
                color: '#666',
                fontWeight: 'bold'
              }}>
                {day.getDate()}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

        // 添加音符尾巴（裝飾性）
        if (noteConf.symbol === '♪' || noteConf.symbol === '♫') {
          notes.push(
            <View
              key={`tail-${event.id}`}
              style={{
                position: 'absolute',
                left: baseX + 25,
                top: baseY + eventIndex * 25 - 10,
                width: 2,
                height: 30,
                backgroundColor: noteConf.color,
                borderRadius: 1,
              }}
            />
          );
        }
      });
    });

    return notes;
  };

  // 生成音樂裝飾
  const generateMusicDecorations = () => {
    const decorations: React.ReactElement[] = [];
    const musicSymbols = ['♪', '♫', '♩', '♬', '𝄞', '𝄢'];
    
    for (let i = 0; i < 10; i++) {
      decorations.push(
        <View
          key={`music-decor-${i}`}
          style={{
            position: 'absolute',
            left: Math.random() * (screenWidth - 40) + 20,
            top: Math.random() * 100 + 20,
            opacity: 0.1,
          }}
        >
          <Text style={{ 
            fontSize: 30 + Math.random() * 20,
            color: '#4ECDC4'
          }}>
            {musicSymbols[Math.floor(Math.random() * musicSymbols.length)]}
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
          🎼 音樂日曆 - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: '#ECF0F1' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 音符圖例 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 12,
        backgroundColor: '#ECF0F1',
        gap: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#FF6B6B', marginRight: 5 }}>♪</Text>
          <Text style={{ fontSize: 12, color: '#2C3E50' }}>高音(重要)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#4ECDC4', marginRight: 5 }}>♫</Text>
          <Text style={{ fontSize: 12, color: '#2C3E50' }}>中音(普通)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#45B7D1', marginRight: 5 }}>♩</Text>
          <Text style={{ fontSize: 12, color: '#2C3E50' }}>低音(輕鬆)</Text>
        </View>
      </View>

      {/* 五線譜區域 */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#F8F9FA' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          minHeight: 800, 
          position: 'relative',
          paddingBottom: 50
        }}>
          {/* 背景音樂裝飾 */}
          {generateMusicDecorations()}
          
          {/* 五線譜 */}
          {generateMusicStaff()}
          
          {/* 週標題 */}
          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 60,
            paddingVertical: 10,
            marginTop: 20
          }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <View key={index} style={{ 
                flex: 1, 
                alignItems: 'center',
                backgroundColor: '#2C3E50',
                marginHorizontal: 1,
                paddingVertical: 5,
                borderRadius: 3
              }}>
                <Text style={{ fontWeight: 'bold', color: '#ECF0F1', fontSize: 12 }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          {/* 音符 */}
          {generateNotes()}
        </View>

        {/* 樂曲信息卡片 */}
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
          borderLeftColor: '#4ECDC4',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>
              🎵
            </Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>
              本月樂章統計
            </ThemedText>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FF6B6B' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'high'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>高音樂章</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4ECDC4' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'medium'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>中音旋律</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#45B7D1' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'low'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>低音伴奏</Text>
            </View>
          </View>

          {/* 樂器統計 */}
          <View style={{ marginTop: 15 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2C3E50', marginBottom: 10 }}>
              本月樂器演奏
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(instrumentIcons).map(([category, icon]) => {
                const count = events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.category?.toLowerCase() === category
                ).length;
                
                if (count === 0) return null;
                
                return (
                  <View 
                    key={category}
                    style={{
                      backgroundColor: '#F1C40F20',
                      borderRadius: 15,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 5 }}>
                      {icon}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#2C3E50', fontWeight: 'bold' }}>
                      {count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              這個月您創作了一首包含 {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length} 個音符的美妙樂章！
              每個音符都是生活中珍貴的回憶 🎶✨
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default MusicStaffView; 