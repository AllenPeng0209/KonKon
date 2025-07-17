import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

const { width: screenWidth } = Dimensions.get('window');
const PUZZLE_SIZE = (screenWidth - 60) / 7; // 7天一週

interface PuzzlePiece {
  day: number;
  date: Date;
  events: any[];
  isCompleted: boolean;
  brightness: Animated.Value;
  color: string;
  shape: 'square' | 'triangle' | 'circle' | 'diamond';
}

const PUZZLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const PUZZLE_SHAPES = ['square', 'triangle', 'circle', 'diamond'] as const;

export default function PuzzlePieceView({
  events,
  selectedDate,
  currentMonth,
  onDatePress,
  onEventPress,
}: CalendarViewProps) {
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
  const [completionProgress, setCompletionProgress] = useState(0);

  // 獲取當月的所有日期
  const getMonthDates = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const dates = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      dates.push(new Date(year, month, day));
    }
    return dates;
  };

  // 檢查日期是否有已完成的事件
  const isDateCompleted = (date: Date): boolean => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start_ts * 1000);
      return eventDate >= dayStart && eventDate <= dayEnd;
    });

    // 如果是過去的日期且有事件，視為已完成
    const now = new Date();
    if (date < now && dayEvents.length > 0) {
      return true;
    }
    
    // 今天的話，檢查是否有事件已經結束
    if (date.toDateString() === now.toDateString()) {
      return dayEvents.some(event => {
        const eventEnd = new Date(event.start_ts * 1000);
        eventEnd.setHours(eventEnd.getHours() + 1); // 假設事件持續1小時
        return eventEnd <= now;
      });
    }
    
    return false;
  };

  // 獲取日期的事件
  const getDateEvents = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventDate = new Date(event.start_ts * 1000);
      return eventDate >= dayStart && eventDate <= dayEnd;
    });
  };

  // 獲取拼圖塊形狀
  const getPuzzleShape = (day: number): 'square' | 'triangle' | 'circle' | 'diamond' => {
    return PUZZLE_SHAPES[day % PUZZLE_SHAPES.length];
  };

  // 生成拼圖塊
  useEffect(() => {
    const monthDates = getMonthDates();
    
    const pieces: PuzzlePiece[] = monthDates.map((date, index) => {
      const dayEvents = getDateEvents(date);
      const isCompleted = isDateCompleted(date);
      const day = date.getDate();
      
      return {
        day,
        date,
        events: dayEvents,
        isCompleted,
        brightness: new Animated.Value(isCompleted ? 1 : 0.3),
        color: PUZZLE_COLORS[index % PUZZLE_COLORS.length],
        shape: getPuzzleShape(day),
      };
    });
    
    setPuzzlePieces(pieces);
    
    // 計算完成進度
    const completedCount = pieces.filter(p => p.isCompleted).length;
    const progress = (completedCount / pieces.length) * 100;
    setCompletionProgress(progress);
    
    // 開始發光動畫
    pieces.forEach((piece, index) => {
      if (piece.isCompleted) {
        startGlowAnimation(piece, index);
      }
    });
  }, [selectedDate, events]);

  // 發光動畫
  const startGlowAnimation = (piece: PuzzlePiece, index: number) => {
    const delay = index * 100;
    
    setTimeout(() => {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(piece.brightness, {
            toValue: 1.2,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: false,
          }),
          Animated.timing(piece.brightness, {
            toValue: 0.8,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setTimeout(pulse, Math.random() * 2000);
        });
      };
      
      pulse();
    }, delay);
  };

  // 處理拼圖塊點擊
  const handlePiecePress = (piece: PuzzlePiece) => {
    onDatePress(piece.date);
    
    // 如果有事件，觸發事件列表
    if (piece.events.length > 0 && onEventPress) {
      // 顯示第一個事件的詳情
      onEventPress(piece.events[0]);
    }
  };

  // 渲染拼圖塊形狀
  const renderPuzzleShape = (piece: PuzzlePiece) => {
    const baseStyle = {
      width: PUZZLE_SIZE - 4,
      height: PUZZLE_SIZE - 4,
      backgroundColor: piece.color,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    };

    const shapeStyles = {
      square: { borderRadius: 8 },
      circle: { borderRadius: (PUZZLE_SIZE - 4) / 2 },
      triangle: { 
        borderRadius: 4,
        transform: [{ rotate: '45deg' }] 
      },
      diamond: { 
        borderRadius: 4,
        transform: [{ rotate: '45deg' }] 
      },
    };

    return {
      ...baseStyle,
      ...shapeStyles[piece.shape],
    };
  };

  // 渲染拼圖塊
  const renderPuzzlePiece = (piece: PuzzlePiece, index: number) => {
    const isToday = piece.date.toDateString() === new Date().toDateString();
    const isSelected = piece.date.toDateString() === selectedDate.toDateString();

    return (
      <Animated.View
        key={piece.day}
        style={[
          styles.puzzlePieceContainer,
          {
            opacity: piece.brightness,
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.puzzlePiece,
            isToday && styles.todayPiece,
            isSelected && styles.selectedPiece,
          ]}
          onPress={() => handlePiecePress(piece)}
        >
          <View style={renderPuzzleShape(piece)}>
            <Text style={[
              styles.dayNumber,
              piece.isCompleted && styles.completedDayNumber,
              piece.shape === 'triangle' && styles.rotatedText,
              piece.shape === 'diamond' && styles.rotatedText,
            ]}>
              {piece.day}
            </Text>
            
            {piece.isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedIcon}>✨</Text>
              </View>
            )}
            
            {piece.events.length > 0 && (
              <View style={styles.eventIndicator}>
                <Text style={styles.eventCount}>{piece.events.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const formatMonthYear = () => {
    return selectedDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <View style={styles.container}>
      {/* 拼圖標題 */}
      <View style={styles.header}>
        <Text style={styles.title}>🧩 拼圖日曆</Text>
        <Text style={styles.subtitle}>{formatMonthYear()}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${completionProgress}%` }
            ]} />
          </View>
          <Text style={styles.progressText}>
            完成度 {Math.round(completionProgress)}%
          </Text>
        </View>
      </View>

      {/* 拼圖網格 */}
      <View style={styles.puzzleGrid}>
        {/* 星期標題 */}
        <View style={styles.weekHeader}>
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>

        {/* 拼圖塊 */}
        <View style={styles.piecesContainer}>
          {/* 空白填充（月初前的空格） */}
          {Array.from({ length: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay() }, (_, i) => (
            <View key={`empty-${i}`} style={styles.emptyPiece} />
          ))}
          
          {/* 拼圖塊 */}
          {puzzlePieces.map(renderPuzzlePiece)}
        </View>
      </View>

      {/* 拼圖說明 */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>🎯 拼圖規則</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendShape, { backgroundColor: '#ccc' }]} />
            <Text style={styles.legendText}>未完成</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendShape, { backgroundColor: '#4ECDC4' }]}>
              <Text style={styles.legendIcon}>✨</Text>
            </View>
            <Text style={styles.legendText}>已完成</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendShape, styles.todayShape]} />
            <Text style={styles.legendText}>今天</Text>
          </View>
        </View>
        <Text style={styles.legendDescription}>
          完成當天的事件，拼圖塊就會發光！集齊所有碎片完成月度拼圖！
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  progressContainer: {
    alignItems: 'center',
    width: '80%',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    fontWeight: '600',
  },
  puzzleGrid: {
    flex: 1,
    padding: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    width: PUZZLE_SIZE,
    textAlign: 'center',
  },
  piecesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  emptyPiece: {
    width: PUZZLE_SIZE,
    height: PUZZLE_SIZE,
    margin: 2,
  },
  puzzlePieceContainer: {
    margin: 2,
  },
  puzzlePiece: {
    width: PUZZLE_SIZE,
    height: PUZZLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayPiece: {
    shadowColor: '#f39c12',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedPiece: {
    transform: [{ scale: 1.1 }],
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  completedDayNumber: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
  },
  rotatedText: {
    transform: [{ rotate: '-45deg' }],
  },
  completedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#f1c40f',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    fontSize: 10,
    color: '#ffffff',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCount: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  legend: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    padding: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendShape: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  todayShape: {
    backgroundColor: '#f39c12',
    shadowColor: '#f39c12',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  legendIcon: {
    fontSize: 12,
    color: '#ffffff',
  },
  legendText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  legendDescription: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 16,
  },
}); 