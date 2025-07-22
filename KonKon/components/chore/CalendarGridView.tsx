import { ChoreTaskWithDetails } from '@/lib/choreService';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { ChoreViewProps } from './ChoreViewTypes';

export default function CalendarGridView({
  tasks,
  selectedDate,
  currentMonth,
  onDatePress,
  onTaskPress,
  onMonthChange,
}: ChoreViewProps) {
  // 获取本地日期字符串（避免时区问题）
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 生成日曆標記數據
  const getCalendarMarkedDates = () => {
    const markedDates: { [key: string]: any } = {};
    const today = getLocalDateString(new Date());
    const selectedDateString = getLocalDateString(selectedDate);
    
    // 標記選中的日期（藍色光標）
    markedDates[selectedDateString] = {
      selected: true,
      selectedColor: '#3B82F6',
      selectedTextColor: '#FFFFFF',
      marked: false,
    };
    
    // 如果今天不是選中日期，為今天設置特殊的文字顏色
    if (today !== selectedDateString) {
      markedDates[today] = {
        selected: false,
        selectedColor: '#3B82F6',
        selectedTextColor: '#FFFFFF',
        marked: false,
        // todayTextColor 在 theme 中定義
      };
    }

    // 按日期分組任務
    const tasksByDate: { [key: string]: ChoreTaskWithDetails[] } = {};
    tasks.forEach(task => {
      if (task.due_date) {
        const taskDate = getLocalDateString(new Date(task.due_date));
        if (!tasksByDate[taskDate]) {
          tasksByDate[taskDate] = [];
        }
        tasksByDate[taskDate].push(task);
      }
    });

    // 標記有任務的日期
    Object.keys(tasksByDate).forEach(dateString => {
      const dayTasks = tasksByDate[dateString];
      const completedTasks = dayTasks.filter(t => t.status === 'completed').length;
      const totalTasks = dayTasks.length;
      const hasOverdue = dayTasks.some(t => {
        const dueDate = new Date(t.due_date!);
        const now = new Date();
        return t.status !== 'completed' && dueDate < now;
      });

      let dotColor = '#10B981'; // 默認綠色
      if (hasOverdue) {
        dotColor = '#EF4444'; // 逾期紅色
      } else if (completedTasks === totalTasks) {
        dotColor = '#10B981'; // 全部完成綠色
      } else if (completedTasks > 0) {
        dotColor = '#F59E0B'; // 部分完成黃色
      } else {
        dotColor = '#6B7280'; // 未開始灰色
      }

      if (markedDates[dateString]) {
        markedDates[dateString] = {
          ...markedDates[dateString],
          marked: true,
          dotColor,
          dots: [{ color: dotColor }],
        };
      } else {
        markedDates[dateString] = {
          marked: true,
          dotColor,
          dots: [{ color: dotColor }],
        };
      }
    });
    
    return markedDates;
  };

  const handleDatePress = (dateData: DateData) => {
    const clickedDate = new Date(dateData.dateString);
    onDatePress(clickedDate);
  };

  const handleMonthChange = (month: DateData) => {
    if (onMonthChange) {
      onMonthChange(month.dateString.slice(0, 7));
    }
  };

  // 獲取選中日期的任務
  const getSelectedDateTasks = () => {
    const selectedDateString = getLocalDateString(selectedDate);
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = getLocalDateString(new Date(task.due_date));
      return taskDate === selectedDateString;
    });
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

    const getStatusText = (status: string) => {
      switch (status) {
        case 'completed': return '已完成';
        case 'in_progress': return '進行中';
        case 'pending': return '待處理';
        case 'cancelled': return '已取消';
        default: return '未知';
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

    return (
      <TouchableOpacity
        style={[styles.taskItem, { borderLeftColor: getStatusColor(task.status) }]}
        onPress={() => onTaskPress(task)}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority || 3) }]} />
        </View>
        
        <View style={styles.taskMeta}>
          <Text style={styles.categoryText}>{task.category}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
            {getStatusText(task.status)}
          </Text>
        </View>
        
        {task.assigned_member && (
          <Text style={styles.assigneeText}>
            👤 {task.assigned_member.name}
          </Text>
        )}
        
        {task.estimated_duration && (
          <Text style={styles.durationText}>
            ⏱ 預估 {task.estimated_duration} 分鐘
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const selectedDateTasks = getSelectedDateTasks();

  return (
    <View style={styles.container}>
      {/* 日曆視圖 */}
      <View style={styles.calendarContainer}>
        <Calendar
          key={currentMonth}
          current={currentMonth}
          markedDates={getCalendarMarkedDates()}
          onDayPress={handleDatePress}
          onMonthChange={handleMonthChange}
          enableSwipeMonths={true}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#374151',
            selectedDayBackgroundColor: '#3B82F6',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#3B82F6',
            dayTextColor: '#1F2937',
            textDisabledColor: '#D1D5DB',
            dotColor: '#10B981',
            selectedDotColor: '#FFFFFF',
            arrowColor: '#3B82F6',
            disabledArrowColor: '#D1D5DB',
            monthTextColor: '#1F2937',
            indicatorColor: '#3B82F6',
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
            textDayFontWeight: '600',
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
          style={styles.calendar}
          hideExtraDays={true}
          firstDay={1}
          showWeekNumbers={false}
          disableMonthChange={false}
          hideDayNames={false}
          showSixWeeks={false}
          disabledByDefault={false}
          markingType={'multi-dot'}
        />
      </View>

      {/* 選中日期的任務列表 */}
      <View style={styles.tasksContainer}>
        <View style={styles.tasksHeader}>
          <Text style={styles.tasksTitle}>
            {selectedDate.toLocaleDateString('zh-TW', { 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })} 的家務
          </Text>
          <View style={styles.taskCountBadge}>
            <Text style={styles.taskCountText}>{selectedDateTasks.length}</Text>
          </View>
        </View>

        {selectedDateTasks.length > 0 ? (
          <View style={styles.tasksList}>
            {selectedDateTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyTasks}>
            <Text style={styles.emptyTasksText}>
              這一天沒有安排家務任務
            </Text>
            <Text style={styles.emptyTasksSubtext}>
              點擊其他日期查看或添加新任務
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendar: {
    borderRadius: 12,
  },
  tasksContainer: {
    flex: 1,
    margin: 16,
    marginTop: 0,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  taskCountBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  taskCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
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
    marginRight: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assigneeText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyTasks: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyTasksText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTasksSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});