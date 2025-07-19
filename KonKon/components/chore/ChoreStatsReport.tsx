import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { ChoreStats, MemberChoreStats } from '@/lib/choreService';

interface ChoreStatsReportProps {
  familyStats: ChoreStats | null;
  memberStats: MemberChoreStats[];
}

export default function ChoreStatsReport({ familyStats, memberStats }: ChoreStatsReportProps) {
  if (!familyStats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暫無統計數據</Text>
      </View>
    );
  }

  const StatCard = ({ title, value, subtitle, color = '#3B82F6' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const MemberCard = ({ member }: { member: MemberChoreStats }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {member.memberName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.memberName}</Text>
          <Text style={styles.memberSubtext}>
            完成率 {member.completionRate.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.memberPoints}>
          <Text style={styles.pointsValue}>{member.totalPoints}</Text>
          <Text style={styles.pointsLabel}>積分</Text>
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
      </View>

      <View style={styles.memberStats}>
        <View style={styles.memberStatItem}>
          <Text style={styles.memberStatValue}>{member.completedTasks}</Text>
          <Text style={styles.memberStatLabel}>已完成</Text>
        </View>
        <View style={styles.memberStatItem}>
          <Text style={styles.memberStatValue}>{member.inProgressTasks}</Text>
          <Text style={styles.memberStatLabel}>進行中</Text>
        </View>
        <View style={styles.memberStatItem}>
          <Text style={styles.memberStatValue}>{member.pendingTasks}</Text>
          <Text style={styles.memberStatLabel}>待處理</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 家庭整體統計 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>家庭整體統計</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="總任務數"
            value={familyStats.totalTasks}
            color="#6366F1"
          />
          <StatCard
            title="已完成"
            value={familyStats.completedTasks}
            color="#10B981"
          />
          <StatCard
            title="進行中"
            value={familyStats.inProgressTasks}
            color="#F59E0B"
          />
          <StatCard
            title="待處理"
            value={familyStats.pendingTasks}
            color="#6B7280"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="完成率"
            value={`${familyStats.completionRate.toFixed(1)}%`}
            color="#059669"
          />
          <StatCard
            title="總積分"
            value={familyStats.totalPoints}
            color="#DC2626"
          />
          <StatCard
            title="平均用時"
            value={`${Math.round(familyStats.avgCompletionTime)}分`}
            subtitle="每項任務"
            color="#7C3AED"
          />
        </View>
      </View>

      {/* 成員表現 */}
      {memberStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>成員表現</Text>
          <View style={styles.membersContainer}>
            {memberStats
              .sort((a, b) => b.completionRate - a.completionRate)
              .map(member => (
                <MemberCard key={member.memberId} member={member} />
              ))}
          </View>
        </View>
      )}

      {/* 表現排行榜 */}
      {memberStats.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>本月排行榜</Text>
          <View style={styles.leaderboard}>
            {memberStats
              .sort((a, b) => b.totalPoints - a.totalPoints)
              .map((member, index) => (
                <View key={member.memberId} style={styles.leaderboardItem}>
                  <View style={styles.rankContainer}>
                    <View style={[
                      styles.rankBadge,
                      index === 0 && styles.firstPlace,
                      index === 1 && styles.secondPlace,
                      index === 2 && styles.thirdPlace,
                    ]}>
                      <Text style={[
                        styles.rankText,
                        index < 3 && styles.rankTextWhite
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.leaderboardName}>
                      {member.memberName}
                    </Text>
                  </View>
                  <View style={styles.leaderboardStats}>
                    <Text style={styles.leaderboardPoints}>
                      {member.totalPoints} 分
                    </Text>
                    <Text style={styles.leaderboardRate}>
                      {member.completionRate.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  membersContainer: {
    gap: 12,
  },
  memberCard: {
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
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
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
  memberPoints: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  memberProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  memberStatItem: {
    alignItems: 'center',
  },
  memberStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  memberStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  leaderboard: {
    gap: 8,
  },
  leaderboardItem: {
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
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  firstPlace: {
    backgroundColor: '#F59E0B',
  },
  secondPlace: {
    backgroundColor: '#6B7280',
  },
  thirdPlace: {
    backgroundColor: '#92400E',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  rankTextWhite: {
    color: '#FFFFFF',
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  leaderboardStats: {
    alignItems: 'flex-end',
  },
  leaderboardPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  leaderboardRate: {
    fontSize: 12,
    color: '#6B7280',
  },
});