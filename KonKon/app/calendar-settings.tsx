import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface CalendarStyle {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  preview: string;
}

const calendarStyles: CalendarStyle[] = [
  // 推荐样式
  {
    id: 'google-week',
    name: 'Google Week',
    description: '类似Google Calendar的周视图，时间网格清晰',
    category: 'recommended',
    icon: '📊',
    preview: '周视图 | 时间轴',
  },
  {
    id: 'apple-month',
    name: 'Apple Month',
    description: '苹果风格的月视图，简洁优雅',
    category: 'recommended',
    icon: '🍎',
    preview: '月视图 | 极简',
  },
  {
    id: 'timeline',
    name: 'Timeline View',
    description: '时间线视图，适合查看详细日程',
    category: 'recommended',
    icon: '📈',
    preview: '时间线 | 详细',
  },

  // 基础样式
  {
    id: 'day-view',
    name: 'Day Focus',
    description: '专注单日视图，显示详细时间安排',
    category: 'basic',
    icon: '📅',
    preview: '单日 | 详细',
  },
  {
    id: 'agenda',
    name: 'Agenda List',
    description: '议程列表样式，按时间顺序排列',
    category: 'basic',
    icon: '📋',
    preview: '列表 | 时序',
  },
  {
    id: 'compact-month',
    name: 'Compact Month',
    description: '紧凑月视图，适合小屏设备',
    category: 'basic',
    icon: '📱',
    preview: '月视图 | 紧凑',
  },
  {
    id: 'large-day',
    name: 'Large Day',
    description: '大字体日视图，易读性强',
    category: 'basic',
    icon: '🔍',
    preview: '大字体 | 易读',
  },

  // 家庭专用
  {
    id: 'family-grid',
    name: 'Family Grid',
    description: '家庭成员网格视图，多人日程一览',
    category: 'family',
    icon: '👨‍👩‍👧‍👦',
    preview: '多人 | 网格',
  },
  {
    id: 'card-month',
    name: 'Card Month',
    description: '卡片式月历，现代化设计',
    category: 'family',
    icon: '🎴',
    preview: '卡片 | 现代',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: '极简黑白设计，专注内容',
    category: 'family',
    icon: '⚫',
    preview: '极简 | 专注',
  },
];

const categoryInfo = {
  recommended: { name: '推荐样式', color: '#3b82f6', bgColor: '#eff6ff' },
  basic: { name: '基础样式', color: '#10b981', bgColor: '#ecfdf5' },
  family: { name: '家庭专用', color: '#f59e0b', bgColor: '#fffbeb' },
};

export default function CalendarSettingsScreen() {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState<string>('google-week');

  useEffect(() => {
    loadSelectedStyle();
  }, []);

  const loadSelectedStyle = async () => {
    try {
      const saved = await AsyncStorage.getItem('calendar_style');
      if (saved) {
        setSelectedStyle(saved);
      }
    } catch (error) {
      console.error('Error loading calendar style:', error);
    }
  };

  const handleSelectStyle = async (styleId: string) => {
    try {
      setSelectedStyle(styleId);
      await AsyncStorage.setItem('calendar_style', styleId);
      Alert.alert('成功', '日历样式已保存');
    } catch (error) {
      console.error('Error saving calendar style:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderStylesByCategory = (category: string) => {
    const categoryStyles = calendarStyles.filter(style => style.category === category);
    const info = categoryInfo[category as keyof typeof categoryInfo];

    return (
      <View key={category} style={styles.categorySection}>
        <View style={[styles.categoryHeader, { backgroundColor: info.bgColor }]}>
          <Text style={[styles.categoryTitle, { color: info.color }]}>
            {info.name}
          </Text>
        </View>

        <View style={styles.stylesGrid}>
          {categoryStyles.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                selectedStyle === style.id && styles.selectedCard,
              ]}
              onPress={() => handleSelectStyle(style.id)}
            >
              <View style={styles.styleHeader}>
                <Text style={styles.styleIcon}>{style.icon}</Text>
                {selectedStyle === style.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.styleName}>{style.name}</Text>
              <Text style={styles.stylePreview}>{style.preview}</Text>
              <Text style={styles.styleDescription}>{style.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日历样式</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            选择适合您和家人的日历显示方式，让日程管理更加高效
          </Text>
        </View>

        {Object.keys(categoryInfo).map(category => renderStylesByCategory(category))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  description: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  stylesGrid: {
    paddingHorizontal: 16,
  },
  styleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#fefeff',
  },
  styleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  styleIcon: {
    fontSize: 24,
  },
  selectedBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  styleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  stylePreview: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  styleDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
}); 