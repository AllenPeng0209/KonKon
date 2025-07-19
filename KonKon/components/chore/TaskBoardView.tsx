import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChoreViewProps } from './ChoreViewTypes';
import { ChoreTaskWithDetails } from '@/lib/choreService';

interface TaskColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  tasks: ChoreTaskWithDetails[];
}

export default function TaskBoardView({
  tasks,
  selectedDate,
  onDatePress,
  onTaskPress,
  familyMembers = []
}: ChoreViewProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // 按狀態分組任務
  const getTaskColumns = (): TaskColumn[] => {
    const filteredTasks = selectedMember 
      ? tasks.filter(task => task.assigned_to === selectedMember)
      : tasks;

    return [
      {
        id: 'pending',
        title: '待處理',
        status: 'pending',
        color: '#FEF3C7',
        tasks: filteredTasks.filter(task => task.status === 'pending')
      },
      {
        id: 'in_progress',
        title: '進行中',
        status: 'in_progress',
        color: '#DBEAFE',
        tasks: filteredTasks.filter(task => task.status === 'in_progress')
      },
      {
        id: 'completed',
        title: '已完成',
        status: 'completed',
        color: '#D1FAE5',
        tasks: filteredTasks.filter(task => task.status === 'completed')
      }
    ];
  };

  const TaskCard = ({ task }: { task: ChoreTaskWithDetails }) => {
    const getPriorityColor = (priority: number) => {
      switch (priority) {
        case 5: return '#EF4444'; // 高優先級 - 紅色
        case 4: return '#F97316'; // 中高優先級 - 橙色
        case 3: return '#EAB308'; // 中等優先級 - 黃色
        case 2: return '#22C55E'; // 中低優先級 - 綠色
        case 1: return '#6B7280'; // 低優先級 - 灰色
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
      return `${diffDays}天後到期`;
    };

    return (
      <TouchableOpacity
        style={[styles.taskCard, { borderLeftColor: getPriorityColor(task.priority || 3) }]}
        onPress={() => onTaskPress(task)}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority || 3) }]}>
            <Text style={styles.priorityText}>
              {task.priority === 5 ? '高' : task.priority === 4 ? '中高' : task.priority === 3 ? '中' : task.priority === 2 ? '中低' : '低'}
            </Text>
          </View>
        </View>
        
        {task.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.description}
          </Text>
        )}
        
        <View style={styles.taskMeta}>
          <Text style={styles.categoryTag}>
            {task.category}
          </Text>
          {task.estimated_duration && (
            <Text style={styles.durationText}>
              預估 {task.estimated_duration}分鐘
            </Text>
          )}
        </View>
        
        {task.assigned_member && (
          <View style={styles.assigneeRow}>
            <Text style={styles.assigneeText}>
              👤 {task.assigned_member.name}
            </Text>
          </View>
        )}
        
        {task.due_date && (
          <Text style={[
            styles.dueDateText,
            formatDueDate(task.due_date).includes('逾期') && styles.overdue
          ]}>
            ⏰ {formatDueDate(task.due_date)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const TaskColumn = ({ column }: { column: TaskColumn }) => (
    <View style={[styles.column, { backgroundColor: column.color }]}>
      <View style={styles.columnHeader}>
        <Text style={styles.columnTitle}>{column.title}</Text>
        <View style={styles.taskCountBadge}>
          <Text style={styles.taskCountText}>{column.tasks.length}</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.columnContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnScrollContent}
      >
        {column.tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
        {column.tasks.length === 0 && (
          <View style={styles.emptyColumn}>
            <Text style={styles.emptyColumnText}>暫無任務</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 成員過濾器 */}
      <ScrollView 
        horizontal
        style={styles.memberFilter}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.memberFilterContent}
      >
        <TouchableOpacity
          style={[
            styles.memberFilterButton,
            !selectedMember && styles.memberFilterButtonActive
          ]}
          onPress={() => setSelectedMember(null)}
        >
          <Text style={[
            styles.memberFilterText,
            !selectedMember && styles.memberFilterTextActive
          ]}>
            全部成員
          </Text>
        </TouchableOpacity>
        
        {familyMembers.map(member => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.memberFilterButton,
              selectedMember === member.id && styles.memberFilterButtonActive
            ]}
            onPress={() => setSelectedMember(member.id)}
          >
            <Text style={[
              styles.memberFilterText,
              selectedMember === member.id && styles.memberFilterTextActive
            ]}>
              {member.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 任務看板 */}
      <ScrollView 
        horizontal
        style={styles.board}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boardContent}
      >
        {getTaskColumns().map(column => (
          <TaskColumn key={column.id} column={column} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  memberFilter: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  memberFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberFilterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  memberFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  memberFilterTextActive: {
    color: '#FFFFFF',
  },
  board: {
    flex: 1,
    paddingVertical: 16,
  },
  boardContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  column: {
    width: 280,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  taskCountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  columnContent: {
    flex: 1,
  },
  columnScrollContent: {
    gap: 12,
  },
  emptyColumn: {
    padding: 20,
    alignItems: 'center',
  },
  emptyColumnText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  taskCard: {
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
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTag: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  assigneeRow: {
    marginBottom: 4,
  },
  assigneeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  dueDateText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  overdue: {
    color: '#EF4444',
    fontWeight: '700',
  },
});