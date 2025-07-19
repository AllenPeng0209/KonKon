import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { HealthAlert, healthService, HealthStats } from '@/lib/healthService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import BloodPressureChart from './BloodPressureChart';
import BloodPressureRecorder from './BloodPressureRecorder';
import MedicationReminder from './MedicationReminder';

const { width } = Dimensions.get('window');

interface FamilyMemberHealth {
  userId: string;
  userName: string;
  userAvatar?: string;
  stats: HealthStats;
  lastUpdated: Date;
}

const FamilyHealthDashboard: React.FC = () => {
  const { activeFamily: family, familyMembers } = useFamily();
  const { user } = useAuth();
  
  const [familyHealthData, setFamilyHealthData] = useState<FamilyMemberHealth[]>([]);
  const [allAlerts, setAllAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'charts' | 'medications' | 'alerts'>('overview');
  const [selectedMember, setSelectedMember] = useState<string>(user?.id || '');
  const [showRecorder, setShowRecorder] = useState(false);

  useEffect(() => {
    if (family && familyMembers.length > 0) {
      loadFamilyHealthData();
    }
  }, [family, familyMembers]);

  const loadFamilyHealthData = async () => {
    try {
      setLoading(true);
      const healthData: FamilyMemberHealth[] = [];
      const allAlertsData: HealthAlert[] = [];

      for (const member of familyMembers) {
        try {
          const [stats, memberAlerts] = await Promise.all([
            healthService.getBloodPressureStats(member.user_id),
            healthService.getHealthAlerts(member.user_id)
          ]);

          healthData.push({
            userId: member.user_id,
            userName: member.user?.display_name || '未知成員',
            userAvatar: member.user?.avatar_url,
            stats,
            lastUpdated: new Date()
          });

          allAlertsData.push(...memberAlerts);
        } catch (error) {
          console.error(`Failed to load health data for member ${member.user_id}:`, error);
        }
      }

      setFamilyHealthData(healthData);
      setAllAlerts(allAlertsData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading family health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFamilyHealthData();
    setRefreshing(false);
  };

  const renderHealthAlert = (alert: HealthAlert, memberName: string) => {
    const getAlertIcon = (type: string, severity: string) => {
      if (severity === 'critical') return 'warning';
      switch (type) {
        case 'medication':
          return 'medical';
        case 'blood_pressure':
          return 'heart';
        case 'checkup':
          return 'calendar';
        default:
          return 'information-circle';
      }
    };

    const getAlertColor = (severity: string) => {
      switch (severity) {
        case 'critical':
          return '#FF3B30';
        case 'high':
          return '#FF9500';
        case 'medium':
          return '#FFCC00';
        default:
          return '#007AFF';
      }
    };

    const getSeverityText = (severity: string) => {
      switch (severity) {
        case 'critical': return '緊急';
        case 'high': return '高';
        case 'medium': return '中';
        default: return '低';
      }
    };

    return (
      <View key={alert.id} style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertIconContainer, { backgroundColor: getAlertColor(alert.severity) + '15' }]}>
            <Ionicons 
              name={getAlertIcon(alert.alert_type, alert.severity) as any} 
              size={24} 
              color={getAlertColor(alert.severity)} 
            />
          </View>
          <View style={styles.alertContent}>
            <View style={styles.alertTitleRow}>
              <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
              <View style={[styles.severityBadge, { backgroundColor: getAlertColor(alert.severity) }]}>
                <Text style={styles.severityText}>{getSeverityText(alert.severity)}</Text>
              </View>
            </View>
            <Text style={styles.alertMember} numberOfLines={1}>{memberName}</Text>
            <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
            <Text style={styles.alertTime}>
              {new Date(alert.created_at).toLocaleString('zh-TW', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMemberCard = (memberHealth: FamilyMemberHealth) => {
    const { userName, stats } = memberHealth;
    const avgSystolic = stats.averageBP.systolic;
    const avgDiastolic = stats.averageBP.diastolic;
    const category = healthService.getBloodPressureCategory(avgSystolic, avgDiastolic);

    const getStatusColor = (adherence: number) => {
      if (adherence >= 80) return '#34C759';
      if (adherence >= 60) return '#FF9500';
      return '#FF3B30';
    };

    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'improving': return 'trending-down';
        case 'worsening': return 'trending-up';
        default: return 'remove';
      }
    };

    const getTrendColor = (trend: string) => {
      switch (trend) {
        case 'improving': return '#34C759';
        case 'worsening': return '#FF3B30';
        default: return '#FF9500';
      }
    };

    const getTrendText = (trend: string) => {
      switch (trend) {
        case 'improving': return '改善中';
        case 'worsening': return '需注意';
        default: return '穩定';
      }
    };

    return (
      <TouchableOpacity 
        key={memberHealth.userId}
        style={styles.memberCard}
        onPress={() => setSelectedMember(memberHealth.userId)}
        activeOpacity={0.7}
      >
        <View style={styles.memberCardHeader}>
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{userName}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: category.color }]}>
                <Text style={styles.statusText}>{category.label}</Text>
              </View>
            </View>
            <Text style={styles.lastUpdated}>
              最後更新: {memberHealth.lastUpdated.toLocaleDateString('zh-TW')}
            </Text>
          </View>
        </View>

        <View style={styles.memberStats}>
          {/* 血壓卡片 */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="heart" size={16} color="#FF3B30" />
              <Text style={styles.statTitle}>血壓</Text>
            </View>
            <Text style={styles.statMainValue}>
              {avgSystolic}/{avgDiastolic}
            </Text>
            <Text style={styles.statUnit}>mmHg</Text>
          </View>

          {/* 用藥依從卡片 */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="medical" size={16} color="#007AFF" />
              <Text style={styles.statTitle}>用藥依從</Text>
            </View>
            <Text style={styles.statMainValue}>
              {stats.medicationAdherence}%
            </Text>
            <View style={[styles.adherenceBar, { backgroundColor: getStatusColor(stats.medicationAdherence) }]} />
          </View>

          {/* 趨勢卡片 */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons 
                name={getTrendIcon(stats.bloodPressureTrend) as any} 
                size={16} 
                color={getTrendColor(stats.bloodPressureTrend)} 
              />
              <Text style={styles.statTitle}>趨勢</Text>
            </View>
            <Text style={[styles.trendValue, { color: getTrendColor(stats.bloodPressureTrend) }]}>
              {getTrendText(stats.bloodPressureTrend)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderViewSelector = () => (
    <View style={styles.viewSelector}>
      {[
        { key: 'overview', label: '總覽', icon: 'apps' },
        { key: 'charts', label: '圖表', icon: 'stats-chart' },
        { key: 'medications', label: '用藥', icon: 'medical' },
        { key: 'alerts', label: '警報', icon: 'notifications' }
      ].map((view) => (
        <TouchableOpacity
          key={view.key}
          style={[
            styles.viewTab,
            selectedView === view.key && styles.viewTabActive
          ]}
          onPress={() => setSelectedView(view.key as any)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.viewTabIcon,
            selectedView === view.key && styles.viewTabIconActive
          ]}>
            <Ionicons 
              name={view.icon as any} 
              size={20} 
              color={selectedView === view.key ? '#FFFFFF' : '#8E8E93'} 
            />
          </View>
          <Text style={[
            styles.viewTabText,
            selectedView === view.key && styles.viewTabTextActive
          ]}>
            {view.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <ScrollView 
      style={styles.content} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 健康概覽卡片 */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewTitle}>今日健康概覽</Text>
        <View style={styles.overviewStats}>
          <View style={styles.overviewStat}>
            <View style={[styles.overviewIcon, { backgroundColor: '#007AFF15' }]}>
              <Ionicons name="people" size={20} color="#007AFF" />
            </View>
            <Text style={styles.overviewValue}>{familyMembers.length}</Text>
            <Text style={styles.overviewLabel}>家庭成員</Text>
          </View>
          
          <View style={styles.overviewStat}>
            <View style={[styles.overviewIcon, { backgroundColor: '#FF3B3015' }]}>
              <Ionicons name="warning" size={20} color="#FF3B30" />
            </View>
            <Text style={styles.overviewValue}>
              {allAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}
            </Text>
            <Text style={styles.overviewLabel}>重要警報</Text>
          </View>

          <View style={styles.overviewStat}>
            <View style={[styles.overviewIcon, { backgroundColor: '#34C75915' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            </View>
            <Text style={styles.overviewValue}>
              {Math.round(
                familyHealthData.reduce((sum, member) => sum + member.stats.medicationAdherence, 0) / 
                (familyHealthData.length || 1)
              )}%
            </Text>
            <Text style={styles.overviewLabel}>平均依從性</Text>
          </View>
        </View>
      </View>

      {/* 家庭成員健康卡片 */}
      <Text style={styles.sectionTitle}>家庭成員</Text>
      {familyHealthData.map(renderMemberCard)}

      {/* 最新警報 */}
      {allAlerts.length > 0 && (
        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>最新警報</Text>
          {allAlerts.slice(0, 3).map((alert) => {
            const member = familyMembers.find(m => m.user_id === alert.user_id);
            return renderHealthAlert(alert, member?.user?.display_name || '未知成員');
          })}
        </View>
      )}

      {/* 底部空間 */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderContent = () => {
    switch (selectedView) {
      case 'charts':
        const selectedMemberData = familyHealthData.find(m => m.userId === selectedMember);
        return selectedMemberData ? (
          <BloodPressureChart 
            userId={selectedMember}
            familyId={family?.id}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={60} color="#C7C7CC" />
            <Text style={styles.emptyText}>選擇家庭成員查看圖表</Text>
          </View>
        );
      case 'medications':
        return (
          <MedicationReminder 
            userId={selectedMember}
            familyId={family?.id}
          />
        );
      case 'alerts':
        return (
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <Text style={styles.sectionTitle}>所有警報</Text>
            {allAlerts.length > 0 ? (
              allAlerts.map((alert) => {
                const member = familyMembers.find(m => m.user_id === alert.user_id);
                return renderHealthAlert(alert, member?.user?.display_name || '未知成員');
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-outline" size={60} color="#C7C7CC" />
                <Text style={styles.emptyText}>目前沒有警報</Text>
              </View>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        );
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>載入健康數據中...</Text>
      </View>
    );
  }

  if (!family) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={60} color="#C7C7CC" />
        <Text style={styles.emptyText}>請先加入或創建家庭群組</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderViewSelector()}
      {renderContent()}

      {/* 血壓記錄器 */}
      <BloodPressureRecorder
        visible={showRecorder}
        onClose={() => setShowRecorder(false)}
        onRecorded={() => {
          setShowRecorder(false);
          loadFamilyHealthData();
        }}
        familyId={family?.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  viewTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewTabActive: {
    // 活跃状态样式在子元素中定义
  },
  viewTabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewTabIconActive: {
    backgroundColor: '#007AFF',
  },
  viewTabText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  viewTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // 概览卡片
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewStat: {
    flex: 1,
    alignItems: 'center',
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // 章节标题
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    marginTop: 8,
  },
  
  // 成员卡片
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  memberCardHeader: {
    marginBottom: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  
  // 统计卡片
  memberStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    minHeight: 88,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  statTitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  statMainValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  adherenceBar: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  
  // 警报相关
  alertsSection: {
    marginTop: 8,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  alertMember: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
    fontWeight: '500',
  },
  alertMessage: {
    fontSize: 15,
    color: '#3A3A3C',
    lineHeight: 20,
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
});

export default FamilyHealthDashboard; 