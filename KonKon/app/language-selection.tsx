import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const LANGUAGES = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en-US', name: 'English' },
  { code: 'ja-JP', name: '日本語' },
];

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('zh-CN');

  const handleBack = () => {
    router.back();
  };

  const renderItem = ({ item }: { item: { code: string; name: string } }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={() => setSelectedLanguage(item.code)}
    >
      <Text style={styles.settingText}>{item.name}</Text>
      {selectedLanguage === item.code && <Ionicons name="checkmark" size={24} color="#007AFF" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>语言选择</Text>
        <View style={styles.headerRight} />
      </View>
      
      <FlatList
        data={LANGUAGES}
        renderItem={renderItem}
        keyExtractor={item => item.code}
        style={styles.list}
        contentContainerStyle={styles.settingsGroup}
      />
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
  list: {
    marginTop: 35,
  },
  settingsGroup: {
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