import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

export default function TreasureMapView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  const getSelectedDateEvents = () => {
    const targetDateString = selectedDate.toISOString().split('T')[0];
    
    return events.filter(event => {
      const eventDateString = new Date(event.start_ts * 1000).toISOString().split('T')[0];
      return eventDateString === targetDateString;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ 尋寶地圖</Text>
        <Text style={styles.subtitle}>
          {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.mapBackground}>
          <Text style={styles.mapPattern}>🏝️🌴🏔️⛰️🗻🏞️</Text>
        </View>
        
        {getSelectedDateEvents().map((event, index) => (
          <TouchableOpacity
            key={event.id || index}
            style={[styles.treasure, {
              left: 50 + (index % 3) * 100,
              top: 150 + Math.floor(index / 3) * 100,
            }]}
            onPress={() => onEventPress && onEventPress(event)}
          >
            <Text style={styles.treasureIcon}>💎</Text>
            <Text style={styles.treasureTitle}>{event.title}</Text>
          </TouchableOpacity>
        ))}
        
        {getSelectedDateEvents().length === 0 && (
          <View style={styles.emptyMap}>
            <Text style={styles.emptyIcon}>🏴‍☠️</Text>
            <Text style={styles.emptyText}>暫無寶藏等待發現</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B4513',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#D2691E',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#f5e6d3',
    marginTop: 4,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPattern: {
    fontSize: 20,
    letterSpacing: 5,
  },
  treasure: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 10,
    padding: 10,
  },
  treasureIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  treasureTitle: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyMap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
}); 