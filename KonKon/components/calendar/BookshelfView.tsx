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

interface BookshelfViewProps {
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

const BookshelfView: React.FC<BookshelfViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const shakeAnimations = useRef<Map<string, Animated.Value>>(new Map());

  // 書籍顏色配置
  const bookColors = [
    '#8B4513', '#CD853F', '#D2691E', '#F4A460', '#DEB887',
    '#4B0082', '#9370DB', '#8A2BE2', '#7B68EE', '#6A5ACD',
    '#2E8B57', '#3CB371', '#20B2AA', '#48D1CC', '#00CED1',
    '#DC143C', '#B22222', '#CD5C5C', '#F08080', '#FA8072'
  ];

  // 根據重要性獲取書本厚度
  const getBookThickness = (importance: string = 'medium') => {
    switch (importance) {
      case 'high': return 25;
      case 'medium': return 18;
      case 'low': return 12;
      default: return 18;
    }
  };

  // 獲取書本顏色
  const getBookColor = (event: Event) => {
    if (event.color) return event.color;
    const colorIndex = event.category ? event.category.length % bookColors.length : 
                      event.title.length % bookColors.length;
    return bookColors[colorIndex];
  };

  // 獲取書本類型圖標
  const getBookIcon = (event: Event) => {
    const categories = {
      'work': '💼',
      'personal': '👤',
      'meeting': '👥',
      'reminder': '⏰',
      'celebration': '🎉',
      'health': '🏥',
      'education': '🎓',
      'travel': '✈️'
    };
    
    const category = event.category?.toLowerCase() || 'personal';
    return categories[category as keyof typeof categories] || '📖';
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
          shakeAnimations.current.set(event.id, new Animated.Value(0));
        }
      });
    });

    // 書本下滑出現動畫
    const animations = Array.from(animationValues.current.values()).map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 600 + index * 100,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      })
    );

    // 隨機搖晃動畫
    const shakeAnimationList = Array.from(shakeAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(Math.random() * 5000),
          Animated.timing(value, {
            toValue: 1,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel([...animations, ...shakeAnimationList]).start();
  }, [selectedDate, events]);

  // 生成書架
  const generateBookshelf = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const shelves: React.ReactElement[] = [];
    const booksPerShelf = 7; // 一週為一層書架
    const shelfHeight = 120;

    // 計算需要多少層書架
    const numberOfShelves = Math.ceil(daysInMonth.length / booksPerShelf);

    for (let shelfIndex = 0; shelfIndex < numberOfShelves; shelfIndex++) {
      const shelfDays = daysInMonth.slice(
        shelfIndex * booksPerShelf, 
        (shelfIndex + 1) * booksPerShelf
      );

      // 書架背板
      shelves.push(
        <View
          key={`shelf-${shelfIndex}`}
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            top: 50 + shelfIndex * shelfHeight,
            height: 80,
            backgroundColor: '#8B4513',
            borderRadius: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 5,
          }}
        />
      );

      // 書架底板
      shelves.push(
        <View
          key={`shelf-bottom-${shelfIndex}`}
          style={{
            position: 'absolute',
            left: 15,
            right: 15,
            top: 125 + shelfIndex * shelfHeight,
            height: 8,
            backgroundColor: '#654321',
            borderRadius: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 6,
          }}
        />
      );

      // 添加書籍
      let currentX = 25;
      shelfDays.forEach((day: Date, dayIndex: number) => {
        const dayEvents = events.filter(event => isSameDay(event.date, day));
        
        if (dayEvents.length === 0) {
          // 沒有事件時顯示空書位或裝飾品
          shelves.push(
            <View
              key={`empty-${shelfIndex}-${dayIndex}`}
              style={{
                position: 'absolute',
                left: currentX,
                top: 100 + shelfIndex * shelfHeight,
                width: 30,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, opacity: 0.3 }}>
                {Math.random() > 0.5 ? '📚' : '🕯️'}
              </Text>
            </View>
          );
          currentX += 35;
        } else {
          // 有事件時顯示書籍
          dayEvents.forEach((event, eventIndex) => {
            const thickness = getBookThickness(event.importance);
            const color = getBookColor(event);
            const icon = getBookIcon(event);
            
            const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
            const shakeValue = shakeAnimations.current.get(event.id) || new Animated.Value(0);

            const translateY = animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-100, 0],
            });

            const shake = shakeValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 3],
            });

            shelves.push(
              <Animated.View
                key={event.id}
                style={{
                  position: 'absolute',
                  left: currentX,
                  top: 55 + shelfIndex * shelfHeight,
                  width: thickness,
                  height: 70,
                  transform: [
                    { translateY },
                    { translateX: shake }
                  ],
                }}
              >
                <TouchableOpacity
                  onPress={() => onEventPress(event)}
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: color,
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#333',
                    shadowColor: '#000',
                    shadowOffset: { width: 1, height: 1 },
                    shadowOpacity: 0.3,
                    shadowRadius: 2,
                    elevation: 3,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 4,
                  }}
                >
                  {/* 書脊上的圖標 */}
                  <Text style={{ fontSize: 12 }}>
                    {icon}
                  </Text>
                  
                  {/* 書名（縱向） */}
                  <View style={{ 
                    flex: 1, 
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [{ rotate: '90deg' }]
                  }}>
                    <Text 
                      style={{ 
                        fontSize: Math.min(thickness / 3, 10),
                        color: 'white',
                        fontWeight: 'bold',
                        textShadowColor: '#000',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 1,
                      }}
                      numberOfLines={1}
                    >
                      {event.title.length > 8 ? 
                        `${event.title.substring(0, 6)}...` : 
                        event.title
                      }
                    </Text>
                  </View>

                  {/* 書本日期標籤 */}
                  <Text style={{ 
                    fontSize: 8, 
                    color: 'white',
                    fontWeight: 'bold',
                    textShadowColor: '#000',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 1,
                  }}>
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );

            currentX += thickness + 2;
          });
        }
      });
    }

    return shelves;
  };

  // 生成書架裝飾
  const generateDecorations = () => {
    const decorations: React.ReactElement[] = [];
    
    // 添加一些裝飾元素
    for (let i = 0; i < 5; i++) {
      const decorItems = ['🕰️', '🖼️', '🌱', '📜', '🔍'];
      decorations.push(
        <View
          key={`decor-${i}`}
          style={{
            position: 'absolute',
            left: 30 + Math.random() * (screenWidth - 100),
            top: 30 + Math.random() * 50,
            opacity: 0.6,
          }}
        >
          <Text style={{ fontSize: 20 }}>
            {decorItems[Math.floor(Math.random() * decorItems.length)]}
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
        backgroundColor: '#8B4513',
        borderBottomWidth: 1,
        borderBottomColor: '#654321'
      }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
        >
          <Text style={{ fontSize: 24, color: '#F5DEB3' }}>‹</Text>
        </TouchableOpacity>
        
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#F5DEB3' }}>
          📚 私人圖書館 - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: '#F5DEB3' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 圖例 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 10,
        backgroundColor: '#F5DEB3',
        gap: 15
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 20,
            height: 12,
            backgroundColor: '#8B4513',
            marginRight: 5,
            borderRadius: 2
          }} />
          <Text style={{ fontSize: 12, color: '#8B4513' }}>厚書(高)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 15,
            height: 12,
            backgroundColor: '#CD853F',
            marginRight: 5,
            borderRadius: 2
          }} />
          <Text style={{ fontSize: 12, color: '#8B4513' }}>中書(中)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 10,
            height: 12,
            backgroundColor: '#DEB887',
            marginRight: 5,
            borderRadius: 2
          }} />
          <Text style={{ fontSize: 12, color: '#8B4513' }}>薄書(低)</Text>
        </View>
      </View>

      {/* 書架區域 */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#F5F5DC' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          minHeight: 600, 
          position: 'relative',
          paddingBottom: 50
        }}>
          {/* 背景裝飾 */}
          {generateDecorations()}
          
          {/* 書架和書籍 */}
          {generateBookshelf()}
        </View>

        {/* 圖書館信息卡片 */}
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
          borderLeftColor: '#8B4513',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>
              📚
            </Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>
              本月藏書統計
            </ThemedText>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8B4513' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'high'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>厚書典藏</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#CD853F' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'medium'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>中型藏書</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#DEB887' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'low'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>輕薄讀物</Text>
            </View>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              您的私人圖書館本月收藏了 {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length} 本珍貴書籍
              每一本都記錄著生活的美好時光 📖✨
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default BookshelfView; 