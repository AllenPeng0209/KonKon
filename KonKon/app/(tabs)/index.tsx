import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      Alert.alert('错误', '退出登录失败');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  // 获取当前日期信息
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const today = currentDate.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  // 获取当前月份的天数
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  // 生成日历数据
  const calendarDays = [];
  // 前面的空白日期
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // 当月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const renderCalendarDay = (day: number | null, index: number) => {
    const isToday = day === today;
    const isEmpty = day === null;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          isToday && styles.todayContainer,
          isEmpty && styles.emptyDay,
        ]}
        onPress={() => day && setSelectedDate(new Date(year, month - 1, day))}
        disabled={isEmpty}
      >
        {!isEmpty && (
          <Text style={[
            styles.calendarDayText,
            isToday && styles.todayText,
          ]}>
            {day}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, styles.activeTab]}>记录</Text>
          <Text style={styles.headerTitle}>洞察</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>全部</Text>
            <Text style={styles.filterIcon}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} onPress={handleSignOut}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 日历部分 */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthYear}>{year}年{month}月</Text>
            <Text style={styles.calendarNote}>记点什么好呢</Text>
          </View>
          
          {/* 星期标题 */}
          <View style={styles.weekHeader}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          
          {/* 日历网格 */}
          <View style={styles.calendarGrid}>
            {calendarDays.map(renderCalendarDay)}
          </View>
        </View>

        {/* 今天日程 */}
        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayIcon}>📅</Text>
            <Text style={styles.todayTitle}>今天 {month}月{today}日(周二)</Text>
          </View>
          
          <View style={styles.aiAssistant}>
            <View style={styles.aiAvatar}>
              <Text style={styles.aiEmoji}>🦝</Text>
            </View>
            <View style={styles.aiContent}>
              <Text style={styles.aiGreeting}>胖咔咔哈都能记:</Text>
              <Text style={styles.aiSuggestion}>"今天午饭30元，用的支付宝"</Text>
              <Text style={styles.aiSuggestion}>"明天下午6点开会，提前5分钟提醒我"</Text>
              <Text style={styles.aiSuggestion}>"抢到演唱会票了，激动到转圈圈！"</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.autoRecordButton}>
            <Text style={styles.autoRecordText}>自动记录也超方便 点我去体验 〉</Text>
          </TouchableOpacity>
          
          {/* 快捷功能 */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>👋</Text>
              <Text style={styles.quickActionText}>敲一敲背面截屏</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>👍</Text>
              <Text style={styles.quickActionText}>小白点载屏</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>✨</Text>
              <Text style={styles.quickActionText}>iPhone快捷按键</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 底部快速记录按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.recordButton}>
          <Text style={styles.recordButtonIcon}>+</Text>
          <Text style={styles.recordButtonText}>长按说话，快速记录</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreButtonText}>⋯</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 20,
    color: '#999',
  },
  activeTab: {
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  filterIcon: {
    fontSize: 10,
    color: '#666',
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#e8f4fd',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 14,
    color: '#666',
    width: (screenWidth - 80) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: (screenWidth - 80) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyDay: {
    opacity: 0,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  todaySection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  aiAssistant: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  aiAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiEmoji: {
    fontSize: 24,
  },
  aiContent: {
    flex: 1,
  },
  aiGreeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  aiSuggestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  autoRecordButton: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  autoRecordText: {
    fontSize: 14,
    color: '#007AFF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'relative',
  },
  recordButtonIcon: {
    fontSize: 18,
    color: '#fff',
    marginRight: 8,
  },
  recordButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  moreButton: {
    position: 'absolute',
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});