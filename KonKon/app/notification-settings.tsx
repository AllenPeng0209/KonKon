import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState(true);
  const [assignments, setAssignments] = useState(true);
  const [news, setNews] = useState(false);

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>通知设置</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>日程提醒</Text>
          <Switch value={reminders} onValueChange={setReminders} />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>家务分配提醒</Text>
          <Switch value={assignments} onValueChange={setAssignments} />
        </View>
      </View>

      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>应用资讯</Text>
          <Switch value={news} onValueChange={setNews} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 34,
  },
  settingsGroup: {
    marginTop: 35,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c6c6c8',
  },
  settingText: {
    fontSize: 17,
    color: '#000',
  },
}); 