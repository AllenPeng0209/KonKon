import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';
import { useFamily } from '../../contexts/FamilyContext';

const { width: screenWidth } = Dimensions.get('window');

interface PlantMember {
  id: string;
  name: string;
  plantType: string;
  plantEmoji: string;
  flowerEmoji: string;
  position: { x: number; y: number };
  color: string;
  animatedValue: Animated.Value;
  bloomValue: Animated.Value;
  swayValue: Animated.Value;
}

export default function FamilyGardenView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
  onMonthChange,
}: CalendarViewProps) {
  const { familyMembers } = useFamily();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [plantMembers, setPlantMembers] = useState<PlantMember[]>([]);
  const [gardenMode, setGardenMode] = useState<'overview' | 'member'>('overview');
  const sunAnim = useRef(new Animated.Value(0)).current;
  const cloudAnim = useRef(new Animated.Value(0)).current;

  // 植物类型配置
  const plantTypes = [
    { type: 'rose', emoji: '🌹', flower: '🌹', name: '玫瑰' },
    { type: 'sunflower', emoji: '🌻', flower: '🌻', name: '向日葵' },
    { type: 'tulip', emoji: '🌷', flower: '🌷', name: '郁金香' },
    { type: 'cherry', emoji: '🌸', flower: '🌸', name: '樱花' },
    { type: 'lily', emoji: '🪷', flower: '🪷', name: '荷花' },
    { type: 'hibiscus', emoji: '🌺', flower: '🌺', name: '木槿花' },
    { type: 'daisy', emoji: '🌼', flower: '🌼', name: '雏菊' },
    { type: 'blossom', emoji: '💐', flower: '💐', name: '花束' },
  ];

  // 植物颜色配置
  const plantColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  useEffect(() => {
    initializeGarden();
    startEnvironmentAnimations();
  }, [familyMembers]);

  const initializeGarden = () => {
    const gardenWidth = screenWidth - 40;
    const gardenHeight = 300;
    
    const plants = familyMembers.map((member, index) => {
      const plantType = plantTypes[index % plantTypes.length];
      const row = Math.floor(index / 3);
      const col = index % 3;
      const spacing = gardenWidth / 3;
      
      // 添加一些随机偏移让花园更自然
      const randomOffsetX = (Math.random() - 0.5) * 30;
      const randomOffsetY = (Math.random() - 0.5) * 20;
      
      return {
        id: member.user_id,
        name: member.user?.display_name || member.user?.email || '未知用户',
        plantType: plantType.type,
        plantEmoji: plantType.emoji,
        flowerEmoji: plantType.flower,
        position: {
          x: col * spacing + spacing / 2 + randomOffsetX,
          y: row * 100 + 80 + randomOffsetY,
        },
        color: plantColors[index % plantColors.length],
        animatedValue: new Animated.Value(0),
        bloomValue: new Animated.Value(0),
        swayValue: new Animated.Value(0),
      };
    });

    setPlantMembers(plants);

    // 启动植物生长动画
    plants.forEach((plant, index) => {
      // 生长动画
      Animated.timing(plant.animatedValue, {
        toValue: 1,
        duration: 1000,
        delay: index * 200,
        useNativeDriver: true,
      }).start();

      // 开花动画
      setTimeout(() => {
        Animated.timing(plant.bloomValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, index * 200 + 1000);

      // 摇摆动画
      setTimeout(() => {
        startSwayAnimation(plant);
      }, index * 200 + 1500);
    });
  };

  const startSwayAnimation = (plant: PlantMember) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(plant.swayValue, {
          toValue: 1,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(plant.swayValue, {
          toValue: -1,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(plant.swayValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startEnvironmentAnimations = () => {
    // 太阳动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(sunAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 云朵动画
    Animated.loop(
      Animated.timing(cloudAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  };

  const getMemberEvents = (memberId: string) => {
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime() && 
             event.creator_id === memberId;
    });
  };

  const getAllTodayEvents = () => {
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    }).sort((a, b) => a.start_ts - b.start_ts);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatSelectedDate = () => {
    const today = new Date().toISOString().split('T')[0];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    if (selectedDateStr === today) {
      return '今天';
    } else {
      return selectedDate.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
  };

  const handlePlantPress = (plantId: string) => {
    if (selectedMember === plantId) {
      setSelectedMember(null);
      setGardenMode('overview');
    } else {
      setSelectedMember(plantId);
      setGardenMode('member');
    }
  };

  const renderPlant = (plant: PlantMember, index: number) => {
    const memberEvents = getMemberEvents(plant.id);
    const isSelected = selectedMember === plant.id;
    
    const growthScale = plant.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const bloomScale = plant.bloomValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    });

    const swayRotation = plant.swayValue.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-0.1rad', '0rad', '0.1rad'],
    });

    const selectedScale = isSelected ? 1.2 : 1;

    return (
      <Animated.View
        key={plant.id}
        style={[
          styles.plantContainer,
          {
            left: plant.position.x,
            bottom: plant.position.y,
            transform: [
              { scale: growthScale },
              { rotate: swayRotation },
              { scale: selectedScale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.plantTouchArea}
          onPress={() => handlePlantPress(plant.id)}
        >
          {/* 植物茎干 */}
          <View style={[styles.plantStem, { backgroundColor: '#4ADE80' }]} />
          
          {/* 植物叶子 */}
          <View style={styles.plantLeaves}>
            <Text style={styles.leafEmoji}>🍃</Text>
          </View>

          {/* 花朵 - 根据事件数量显示 */}
          <Animated.View
            style={[
              styles.plantFlower,
              {
                transform: [{ scale: bloomScale }],
              },
            ]}
          >
            {memberEvents.length > 0 ? (
              <View style={styles.bloomingFlower}>
                <Text style={[styles.flowerEmoji, { fontSize: 24 + memberEvents.length * 2 }]}>
                  {plant.flowerEmoji}
                </Text>
                {memberEvents.length > 1 && (
                  <View style={styles.flowerCluster}>
                    {Array.from({ length: Math.min(memberEvents.length - 1, 3) }).map((_, i) => (
                      <Text key={i} style={[
                        styles.smallFlower,
                        {
                          position: 'absolute',
                          left: (i - 1) * 15,
                          top: i * 8,
                          fontSize: 16,
                        }
                      ]}>
                        {plant.flowerEmoji}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.budEmoji, { color: plant.color }]}>🌱</Text>
            )}
          </Animated.View>

          {/* 成员名字标签 */}
          <View style={[styles.nameTag, { backgroundColor: plant.color }]}>
            <Text style={styles.nameText} numberOfLines={1}>
              {plant.name.length > 4 ? plant.name.substring(0, 4) + '...' : plant.name}
            </Text>
          </View>

          {/* 事件数量徽章 */}
          {memberEvents.length > 0 && (
            <View style={[styles.eventBadge, { backgroundColor: plant.color }]}>
              <Text style={styles.eventBadgeText}>{memberEvents.length}</Text>
            </View>
          )}

          {/* 选中指示器 */}
          {isSelected && (
            <View style={styles.selectedRing}>
              <Text style={styles.selectedEmoji}>✨</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const displayEvents = selectedMember ? getMemberEvents(selectedMember) : getAllTodayEvents();
  const selectedPlantInfo = plantMembers.find(plant => plant.id === selectedMember);

  return (
    <View style={styles.container}>
      {/* 天空背景 */}
      <View style={styles.sky}>
        {/* 太阳 */}
        <Animated.View
          style={[
            styles.sun,
            {
              transform: [
                {
                  scale: sunAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                },
              ],
              opacity: sunAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ]}
        >
          <Text style={styles.sunEmoji}>☀️</Text>
        </Animated.View>

        {/* 云朵 */}
        <Animated.View
          style={[
            styles.cloud,
            {
              transform: [
                {
                  translateX: cloudAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, screenWidth + 50],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.cloudEmoji}>☁️</Text>
        </Animated.View>

        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>🌺 家庭花园</Text>
          <Text style={styles.subtitle}>
            {formatSelectedDate()} · {familyMembers.length}株植物
          </Text>
          {selectedMember && selectedPlantInfo && (
            <Text style={[styles.selectedMemberText, { color: selectedPlantInfo.color }]}>
              关注 {selectedPlantInfo.name} 的 {selectedPlantInfo.plantType}
            </Text>
          )}
        </View>
      </View>

      {/* 花园区域 */}
      <View style={styles.garden}>
        {/* 土壤 */}
        <View style={styles.soil}>
          <Text style={styles.soilPattern}>🌿🌱🌿🌸🌿🌱🌿</Text>
        </View>

        {/* 植物 */}
        {plantMembers.map((plant, index) => renderPlant(plant, index))}

        {/* 装饰元素 */}
        <View style={styles.decorations}>
          <Text style={styles.decorationEmoji}>🦋</Text>
          <Text style={[styles.decorationEmoji, { left: 100, top: 50 }]}>🐝</Text>
          <Text style={[styles.decorationEmoji, { left: 200, top: 30 }]}>🦋</Text>
        </View>
      </View>

      {/* 事件列表区域 */}
      <ScrollView style={styles.eventsSection} showsVerticalScrollIndicator={false}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsTitle}>
            {gardenMode === 'member' ? '个人花朵日程' : '花园全部日程'}
          </Text>
          {selectedMember && (
            <TouchableOpacity 
              style={[styles.clearButton, { backgroundColor: selectedPlantInfo?.color }]}
              onPress={() => {
                setSelectedMember(null);
                setGardenMode('overview');
              }}
            >
              <Text style={styles.clearButtonText}>查看花园</Text>
            </TouchableOpacity>
          )}
        </View>

        {displayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>
              {gardenMode === 'member' ? '今天没有绽放的花朵' : '花园今日静谧'}
            </Text>
            <Text style={styles.emptyDescription}>等待新的花朵绽放</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {displayEvents.map((event, index) => {
              const creatorPlant = plantMembers.find(plant => plant.id === event.creator_id);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventCard,
                    { 
                      borderLeftColor: creatorPlant?.color || '#4ADE80',
                      backgroundColor: selectedMember ? `${creatorPlant?.color}15` : '#FFFFFF',
                    },
                  ]}
                  onPress={() => onEventPress(event)}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTime}>{formatTime(event.start_ts)}</Text>
                    {!selectedMember && creatorPlant && (
                      <View style={styles.creatorInfo}>
                        <Text style={styles.creatorFlower}>{creatorPlant.flowerEmoji}</Text>
                        <Text style={styles.creatorName}>
                          {creatorPlant.name}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.eventTitle}>🌸 {event.title}</Text>
                  
                  {event.description && (
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                  
                  {event.location && (
                    <View style={styles.eventLocation}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>{event.location}</Text>
                    </View>
                  )}

                  {/* 花朵装饰 */}
                  <View style={styles.eventFlowerDecor}>
                    <Text style={styles.flowerDecorEmoji}>🌺</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // 天空蓝
  },
  sky: {
    height: 180,
    position: 'relative',
  },
  sun: {
    position: 'absolute',
    top: 20,
    right: 30,
  },
  sunEmoji: {
    fontSize: 32,
  },
  cloud: {
    position: 'absolute',
    top: 40,
    left: 0,
  },
  cloudEmoji: {
    fontSize: 24,
  },
  header: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  selectedMemberText: {
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  garden: {
    height: 320,
    position: 'relative',
    backgroundColor: '#90EE90', // 草地绿
  },
  soil: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soilPattern: {
    fontSize: 16,
    opacity: 0.6,
  },
  plantContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
    height: 120,
  },
  plantTouchArea: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  plantStem: {
    width: 4,
    height: 50,
    position: 'absolute',
    bottom: 0,
    borderRadius: 2,
  },
  plantLeaves: {
    position: 'absolute',
    bottom: 25,
    left: -10,
  },
  leafEmoji: {
    fontSize: 14,
    transform: [{ rotate: '45deg' }],
  },
  plantFlower: {
    position: 'absolute',
    bottom: 45,
    alignItems: 'center',
  },
  bloomingFlower: {
    alignItems: 'center',
    position: 'relative',
  },
  flowerEmoji: {
    fontSize: 24,
  },
  flowerCluster: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  smallFlower: {
    fontSize: 16,
  },
  budEmoji: {
    fontSize: 16,
  },
  nameTag: {
    position: 'absolute',
    bottom: -25,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 40,
  },
  nameText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  eventBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectedRing: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  selectedEmoji: {
    fontSize: 16,
    position: 'absolute',
    top: -10,
  },
  decorations: {
    position: 'absolute',
    top: 20,
    left: 50,
  },
  decorationEmoji: {
    fontSize: 16,
    position: 'absolute',
  },
  eventsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  clearButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  eventsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorFlower: {
    fontSize: 14,
    marginRight: 4,
  },
  creatorName: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventFlowerDecor: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  flowerDecorEmoji: {
    fontSize: 12,
    opacity: 0.3,
  },
}); 