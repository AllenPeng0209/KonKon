import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChoreViewProps } from './ChoreViewTypes';
import { ChoreTaskWithDetails } from '@/lib/choreService';

export default function TimelineView({
  tasks,
  selectedDate,
  onDatePress,
  onTaskPress,
}: ChoreViewProps) {
  // 按到期時間排序任務
  const sortedTasks = tasks
    .filter(task => task.due_date)
    .sort((a, b) => {
      const dateA = new Date(a.due_date!).getTime();
      const dateB = new Date(b.due_date!).getTime();
      return dateA - dateB;
    });

  // 按日期分組任務
  const groupedTasks = sortedTasks.reduce((groups, task) => {
    const date = new Date(task.due_date!).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {} as { [key: string]: ChoreTaskWithDetails[] });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      return date.toLocaleDateString('zh-TW', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  const getDateStatus = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < today) return 'overdue';
    if (date.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  const TaskItem = ({ task }: { task: ChoreTaskWithDetails }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return '#10B981';
        case 'in_progress': return '#F59E0B';
        case 'pending': return '#6B7280';
        case 'cancelled': return '#EF4444';
        default: return '#6B7280';
      }
    };

    const getPriorityIcon = (priority: number) => {
      switch (priority) {
        case 5: return '🔴';
        case 4: return '🟠';
        case 3: return '🟡';
        case 2: return '🟢';
        case 1: return '⚪';
        default: return '⚪';
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          { borderLeftColor: getStatusColor(task.status) }
        ]}
        onPress={() => onTaskPress(task)}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <Text style={styles.priorityIcon}>
              {getPriorityIcon(task.priority || 3)}
            </Text>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>
          </View>
          <Text style={styles.taskTime}>
            {task.due_date ? new Date(task.due_date).toLocaleTimeString('zh-TW', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : ''}
          </Text>
        </View>
        
        <View style={styles.taskMeta}>
          <Text style={styles.categoryTag}>{task.category}</Text>
          {task.assigned_member && (
            <Text style={styles.assigneeText}>
              👤 {task.assigned_member.name}
            </Text>
          )}
          {task.estimated_duration && (
            <Text style={styles.durationText}>
              ⏱ {task.estimated_duration}分鐘
            </Text>
          )}
        </View>
        
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(task.status) }
        ]}>
          <Text style={styles.statusText}>
            {task.status === 'completed' ? '已完成' :
             task.status === 'in_progress' ? '進行中' :
             task.status === 'pending' ? '待處理' : '已取消'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineTitle}>家務時間軸</Text>
        <Text style={styles.timelineSubtitle}>
          按時間順序顯示所有家務任務
        </Text>
      </View>

      <View style={styles.timeline}>
        {Object.keys(groupedTasks).map((dateString, index) => {
          const dateStatus = getDateStatus(dateString);
          const dateTasks = groupedTasks[dateString];
          
          return (
            <View key={dateString} style={styles.timelineDay}>
              {/* 時間線節點 */}
              <View style={styles.timelineNode}>
                <View style={styles.timelineLine} />
                <View style={[
                  styles.timelineDot,
                  dateStatus === 'overdue' && styles.timelineDotOverdue,
                  dateStatus === 'today' && styles.timelineDotToday,
                  dateStatus === 'upcoming' && styles.timelineDotUpcoming,
                ]} />
                {index < Object.keys(groupedTasks).length - 1 && (
                  <View style={styles.timelineLineBottom} />
                )}
              </View>

              {/* 日期內容 */}
              <View style={styles.timelineContent}>
                <View style={[
                  styles.dateHeader,
                  dateStatus === 'overdue' && styles.dateHeaderOverdue,
                  dateStatus === 'today' && styles.dateHeaderToday,
                ]}>
                  <Text style={[
                    styles.dateText,
                    dateStatus === 'overdue' && styles.dateTextOverdue,
                    dateStatus === 'today' && styles.dateTextToday,
                  ]}>
                    {formatDate(dateString)}
                  </Text>
                  <Text style={styles.dateFullText}>
                    {new Date(dateString).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <View style={styles.taskCountBadge}>
                    <Text style={styles.taskCountText}>
                      {dateTasks.length} 項任務
                    </Text>
                  </View>
                </View>

                <View style={styles.dayTasks}>
                  {dateTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {Object.keys(groupedTasks).length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>沒有安排的家務任務</Text>
          <Text style={styles.emptySubtitle}>
            點擊添加按鈕來創建新的家務任務
          </Text>
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
  timelineHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timelineTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeline: {
    padding: 20,
  },
  timelineDay: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineNode: {
    width: 20,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#D1D5DB',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9CA3AF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timelineDotOverdue: {
    backgroundColor: '#EF4444',
  },
  timelineDotToday: {
    backgroundColor: '#3B82F6',
  },
  timelineDotUpcoming: {
    backgroundColor: '#10B981',
  },
  timelineLineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: '#D1D5DB',
    minHeight: 20,
  },
  timelineContent: {
    flex: 1,
  },
  dateHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateHeaderOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  dateHeaderToday: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  dateTextOverdue: {
    color: '#DC2626',
  },
  dateTextToday: {
    color: '#2563EB',
  },
  dateFullText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  taskCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  dayTasks: {
    gap: 8,
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  taskTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '500',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assigneeText: {
    fontSize: 10,
    color: '#6B7280',
  },
  durationText: {
    fontSize: 10,
    color: '#6B7280',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});