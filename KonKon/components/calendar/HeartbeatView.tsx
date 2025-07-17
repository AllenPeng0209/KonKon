import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

export default function HeartbeatView({ events }: CalendarViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💓 心電圖日曆</Text>
      </View>
      <View style={styles.heartbeat}>
        <Text style={styles.heartbeatText}>{'📈'.repeat(events.length || 1)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  heartbeat: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heartbeatText: { fontSize: 24, color: '#00ff00' },
}); 