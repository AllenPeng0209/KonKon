import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

export default function SpaceExplorationView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  const getSelectedDateEvents = () => {
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 太空探索日程</Text>
        <Text style={styles.subtitle}>
          {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.spaceBackground}>
          <Text style={styles.stars}>✨⭐🌟💫✨⭐🌟💫</Text>
        </View>
        
        {getSelectedDateEvents().map((event, index) => (
          <TouchableOpacity
            key={event.id || index}
            style={styles.planet}
            onPress={() => onEventPress && onEventPress(event)}
          >
            <Text style={styles.planetEmoji}>🪐</Text>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTime}>{formatTime(event.start_ts)}</Text>
              <Text style={styles.eventTitle}>{event.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {getSelectedDateEvents().length === 0 && (
          <View style={styles.emptySpace}>
            <Text style={styles.emptyIcon}>🌌</Text>
            <Text style={styles.emptyText}>浩瀚宇宙，暫無探索任務</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  spaceBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stars: {
    fontSize: 20,
    letterSpacing: 10,
  },
  planet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  planetEmoji: {
    fontSize: 30,
    marginRight: 15,
  },
  eventInfo: {
    flex: 1,
  },
  eventTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  emptySpace: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
}); 