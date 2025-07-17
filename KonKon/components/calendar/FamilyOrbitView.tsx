import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';
import { useFamily } from '../../contexts/FamilyContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MemberOrbit {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  angle: number;
  radius: number;
  animatedValue: Animated.Value;
}

export default function FamilyOrbitView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
  onMonthChange,
}: CalendarViewProps) {
  const { familyMembers } = useFamily();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberOrbits, setMemberOrbits] = useState<MemberOrbit[]>([]);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 成员颜色配置
  const memberColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  useEffect(() => {
    initializeMemberOrbits();
    startRotationAnimation();
    startPulseAnimation();
  }, [familyMembers]);

  const initializeMemberOrbits = () => {
    const centerX = screenWidth / 2;
    const centerY = screenHeight * 0.4;
    const baseRadius = Math.min(screenWidth, screenHeight) * 0.25;

    const orbits = familyMembers.map((member, index) => {
      const angle = (index * 360) / familyMembers.length;
      const radius = baseRadius + (index % 2) * 30; // 交错轨道距离
      
      return {
        id: member.user_id,
        name: member.user?.display_name || member.user?.email || '未知用户',
        avatar: member.user?.avatar_url,
        color: memberColors[index % memberColors.length],
        angle,
        radius,
        animatedValue: new Animated.Value(0),
      };
    });

    setMemberOrbits(orbits);

    // 启动成员入场动画
    orbits.forEach((orbit, index) => {
      Animated.timing(orbit.animatedValue, {
        toValue: 1,
        duration: 800,
        delay: index * 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const startRotationAnimation = () => {
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 30000, // 30秒一圈
        useNativeDriver: true,
      })
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
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

  const handleMemberPress = (memberId: string) => {
    setSelectedMember(selectedMember === memberId ? null : memberId);
  };

  const renderMemberOrbit = (orbit: MemberOrbit, index: number) => {
    const memberEvents = getMemberEvents(orbit.id);
    const isSelected = selectedMember === orbit.id;
    
    const rotation = rotationAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [`${orbit.angle * Math.PI / 180}rad`, `${(orbit.angle + 360) * Math.PI / 180}rad`],
    });

    const counterRotation = rotationAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [`${-orbit.angle * Math.PI / 180}rad`, `${-(orbit.angle + 360) * Math.PI / 180}rad`],
    });

    const scale = orbit.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const opacity = orbit.animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.7, 1],
    });

    return (
      <Animated.View
        key={orbit.id}
        style={[
          styles.orbitContainer,
          {
            transform: [
              { rotate: rotation },
              { translateX: orbit.radius },
              { rotate: counterRotation },
              { scale },
            ],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.memberOrb,
            { 
              backgroundColor: orbit.color,
              borderWidth: isSelected ? 4 : 2,
              borderColor: isSelected ? '#FFD700' : '#FFFFFF',
            },
          ]}
          onPress={() => handleMemberPress(orbit.id)}
        >
          <Text style={styles.memberInitial}>
            {orbit.name.charAt(0).toUpperCase()}
          </Text>
          {memberEvents.length > 0 && (
            <View style={[styles.eventBadge, { backgroundColor: orbit.color }]}>
              <Text style={styles.eventBadgeText}>{memberEvents.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.memberName, { color: orbit.color }]}>
          {orbit.name.length > 6 ? orbit.name.substring(0, 6) + '...' : orbit.name}
        </Text>
      </Animated.View>
    );
  };

  const displayEvents = selectedMember ? getMemberEvents(selectedMember) : getAllTodayEvents();
  const selectedMemberInfo = memberOrbits.find(orbit => orbit.id === selectedMember);

  return (
    <View style={styles.container}>
      {/* 标题区域 */}
      <View style={styles.header}>
        <Animated.Text 
          style={[
            styles.title,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          🌍 家庭轨道
        </Animated.Text>
        <Text style={styles.subtitle}>
          {formatSelectedDate()} · {familyMembers.length}位成员
        </Text>
        {selectedMember && selectedMemberInfo && (
          <Text style={[styles.selectedMemberText, { color: selectedMemberInfo.color }]}>
            查看 {selectedMemberInfo.name} 的日程
          </Text>
        )}
      </View>

      {/* 中央轨道区域 */}
      <View style={styles.orbitSpace}>
        {/* 中心太阳 */}
        <Animated.View 
          style={[
            styles.centerSun,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Text style={styles.sunEmoji}>☀️</Text>
          <Text style={styles.sunText}>家庭</Text>
        </Animated.View>

        {/* 轨道线 */}
        {memberOrbits.map((orbit, index) => (
          <View
            key={`orbit-${index}`}
            style={[
              styles.orbitLine,
              {
                width: orbit.radius * 2,
                height: orbit.radius * 2,
                borderRadius: orbit.radius,
                borderColor: `${orbit.color}30`,
              },
            ]}
          />
        ))}

        {/* 成员轨道 */}
        {memberOrbits.map((orbit, index) => renderMemberOrbit(orbit, index))}
      </View>

      {/* 事件列表区域 */}
      <ScrollView style={styles.eventsSection} showsVerticalScrollIndicator={false}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsTitle}>
            {selectedMember ? '个人日程' : '今日全部日程'}
          </Text>
          {selectedMember && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSelectedMember(null)}
            >
              <Text style={styles.clearButtonText}>查看全部</Text>
            </TouchableOpacity>
          )}
        </View>

        {displayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌌</Text>
            <Text style={styles.emptyTitle}>
              {selectedMember ? '今天没有个人日程' : '今天暂无家庭日程'}
            </Text>
            <Text style={styles.emptyDescription}>享受自由时光</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {displayEvents.map((event, index) => {
              const creatorOrbit = memberOrbits.find(orbit => orbit.id === event.creator_id);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventCard,
                    { 
                      borderLeftColor: creatorOrbit?.color || '#999',
                      backgroundColor: selectedMember ? `${creatorOrbit?.color}10` : '#FFFFFF',
                    },
                  ]}
                  onPress={() => onEventPress(event)}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTime}>{formatTime(event.start_ts)}</Text>
                    {!selectedMember && creatorOrbit && (
                      <View style={[styles.creatorBadge, { backgroundColor: creatorOrbit.color }]}>
                        <Text style={styles.creatorText}>
                          {creatorOrbit.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  
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
    backgroundColor: '#0A0E1A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2F3E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A92B2',
    marginBottom: 4,
  },
  selectedMemberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orbitSpace: {
    height: screenHeight * 0.5,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0E1A',
  },
  centerSun: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    zIndex: 100,
  },
  sunEmoji: {
    fontSize: 24,
  },
  sunText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1F2E',
  },
  orbitLine: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  orbitContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  memberOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    position: 'relative',
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eventBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  memberName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
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
    backgroundColor: '#3B82F6',
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
  creatorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
}); 