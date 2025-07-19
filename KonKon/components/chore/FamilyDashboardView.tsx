import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ChoreViewProps } from './ChoreViewTypes';
import { ChoreTaskWithDetails } from '@/lib/choreService';

const { width } = Dimensions.get('window');

interface MemberStats {
  id: string;
  name: string;
  avatar_url?: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
  totalPoints: number;
}

export default function FamilyDashboardView({
  tasks,
  selectedDate,
  onDatePress,
  onTaskPress,
  familyMembers = [],
  memberStats = []
}: ChoreViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // 計算家庭成員統計
  const calculateMemberStats = (): MemberStats[] => {
    return familyMembers.map(member => {
      const memberTasks = tasks.filter(task => task.assigned_to === member.id);
      const completed = memberTasks.filter(t => t.status === 'completed').length;
      const pending = memberTasks.filter(t => t.status === 'pending').length;
      const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
      const total = memberTasks.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      const points = memberTasks.reduce((sum, task) => sum + (task.points_reward || 0), 0);

      return {
        id: member.id,
        name: member.name,
        avatar_url: member.avatar_url,
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        completionRate,
        totalPoints: points,
      };
    });
  };

  // 計算整體家庭統計
  const calculateFamilyStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const totalPoints = tasks.reduce((sum, task) => sum + (task.points_reward || 0), 0);

    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate,
      totalPoints,
    };
  };

  // 獲取任務分類統計
  const getCategoryStats = () => {
    const categories = ['清潔', '烹飪', '購物', '照顧', '維修', '其他'];
    return categories.map(category => {
      const categoryTasks = tasks.filter(t => t.category === category);
      const completed = categoryTasks.filter(t => t.status === 'completed').length;
      const total = categoryTasks.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        category,
        total,
        completed,
        completionRate,
      };
    }).filter(stat => stat.total > 0);
  };

  const familyStats = calculateFamilyStats();
  const membersStats = calculateMemberStats();
  const categoryStats = getCategoryStats();

  const MemberCard = ({ member }: { member: MemberStats }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {member.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberSubtext}>
              {member.totalTasks} 項任務
            </Text>
          </View>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{member.totalPoints}分</Text>
        </View>
      </View>

      <View style={styles.memberProgress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min(member.completionRate, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {member.completionRate.toFixed(0)}% 完成率
        </Text>
      </View>

      <View style={styles.memberStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{member.completedTasks}</Text>
          <Text style={styles.statLabel}>已完成</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{member.inProgressTasks}</Text>
          <Text style={styles.statLabel}>進行中</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{member.pendingTasks}</Text>
          <Text style={styles.statLabel}>待處理</Text>
        </View>
      </View>
    </View>
  );

  const CategoryCard = ({ category, total, completed, completionRate }: {
    category: string;
    total: number;
    completed: number;
    completionRate: number;
  }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <Text style={styles.categoryCompletionRate}>
          {completionRate.toFixed(0)}%
        </Text>
      </View>
      <View style={styles.categoryProgress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min(completionRate, 100)}%` }
            ]} 
          />
        </View>
      </View>
      <Text style={styles.categoryStats}>
        {completed}/{total} 項任務完成
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 時間段選擇器 */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as const).map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period === 'week' ? '本週' : period === 'month' ? '本月' : '今年'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 家庭整體統計 */}
      <View style={styles.familyOverview}>
        <Text style={styles.sectionTitle}>家庭概覽</Text>
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.overviewValue}>{familyStats.total}</Text>
            <Text style={styles.overviewLabel}>總任務</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.overviewValue}>{familyStats.completed}</Text>
            <Text style={styles.overviewLabel}>已完成</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.overviewValue}>{familyStats.pending}</Text>
            <Text style={styles.overviewLabel}>待處理</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.overviewValue}>{familyStats.overdue}</Text>
            <Text style={styles.overviewLabel}>已逾期</Text>
          </View>
        </View>
        
        <View style={styles.familyProgress}>
          <Text style={styles.familyProgressTitle}>
            整體完成率: {familyStats.completionRate.toFixed(1)}%
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(familyStats.completionRate, 100)}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* 家庭成員統計 */}
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>成員表現</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.membersScrollContent}
        >
          {membersStats.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </ScrollView>
      </View>

      {/* 任務分類統計 */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>分類進度</Text>
        <View style={styles.categoriesGrid}>
          {categoryStats.map(category => (
            <CategoryCard key={category.category} {...category} />
          ))}
        </View>
      </View>

      {/* 最近任務 */}
      <View style={styles.recentTasksSection}>
        <Text style={styles.sectionTitle}>最近任務</Text>
        <View style={styles.recentTasksList}>
          {tasks
            .filter(task => task.status !== 'cancelled')
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .slice(0, 5)
            .map(task => (
              <TouchableOpacity
                key={task.id}
                style={styles.recentTaskItem}
                onPress={() => onTaskPress(task)}
              >
                <View style={styles.recentTaskInfo}>
                  <Text style={styles.recentTaskTitle} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <Text style={styles.recentTaskMember}>
                    {task.assigned_member?.name || '未分配'}
                  </Text>
                </View>
                <View style={[
                  styles.recentTaskStatus,
                  { backgroundColor: 
                    task.status === 'completed' ? '#10B981' :
                    task.status === 'in_progress' ? '#F59E0B' :
                    task.status === 'pending' ? '#6B7280' : '#EF4444'
                  }
                ]}>
                  <Text style={styles.recentTaskStatusText}>
                    {task.status === 'completed' ? '完成' :
                     task.status === 'in_progress' ? '進行中' :
                     task.status === 'pending' ? '待處理' : '取消'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  familyOverview: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  overviewCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  familyProgress: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  familyProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  membersSection: {
    margin: 16,
    marginTop: 0,
  },
  membersScrollContent: {
    paddingRight: 16,
    gap: 16,
  },
  memberCard: {
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  memberSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  pointsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  memberProgress: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  categoriesSection: {
    margin: 16,
    marginTop: 0,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryCompletionRate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  categoryProgress: {
    marginBottom: 8,
  },
  categoryStats: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentTasksSection: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
  },
  recentTasksList: {
    gap: 8,
  },
  recentTaskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentTaskInfo: {
    flex: 1,
  },
  recentTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  recentTaskMember: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentTaskStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recentTaskStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});