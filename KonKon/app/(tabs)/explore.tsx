import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const { width: screenWidth } = Dimensions.get('window');

export default function ExploreScreen() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>记录</Text>
          <Text style={[styles.headerTitle, styles.activeTab]}>洞察</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>本月</Text>
            <Text style={styles.filterIcon}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 数据概览 */}
        <View style={styles.overviewContainer}>
          <Text style={styles.sectionTitle}>本月数据概览</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>127</Text>
              <Text style={styles.statLabel}>记录条数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>23</Text>
              <Text style={styles.statLabel}>活跃天数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8.5</Text>
              <Text style={styles.statLabel}>平均每日</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>95%</Text>
              <Text style={styles.statLabel}>完成率</Text>
            </View>
          </View>
        </View>

        {/* 家庭时间分析 */}
        <View style={styles.analysisContainer}>
          <Text style={styles.sectionTitle}>家庭时间分析</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>共同时间统计</Text>
              <Text style={styles.chartSubtitle}>本周家庭成员共同活动时间</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartIcon}>📊</Text>
              <Text style={styles.chartText}>本周共同时间：18小时</Text>
              <Text style={styles.chartDesc}>比上周增加了2小时</Text>
            </View>
          </View>
        </View>

        {/* 活动分类 */}
        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitle}>活动分类分析</Text>
          <View style={styles.categoryList}>
            <View style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>🍽️</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>用餐时间</Text>
                <Text style={styles.categoryCount}>32次记录</Text>
              </View>
              <View style={styles.categoryProgress}>
                <View style={[styles.progressBar, { width: '80%' }]} />
              </View>
            </View>
            
            <View style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>🏠</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>家庭活动</Text>
                <Text style={styles.categoryCount}>28次记录</Text>
              </View>
              <View style={styles.categoryProgress}>
                <View style={[styles.progressBar, { width: '70%' }]} />
              </View>
            </View>
            
            <View style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>💼</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>工作日程</Text>
                <Text style={styles.categoryCount}>45次记录</Text>
              </View>
              <View style={styles.categoryProgress}>
                <View style={[styles.progressBar, { width: '90%' }]} />
              </View>
            </View>
            
            <View style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>🎯</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>个人目标</Text>
                <Text style={styles.categoryCount}>22次记录</Text>
              </View>
              <View style={styles.categoryProgress}>
                <View style={[styles.progressBar, { width: '55%' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 优化建议 */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionTitle}>智能建议</Text>
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionIcon}>💡</Text>
              <Text style={styles.suggestionTitle}>时间管理优化</Text>
            </View>
            <Text style={styles.suggestionText}>
              建议在周二和周四安排家庭时间，这两天的空闲时间最多。
            </Text>
          </View>
          
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionIcon}>🎯</Text>
              <Text style={styles.suggestionTitle}>目标达成提醒</Text>
            </View>
            <Text style={styles.suggestionText}>
              您的运动目标完成率较低，建议设置更合理的目标或调整提醒时间。
            </Text>
          </View>
          
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionIcon}>🏆</Text>
              <Text style={styles.suggestionTitle}>家庭协调改进</Text>
            </View>
            <Text style={styles.suggestionText}>
              本月家庭成员的日程冲突减少了30%，继续保持良好的沟通习惯。
            </Text>
          </View>
        </View>

        {/* 底部占位 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  overviewContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  analysisContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  chartContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  chartIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  chartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  chartDesc: {
    fontSize: 14,
    color: '#666',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  categoryList: {
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  categoryProgress: {
    width: 60,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  suggestionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 80,
  },
});
