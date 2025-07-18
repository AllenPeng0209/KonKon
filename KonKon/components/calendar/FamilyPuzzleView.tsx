import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';
import { useFamily } from '../../contexts/FamilyContext';

const { width: screenWidth } = Dimensions.get('window');

interface PuzzlePiece {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  shape: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  animatedValue: Animated.Value;
  expandedValue: Animated.Value;
}

export default function FamilyPuzzleView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
  onMonthChange,
}: CalendarViewProps) {
  const { familyMembers } = useFamily();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  // 拼图片颜色配置
  const puzzleColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#FFB6C1', '#20B2AA', '#87CEEB', '#DDA0DD'
  ];

  // 拼图形状路径
  const puzzleShapes = {
    'top-left': 'M10,10 Q30,0 50,10 Q60,30 50,50 Q30,60 10,50 Q0,30 10,10 Z',
    'top-right': 'M50,10 Q70,0 90,10 Q100,30 90,50 Q70,60 50,50 Q40,30 50,10 Z',
    'bottom-left': 'M10,50 Q30,40 50,50 Q60,70 50,90 Q30,100 10,90 Q0,70 10,50 Z',
    'bottom-right': 'M50,50 Q70,40 90,50 Q100,70 90,90 Q70,100 50,90 Q40,70 50,50 Z',
    'center': 'M30,30 Q50,20 70,30 Q80,50 70,70 Q50,80 30,70 Q20,50 30,30 Z'
  };

  useEffect(() => {
    initializePuzzlePieces();
    startGlowAnimation();
  }, [familyMembers]);

  const initializePuzzlePieces = () => {
    const pieceWidth = (screenWidth - 40) / 2; // 2列布局
    const pieceHeight = 120;
    
    const pieces = familyMembers.map((member, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const shapes = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
      
      return {
        id: member.user_id,
        name: member.user?.display_name || member.user?.email || '未知用户',
        color: puzzleColors[index % puzzleColors.length],
        position: {
          x: col * pieceWidth + 20,
          y: row * (pieceHeight + 10) + 20,
        },
        shape: shapes[index % shapes.length] as PuzzlePiece['shape'],
        animatedValue: new Animated.Value(0),
        expandedValue: new Animated.Value(0),
      };
    });

    setPuzzlePieces(pieces);

    // 启动拼图入场动画
    pieces.forEach((piece, index) => {
      Animated.timing(piece.animatedValue, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
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
    const targetDateString = selectedDate.toISOString().split('T')[0];
    
    return events.filter(event => {
      const eventDateString = new Date(event.start_ts * 1000).toISOString().split('T')[0];
      return eventDateString === targetDateString;
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

  const handlePiecePress = (pieceId: string) => {
    const piece = puzzlePieces.find(p => p.id === pieceId);
    if (!piece) return;

    if (selectedMember === pieceId) {
      // 关闭详情
      setSelectedMember(null);
      setShowDetails(false);
      Animated.timing(piece.expandedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // 关闭其他片段
      puzzlePieces.forEach(p => {
        if (p.id !== pieceId) {
          Animated.timing(p.expandedValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      });

      // 打开选中片段
      setSelectedMember(pieceId);
      setShowDetails(true);
      Animated.timing(piece.expandedValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  const renderPuzzlePiece = (piece: PuzzlePiece, index: number) => {
    const memberEvents = getMemberEvents(piece.id);
    const isSelected = selectedMember === piece.id;
    
    const scale = piece.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    const opacity = piece.animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1],
    });

    const expandScale = piece.expandedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.1],
    });

    const shadowOpacity = piece.expandedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.1, 0.3],
    });

    const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });

    return (
      <Animated.View
        key={piece.id}
        style={[
          styles.puzzlePiece,
          {
            left: piece.position.x,
            top: piece.position.y,
            backgroundColor: piece.color,
            transform: [
              { scale: scale },
              { scale: expandScale },
            ],
            opacity,
            shadowOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.pieceContent}
          onPress={() => handlePiecePress(piece.id)}
        >
          {/* 发光效果 */}
          {memberEvents.length > 0 && (
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  backgroundColor: piece.color,
                  opacity: glowOpacity,
                },
              ]}
            />
          )}

          {/* 拼图形状装饰 */}
          <View style={styles.puzzleCorner}>
            <Text style={styles.puzzleIcon}>🧩</Text>
          </View>

          {/* 成员信息 */}
          <View style={styles.memberInfo}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitial}>
                {piece.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            <Text style={styles.memberName} numberOfLines={2}>
              {piece.name}
            </Text>

            {/* 事件数量指示器 */}
            {memberEvents.length > 0 && (
              <View style={styles.eventIndicator}>
                <Text style={styles.eventCount}>{memberEvents.length}</Text>
                <Text style={styles.eventLabel}>个日程</Text>
              </View>
            )}

            {memberEvents.length === 0 && (
              <Text style={styles.noEventsText}>今日无安排</Text>
            )}
          </View>

          {/* 选中状态指示器 */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedIcon}>✨</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const displayEvents = selectedMember ? getMemberEvents(selectedMember) : getAllTodayEvents();
  const selectedMemberInfo = puzzlePieces.find(piece => piece.id === selectedMember);

  return (
    <View style={styles.container}>
      {/* 标题区域 */}
      <View style={styles.header}>
        <Text style={styles.title}>🧩 家庭拼图墙</Text>
        <Text style={styles.subtitle}>
          {formatSelectedDate()} · {familyMembers.length}块拼图
        </Text>
        {selectedMember && selectedMemberInfo && (
          <Text style={[styles.selectedMemberText, { color: selectedMemberInfo.color }]}>
            {selectedMemberInfo.name} 的拼图已展开
          </Text>
        )}
      </View>

      {/* 拼图墙区域 */}
      <ScrollView style={styles.puzzleWall} showsVerticalScrollIndicator={false}>
        <View style={styles.puzzleContainer}>
          {puzzlePieces.map((piece, index) => renderPuzzlePiece(piece, index))}
        </View>
      </ScrollView>

      {/* 详情展示区域 */}
      {showDetails && selectedMember && (
        <Animated.View 
          style={[
            styles.detailsPanel,
            {
              backgroundColor: selectedMemberInfo?.color + '15',
              borderTopColor: selectedMemberInfo?.color,
            }
          ]}
        >
          <View style={styles.detailsHeader}>
            <Text style={[styles.detailsTitle, { color: selectedMemberInfo?.color }]}>
              {selectedMemberInfo?.name} 的今日日程
            </Text>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: selectedMemberInfo?.color }]}
              onPress={() => setSelectedMember(null)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
            {displayEvents.length === 0 ? (
              <View style={styles.emptyDetails}>
                <Text style={styles.emptyIcon}>🌟</Text>
                <Text style={styles.emptyText}>今天没有安排</Text>
                <Text style={styles.emptySubtext}>享受自由时光</Text>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {displayEvents.map((event, index) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.detailEventCard,
                      { borderLeftColor: selectedMemberInfo?.color }
                    ]}
                    onPress={() => onEventPress(event)}
                  >
                    <View style={styles.eventHeader}>
                      <Text style={[styles.eventTime, { color: selectedMemberInfo?.color }]}>
                        {formatTime(event.start_ts)}
                      </Text>
                    </View>
                    
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    
                    {event.description && (
                      <Text style={styles.eventDescription} numberOfLines={3}>
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
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedMemberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  puzzleWall: {
    flex: 1,
  },
  puzzleContainer: {
    padding: 10,
    minHeight: 400,
    position: 'relative',
  },
  puzzlePiece: {
    position: 'absolute',
    width: (screenWidth - 40) / 2 - 10,
    height: 120,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pieceContent: {
    flex: 1,
    padding: 12,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    zIndex: -1,
  },
  puzzleCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  puzzleIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  memberInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  eventIndicator: {
    alignItems: 'center',
  },
  eventCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eventLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  noEventsText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  selectedIcon: {
    fontSize: 16,
  },
  detailsPanel: {
    height: 280,
    borderTopWidth: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailsContent: {
    flex: 1,
  },
  emptyDetails: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  eventsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  eventHeader: {
    marginBottom: 6,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 6,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  locationText: {
    fontSize: 10,
    color: '#6B7280',
  },
}); 