import React, { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

interface PlantEvent {
  id: string;
  event: any;
  plantType: string;
  growthStage: number; // 0-4
  x: number;
  y: number;
  scale: Animated.Value;
  isWilted: boolean;
}

const PLANT_TYPES = [
  { type: 'flower', stages: ['🌱', '🌿', '🌸', '🌺', '🥀'], color: '#ff6b9d' },
  { type: 'tree', stages: ['🌱', '🌿', '🌳', '🌲', '🍂'], color: '#4ecdc4' },
  { type: 'fruit', stages: ['🌱', '🌿', '🌼', '🍎', '🍎'], color: '#ffe66d' },
  { type: 'herb', stages: ['🌱', '🌿', '🍃', '🌿', '🍂'], color: '#95e1d3' },
  { type: 'rose', stages: ['🌱', '🌿', '🥀', '🌹', '🥀'], color: '#ffa8a8' },
];

export default function GardenPlantView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  const [plants, setPlants] = useState<PlantEvent[]>([]);
  const [selectedPlantType, setSelectedPlantType] = useState<string>('all');

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

  // 根據事件類型決定植物類型
  const getPlantType = (event: any): string => {
    const title = event.title.toLowerCase();
    if (title.includes('會議') || title.includes('工作')) {
      return 'tree';
    } else if (title.includes('運動') || title.includes('健身')) {
      return 'herb';
    } else if (title.includes('約會') || title.includes('愛情')) {
      return 'rose';
    } else if (title.includes('學習') || title.includes('成長')) {
      return 'fruit';
    }
    return 'flower';
  };

  // 計算事件的生長階段
  const getGrowthStage = (event: any): number => {
    const now = Date.now() / 1000;
    const eventTime = event.start_ts;
    const timeDiff = now - eventTime;
    
    // 事件開始前：種子階段 (0)
    if (timeDiff < 0) return 0;
    
    // 事件進行中或剛結束：生長階段 (1-3)
    const hoursAfter = timeDiff / 3600;
    if (hoursAfter < 1) return 1;
    if (hoursAfter < 6) return 2;
    if (hoursAfter < 24) return 3;
    
    // 事件結束很久：成熟階段 (4) 或凋謝
    return 4;
  };

  // 判斷植物是否凋謝
  const isPlantWilted = (event: any): boolean => {
    const now = Date.now() / 1000;
    const eventTime = event.start_ts;
    const daysAfter = (now - eventTime) / (24 * 3600);
    
    // 超過3天的事件開始凋謝
    return daysAfter > 3;
  };

  // 生成植物
  useEffect(() => {
    const selectedEvents = getSelectedDateEvents();
    
    const newPlants: PlantEvent[] = selectedEvents.map((event, index) => {
      const plantTypeId = getPlantType(event);
      const growthStage = getGrowthStage(event);
      const isWilted = isPlantWilted(event);
      
      // 隨機分佈在花園中
      const x = 20 + (index % 3) * 100 + Math.random() * 50;
      const y = 100 + Math.floor(index / 3) * 120 + Math.random() * 40;
      
      return {
        id: event.id || `plant-${index}`,
        event,
        plantType: plantTypeId,
        growthStage: isWilted ? 4 : growthStage,
        x,
        y,
        scale: new Animated.Value(0.5 + growthStage * 0.1),
        isWilted,
      };
    });
    
    setPlants(newPlants);
    
    // 開始生長動畫
    newPlants.forEach((plant, index) => {
      startGrowthAnimation(plant, index);
    });
  }, [selectedDate, events]);

  // 植物生長動畫
  const startGrowthAnimation = (plant: PlantEvent, index: number) => {
    const delay = index * 300;
    const targetScale = plant.isWilted ? 0.3 : 0.8 + plant.growthStage * 0.1;
    
    setTimeout(() => {
      // 搖擺動畫
      const sway = () => {
        Animated.sequence([
          Animated.timing(plant.scale, {
            toValue: targetScale * 1.1,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: false,
          }),
          Animated.timing(plant.scale, {
            toValue: targetScale * 0.9,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setTimeout(sway, Math.random() * 3000);
        });
      };
      
      sway();
    }, delay);
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
      return '今日花園';
    } else {
      return selectedDate.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }) + ' 花園';
    }
  };

  // 過濾植物
  const getFilteredPlants = () => {
    if (selectedPlantType === 'all') {
      return plants;
    }
    return plants.filter(plant => plant.plantType === selectedPlantType);
  };

  // 渲染植物類型選擇器
  const renderPlantTypeSelector = () => (
    <ScrollView 
      horizontal 
      style={styles.typeSelector}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.typeSelectorContent}
    >
      <TouchableOpacity
        style={[
          styles.typeButton,
          selectedPlantType === 'all' && styles.typeButtonActive,
        ]}
        onPress={() => setSelectedPlantType('all')}
      >
        <Text style={styles.typeIcon}>🌼</Text>
        <Text style={styles.typeName}>全部植物</Text>
      </TouchableOpacity>
      
      {PLANT_TYPES.map(plantType => (
        <TouchableOpacity
          key={plantType.type}
          style={[
            styles.typeButton,
            selectedPlantType === plantType.type && styles.typeButtonActive,
            { backgroundColor: selectedPlantType === plantType.type ? plantType.color : '#ffffff' }
          ]}
          onPress={() => setSelectedPlantType(plantType.type)}
        >
          <Text style={styles.typeIcon}>{plantType.stages[2]}</Text>
          <Text style={styles.typeName}>
            {plantType.type === 'flower' ? '花朵' :
             plantType.type === 'tree' ? '樹木' :
             plantType.type === 'fruit' ? '果實' :
             plantType.type === 'herb' ? '香草' : '玫瑰'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // 渲染植物
  const renderPlant = (plant: PlantEvent) => {
    const plantTypeData = PLANT_TYPES.find(p => p.type === plant.plantType) || PLANT_TYPES[0];
    const plantEmoji = plantTypeData.stages[plant.growthStage] || plantTypeData.stages[0];

    return (
      <Animated.View
        key={plant.id}
        style={[
          styles.plantContainer,
          {
            left: plant.x,
            top: plant.y,
            transform: [{ scale: plant.scale }],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.plant,
            plant.isWilted && styles.wiltedPlant,
          ]}
          onPress={() => onEventPress && onEventPress(plant.event)}
        >
          <Text style={[
            styles.plantEmoji,
            plant.isWilted && styles.wiltedEmoji,
          ]}>
            {plantEmoji}
          </Text>
          
          {/* 植物信息卡片 */}
          <View style={[
            styles.plantInfo,
            { backgroundColor: plantTypeData.color + '20' }
          ]}>
            <Text style={styles.plantTime}>{formatTime(plant.event.start_ts)}</Text>
            <Text style={styles.plantTitle} numberOfLines={1}>
              {plant.event.title}
            </Text>
            <View style={styles.growthIndicator}>
              {Array.from({ length: 5 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.growthDot,
                    {
                      backgroundColor: i <= plant.growthStage ? plantTypeData.color : '#e0e0e0',
                    }
                  ]}
                />
              ))}
            </View>
          </View>
          
          {/* 水珠效果（最近澆水） */}
          {plant.growthStage >= 1 && !plant.isWilted && (
            <View style={styles.waterDrop}>
              <Text style={styles.waterDropEmoji}>💧</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 花園標題 */}
      <View style={styles.header}>
        <Text style={styles.title}>🌻 {formatSelectedDate()}</Text>
        <Text style={styles.subtitle}>
          {plants.length} 株植物正在生長
        </Text>
        <Text style={styles.weatherText}>☀️ 陽光充足，適合成長</Text>
      </View>

      {/* 植物類型選擇器 */}
      {renderPlantTypeSelector()}

      {/* 花園區域 */}
      <ScrollView 
        style={styles.gardenContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gardenContent}
      >
        {getFilteredPlants().length === 0 ? (
          <View style={styles.emptyGarden}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyText}>花園空空如也</Text>
            <Text style={styles.emptySubtext}>添加一些事件來種植花朵吧！</Text>
          </View>
        ) : (
          <View style={styles.garden}>
            {/* 土壤背景 */}
            <View style={styles.soil}>
              <Text style={styles.soilPattern}>
                🌱🌿🌱🌿🌱🌿🌱🌿🌱🌿{'\n'}
                🌿🌱🌿🌱🌿🌱🌿🌱🌿🌱{'\n'}
                🌱🌿🌱🌿🌱🌿🌱🌿🌱🌿
              </Text>
            </View>
            
            {/* 植物 */}
            {getFilteredPlants().map(renderPlant)}
          </View>
        )}
      </ScrollView>

      {/* 成長說明 */}
      <View style={styles.growthGuide}>
        <Text style={styles.guideTitle}>🌱 成長指南</Text>
        <View style={styles.guideItems}>
          <Text style={styles.guideItem}>🌱 事件開始前：種子期</Text>
          <Text style={styles.guideItem}>🌿 事件進行中：發芽期</Text>
          <Text style={styles.guideItem}>🌸 事件結束後：開花期</Text>
          <Text style={styles.guideItem}>🥀 超過3天：凋謝期</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e8',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#d4e6d4',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d5a2d',
  },
  subtitle: {
    fontSize: 14,
    color: '#5a7a5a',
    marginTop: 4,
  },
  weatherText: {
    fontSize: 12,
    color: '#7a8a7a',
    marginTop: 2,
  },
  typeSelector: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#d4e6d4',
  },
  typeSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d4e6d4',
  },
  typeButtonActive: {
    borderColor: '#5a7a5a',
  },
  typeIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  typeName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2d5a2d',
  },
  gardenContainer: {
    flex: 1,
  },
  gardenContent: {
    minHeight: 500,
  },
  emptyGarden: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5a7a5a',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7a8a7a',
    textAlign: 'center',
  },
  garden: {
    position: 'relative',
    minHeight: 500,
    margin: 16,
  },
  soil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: '#8B4513',
    opacity: 0.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soilPattern: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.3,
    textAlign: 'center',
  },
  plantContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  plant: {
    alignItems: 'center',
    position: 'relative',
  },
  wiltedPlant: {
    opacity: 0.6,
  },
  plantEmoji: {
    fontSize: 32,
  },
  wiltedEmoji: {
    filter: 'grayscale(100%)',
  },
  plantInfo: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  plantTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2d5a2d',
    marginBottom: 2,
  },
  plantTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d5a2d',
    textAlign: 'center',
    marginBottom: 4,
  },
  growthIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  growthDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  waterDrop: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  waterDropEmoji: {
    fontSize: 12,
  },
  growthGuide: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#d4e6d4',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d5a2d',
    marginBottom: 8,
    textAlign: 'center',
  },
  guideItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  guideItem: {
    fontSize: 10,
    color: '#5a7a5a',
    marginBottom: 2,
    width: '45%',
    textAlign: 'center',
  },
}); 