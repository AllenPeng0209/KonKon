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

interface KitchenRecipeViewProps {
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

const KitchenRecipeView: React.FC<KitchenRecipeViewProps> = ({
  events,
  currentDate,
  onDateSelect,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());
  const steamAnimations = useRef<Map<string, Animated.Value>>(new Map());

  // 料理類型配置
  const recipeConfig = {
    high: { 
      emoji: '🍽️', 
      color: '#E74C3C', 
      type: '主菜',
      container: '🍳',
      difficulty: '★★★'
    },
    medium: { 
      emoji: '🥗', 
      color: '#F39C12', 
      type: '配菜',
      container: '🥘',
      difficulty: '★★☆'
    },
    low: { 
      emoji: '🍰', 
      color: '#27AE60', 
      type: '甜點',
      container: '🧁',
      difficulty: '★☆☆'
    }
  };

  // 食材圖標配置
  const ingredientIcons = {
    'work': '☕',
    'personal': '🥄',
    'meeting': '🍕',
    'reminder': '⏰',
    'celebration': '🎂',
    'health': '🥬',
    'education': '📚',
    'travel': '🥡'
  };

  // 廚房用具
  const kitchenTools = ['🔪', '🥄', '🍴', '🥢', '🧂', '🫖', '🍳', '🥘'];

  // 獲取料理配置
  const getRecipeConfig = (importance: string = 'medium') => {
    return recipeConfig[importance as keyof typeof recipeConfig] || recipeConfig.medium;
  };

  // 獲取食材圖標
  const getIngredientIcon = (event: Event) => {
    const category = event.category?.toLowerCase() || 'personal';
    return ingredientIcons[category as keyof typeof ingredientIcons] || '🥄';
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
          steamAnimations.current.set(event.id, new Animated.Value(0));
        }
      });
    });

    // 料理出現動畫（像從烤箱中取出）
    const animations = Array.from(animationValues.current.values()).map((value, index) =>
      Animated.spring(value, {
        toValue: 1,
        delay: index * 150,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      })
    );

    // 蒸汽動畫
    const steamAnimationList = Array.from(steamAnimations.current.values()).map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel([...animations, ...steamAnimationList]).start();
  }, [selectedDate, events]);

  // 生成廚房背景
  const generateKitchenBackground = () => {
    const background: React.ReactElement[] = [];
    
    // 廚房瓷磚背景
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < Math.floor(screenWidth / 40); col++) {
        background.push(
          <View
            key={`tile-${row}-${col}`}
            style={{
              position: 'absolute',
              left: col * 40,
              top: row * 60 + 50,
              width: 38,
              height: 58,
              backgroundColor: (row + col) % 2 === 0 ? '#F8F9FA' : '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E9ECEF',
            }}
          />
        );
      }
    }

    // 廚房用具裝飾
    for (let i = 0; i < 8; i++) {
      background.push(
        <View
          key={`tool-${i}`}
          style={{
            position: 'absolute',
            left: 30 + Math.random() * (screenWidth - 80),
            top: 20 + Math.random() * 30,
            opacity: 0.3,
          }}
        >
          <Text style={{ fontSize: 20 }}>
            {kitchenTools[Math.floor(Math.random() * kitchenTools.length)]}
          </Text>
        </View>
      );
    }

    return background;
  };

  // 生成料理
  const generateRecipes = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval(monthStart, monthEnd);

    const recipes: React.ReactElement[] = [];
    
    daysInMonth.forEach((day: Date, dayIndex: number) => {
      const dayEvents = events.filter(event => isSameDay(event.date, day));
      
      if (dayEvents.length > 0) {
        // 計算位置（廚房檯面）
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = (col * (screenWidth - 40) / 7) + 20;
        const baseY = 100 + row * 120;

        dayEvents.forEach((event, eventIndex) => {
          const recipeConf = getRecipeConfig(event.importance);
          const ingredient = getIngredientIcon(event);
          
          const animValue = animationValues.current.get(event.id) || new Animated.Value(0);
          const steamValue = steamAnimations.current.get(event.id) || new Animated.Value(0);

          const scale = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const steamOpacity = steamValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.6],
          });

          const steamTranslateY = steamValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -15],
          });

          recipes.push(
            <Animated.View
              key={event.id}
              style={{
                position: 'absolute',
                left: baseX - 25,
                top: baseY + eventIndex * 30,
                transform: [{ scale }],
              }}
            >
              {/* 蒸汽效果 */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 20,
                  top: -10,
                  opacity: steamOpacity,
                  transform: [{ translateY: steamTranslateY }],
                }}
              >
                <Text style={{ fontSize: 16 }}>💨</Text>
              </Animated.View>

              <TouchableOpacity
                onPress={() => onEventPress(event)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 15,
                  padding: 10,
                  borderWidth: 3,
                  borderColor: recipeConf.color,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 5,
                  minWidth: 80,
                  alignItems: 'center',
                }}
              >
                {/* 容器 */}
                <Text style={{ fontSize: 20, marginBottom: 5 }}>
                  {recipeConf.container}
                </Text>
                
                {/* 料理主體 */}
                <View style={{
                  backgroundColor: recipeConf.color + '20',
                  borderRadius: 10,
                  padding: 8,
                  alignItems: 'center',
                  minWidth: 60,
                }}>
                  <Text style={{ fontSize: 16, marginBottom: 3 }}>
                    {recipeConf.emoji}
                  </Text>
                  <Text style={{ 
                    fontSize: 10, 
                    color: recipeConf.color,
                    fontWeight: 'bold'
                  }}>
                    {recipeConf.type}
                  </Text>
                </View>

                {/* 食材標籤 */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 5,
                  backgroundColor: '#F8F9FA',
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: 10, marginRight: 3 }}>
                    {ingredient}
                  </Text>
                  <Text style={{ 
                    fontSize: 8, 
                    color: '#666',
                    maxWidth: 40
                  }} numberOfLines={1}>
                    {event.title}
                  </Text>
                </View>

                {/* 難度等級 */}
                <Text style={{ 
                  fontSize: 8, 
                  color: recipeConf.color,
                  fontWeight: 'bold',
                  marginTop: 2
                }}>
                  {recipeConf.difficulty}
                </Text>

                {/* 日期標籤 */}
                <View style={{
                  backgroundColor: recipeConf.color,
                  borderRadius: 5,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  marginTop: 3,
                }}>
                  <Text style={{ 
                    fontSize: 8, 
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {day.getDate()}日
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        });
      } else {
        // 沒有事件時顯示空的廚具
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const baseX = (col * (screenWidth - 40) / 7) + 20;
        const baseY = 100 + row * 120;

        recipes.push(
          <View
            key={`empty-${dayIndex}`}
            style={{
              position: 'absolute',
              left: baseX - 10,
              top: baseY,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.3,
            }}
          >
            <Text style={{ fontSize: 20 }}>
              {kitchenTools[dayIndex % kitchenTools.length]}
            </Text>
          </View>
        );
      }
    });

    return recipes;
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
        borderBottomColor: '#A0522D'
      }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
        >
          <Text style={{ fontSize: 24, color: '#F5DEB3' }}>‹</Text>
        </TouchableOpacity>
        
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#F5DEB3' }}>
          👨‍🍳 美食廚房 - {formatYearMonth(selectedDate)}
        </ThemedText>
        
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
        >
          <Text style={{ fontSize: 24, color: '#F5DEB3' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 料理類型圖例 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 12,
        backgroundColor: '#F5DEB3',
        gap: 15
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 5 }}>🍽️</Text>
          <Text style={{ fontSize: 12, color: '#8B4513' }}>主菜(重要)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 5 }}>🥗</Text>
          <Text style={{ fontSize: 12, color: '#8B4513' }}>配菜(普通)</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 5 }}>🍰</Text>
          <Text style={{ fontSize: 12, color: '#8B4513' }}>甜點(輕鬆)</Text>
        </View>
      </View>

      {/* 廚房區域 */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#FFF8DC' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          minHeight: 700, 
          position: 'relative',
          paddingBottom: 50
        }}>
          {/* 廚房背景 */}
          {generateKitchenBackground()}
          
          {/* 週標題 */}
          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 20,
            paddingVertical: 10,
            marginTop: 20,
            backgroundColor: '#8B4513'
          }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <View key={index} style={{ 
                flex: 1, 
                alignItems: 'center',
                paddingVertical: 5
              }}>
                <Text style={{ fontWeight: 'bold', color: '#F5DEB3', fontSize: 12 }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          {/* 料理 */}
          {generateRecipes()}
        </View>

        {/* 廚房統計卡片 */}
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
              📊
            </Text>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>
              本月菜單統計
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
              <Text style={{ fontSize: 12, color: '#666' }}>主菜料理</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F39C12' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'medium'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>精緻配菜</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#27AE60' }}>
                {events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.importance === 'low'
                ).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>美味甜點</Text>
            </View>
          </View>

          {/* 食材統計 */}
          <View style={{ marginTop: 15 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#8B4513', marginBottom: 10 }}>
              本月使用食材
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(ingredientIcons).map(([category, icon]) => {
                const count = events.filter(e => 
                  e.date.getMonth() === selectedDate.getMonth() && 
                  e.category?.toLowerCase() === category
                ).length;
                
                if (count === 0) return null;
                
                return (
                  <View 
                    key={category}
                    style={{
                      backgroundColor: '#F39C1220',
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
                    <Text style={{ fontSize: 12, color: '#8B4513', fontWeight: 'bold' }}>
                      {count}份
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              本月您的廚房製作了 {events.filter(e => e.date.getMonth() === selectedDate.getMonth()).length} 道精美料理！
              每一道都充滿愛與溫暖 👨‍🍳❤️
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default KitchenRecipeView; 