import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ChoreViewProps } from './ChoreViewTypes';
import { ChoreTaskWithDetails } from '@/lib/choreService';

export default function ListView({
  tasks,
  selectedDate,
  onDatePress,
  onTaskPress,
}: ChoreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at'>('due_date');

  // 過濾和搜索任務
  const getFilteredTasks = () => {
    let filtered = tasks;

    // 狀態過濾
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // 搜索過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query) ||
        task.assigned_member?.name.toLowerCase().includes(query)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          return (b.priority || 3) - (a.priority || 3);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const TaskListItem = ({ task }: { task: ChoreTaskWithDetails }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return '#10B981';
        case 'in_progress': return '#F59E0B';
        case 'pending': return '#6B7280';
        case 'cancelled': return '#EF4444';
        default: return '#6B7280';
      }
    };

    const getPriorityColor = (priority: number) => {
      switch (priority) {
        case 5: return '#EF4444';
        case 4: return '#F97316';
        case 3: return '#EAB308';
        case 2: return '#22C55E';
        case 1: return '#6B7280';
        default: return '#6B7280';
      }
    };

    const formatDueDate = (dueDate: string | null) => {
      if (!dueDate) return '';
      const date = new Date(dueDate);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return '已逾期';
      if (diffDays === 0) return '今天到期';
      if (diffDays === 1) return '明天到期';
      return `${diffDays}天後`;
    };

    const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          isOverdue && styles.taskItemOverdue
        ]}
        onPress={() => onTaskPress(task)}
      >
        <View style={styles.taskLeft}>
          <View style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(task.priority || 3) }
          ]} />
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>
            {task.description && (
              <Text style={styles.taskDescription} numberOfLines={1}>
                {task.description}
              </Text>
            )}
            <View style={styles.taskMeta}>
              <Text style={styles.categoryTag}>
                {task.category}
              </Text>
              {task.assigned_member && (
                <Text style={styles.assigneeText}>
                  👤 {task.assigned_member.name}
                </Text>
              )}
              {task.estimated_duration && (
                <Text style={styles.durationText}>
                  ⏱ {task.estimated_duration}分
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.taskRight}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(task.status) }
          ]}>
            <Text style={styles.statusText}>
              {task.status === 'completed' ? '完成' :
               task.status === 'in_progress' ? '進行中' :
               task.status === 'pending' ? '待處理' : '取消'}
            </Text>
          </View>
          
          {task.due_date && (
            <Text style={[
              styles.dueDateText,
              isOverdue && styles.overdue
            ]}>
              {formatDueDate(task.due_date)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredTasks = getFilteredTasks();

  return (
    <View style={styles.container}>
      {/* 搜索欄 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索家務任務..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* 過濾和排序選項 */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* 狀態過濾 */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>狀態</Text>
            <View style={styles.filterButtons}>
              {[
                { key: 'all', label: '全部' },
                { key: 'pending', label: '待處理' },
                { key: 'in_progress', label: '進行中' },
                { key: 'completed', label: '已完成' },
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterButton,
                    filterStatus === key && styles.filterButtonActive
                  ]}
                  onPress={() => setFilterStatus(key)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterStatus === key && styles.filterButtonTextActive
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 排序選項 */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>排序</Text>
            <View style={styles.filterButtons}>
              {[
                { key: 'due_date', label: '到期時間' },
                { key: 'priority', label: '優先級' },
                { key: 'created_at', label: '創建時間' },
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterButton,
                    sortBy === key && styles.filterButtonActive
                  ]}
                  onPress={() => setSortBy(key as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    sortBy === key && styles.filterButtonTextActive
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 任務計數 */}
      <View style={styles.taskCount}>
        <Text style={styles.taskCountText}>
          顯示 {filteredTasks.length} 項任務，共 {tasks.length} 項
        </Text>
      </View>

      {/* 任務列表 */}
      <ScrollView 
        style={styles.taskList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.taskListContent}
      >
        {filteredTasks.map(task => (
          <TaskListItem key={task.id} task={task} />
        ))}
        
        {filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {searchQuery ? '沒有找到匹配的任務' : '沒有家務任務'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? '嘗試調整搜索條件' : '點擊添加按鈕創建新任務'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollContent: {
    padding: 16,
    gap: 24,
  },
  filterGroup: {
    gap: 8,
  },
  filterGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  taskCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  taskCountText: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    padding: 16,
    gap: 8,
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskItemOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  taskLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8B5CF6',
    backgroundColor: '#F3E8FF',
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
  taskRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dueDateText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  overdue: {
    color: '#EF4444',
    fontWeight: '700',
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