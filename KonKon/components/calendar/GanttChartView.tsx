import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarViewProps } from './CalendarViewTypes';

export default function GanttChartView({ events, selectedDate }: CalendarViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 甘特圖視圖</Text>
      </View>
      <ScrollView style={styles.content}>
        {events.map((event, index) => (
          <View key={index} style={styles.ganttBar}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.bar} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1, padding: 16 },
  ganttBar: { marginBottom: 12 },
  eventTitle: { fontSize: 14, marginBottom: 4 },
  bar: { height: 8, backgroundColor: '#3498db', borderRadius: 4 },
}); 