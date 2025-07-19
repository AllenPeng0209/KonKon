import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ChoreViewProps } from './ChoreViewTypes';

export default function FairyTaleCastleView({
  tasks,
  selectedDate,
  onDatePress,
  onTaskPress,
}: ChoreViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.title}>FairyTaleCastleView</Text>
        <Text style={styles.subtitle}>此視圖正在開發中</Text>
        <Text style={styles.info}>找到 {tasks.length} 項家務任務</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  info: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
