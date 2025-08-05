import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../lib/i18n';
import { CalendarViewProps } from './CalendarViewTypes';

export default function FamilyGridView({
  events,
  selectedDate,
  onEventPress,
}: CalendarViewProps) {
  // 模拟家庭成员（实际应该从FamilyContext获取）
  const familyMembers = [
    { id: '1', name: '爸爸', color: '#3b82f6', emoji: '👨' },
    { id: '2', name: '妈妈', color: '#ec4899', emoji: '👩' },
    { id: '3', name: '小明', color: '#10b981', emoji: '👦' },
    { id: '4', name: '小红', color: '#f59e0b', emoji: '👧' },
  ];

  // 获取指定成员的事件（这里简化处理，实际应该根据事件的创建者或分享对象来过滤）
  const getEventsForMember = (memberId: string) => {
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    }).slice(0, 3); // 每个成员最多显示3个事件
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatSelectedDate = () => {
    const today = new Date().toISOString().split('T')[0];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    if (selectedDateStr === today) {
      return '今天';
    } else {
      return selectedDate.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* 日期头部 */}
      <View style={styles.header}>
        <Text style={styles.familyTitle}>👨‍👩‍👧‍👦 家庭日程</Text>
        <Text style={styles.dateTitle}>{formatSelectedDate()}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.membersGrid}>
          {familyMembers.map((member) => {
            const memberEvents = getEventsForMember(member.id);
            
            return (
              <View key={member.id} style={styles.memberCard}>
                {/* 成员头部 */}
                <View style={[styles.memberHeader, { backgroundColor: member.color }]}>
                  <Text style={styles.memberEmoji}>{member.emoji}</Text>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <View style={styles.eventCountBadge}>
                    <Text style={styles.eventCountText}>
                      {memberEvents.length}
                    </Text>
                  </View>
                </View>

                {/* 成员事件列表 */}
                <View style={styles.memberEvents}>
                  {memberEvents.length === 0 ? (
                    <View style={styles.noEvents}>
                      <Text style={styles.noEventsText}>{t('calendar.noEvents')}</Text>
                      <Text style={styles.noEventsIcon}>😊</Text>
                    </View>
                  ) : (
                    memberEvents.map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.eventChip,
                          { borderLeftColor: member.color }
                        ]}
                        onPress={() => onEventPress(event)}
                      >
                        <Text style={styles.eventTime}>
                          {formatTime(event.start_ts)}
                        </Text>
                        <Text style={styles.eventTitle} numberOfLines={2}>
                          {event.title}
                        </Text>
                        {event.location && (
                          <Text style={styles.eventLocation} numberOfLines={1}>
                            📍 {event.location}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                {/* 添加事件按钮 */}
                <TouchableOpacity style={styles.addEventButton}>
                  <Text style={styles.addEventText}>+ 添加日程</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* 家庭统计 */}
        <View style={styles.familyStats}>
          <Text style={styles.statsTitle}>今日家庭统计</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{events.length}</Text>
              <Text style={styles.statLabel}>总日程</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{familyMembers.filter(m => getEventsForMember(m.id).length > 0).length}</Text>
              <Text style={styles.statLabel}>忙碌成员</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{familyMembers.filter(m => getEventsForMember(m.id).length === 0).length}</Text>
              <Text style={styles.statLabel}>空闲成员</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefbff', // 淡紫色背景
    margin: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e879f9',
    backgroundColor: '#fdf4ff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  familyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#a855f7',
    marginBottom: 8,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  membersGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memberCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  memberEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  memberName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  eventCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  memberEvents: {
    padding: 12,
    minHeight: 100,
  },
  noEvents: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEventsText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  noEventsIcon: {
    fontSize: 20,
  },
  eventChip: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  eventTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 10,
    color: '#6b7280',
  },
  addEventButton: {
    margin: 12,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  addEventText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  familyStats: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#a855f7',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
}); 