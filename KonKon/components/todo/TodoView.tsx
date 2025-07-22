import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import todoService, { TodoWithUser } from '@/lib/todoService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface TodoItemProps {
  todo: TodoWithUser;
  onToggleComplete: (todoId: string, completed: boolean) => void;
  onDelete: (todoId: string) => void;
  onEdit: (todo: TodoWithUser) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggleComplete, onDelete, onEdit }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF5722';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = () => {
    switch (todo.status) {
      case 'completed': return 'checkmark-circle';
      case 'in_progress': return 'play-circle';
      default: return 'ellipse-outline';
    }
  };

  const getStatusColor = () => {
    switch (todo.status) {
      case 'completed': return '#34C759';
      case 'in_progress': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // 強制為本地時間的午夜
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todoDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const timeDiff = todoDate.getTime() - today.getTime();
    const daysDiff = Math.round(timeDiff / (24 * 60 * 60 * 1000));
    
    if (daysDiff === 0) {
      return '今天';
    } else if (daysDiff === 1) {
      return '明天';
    } else if (daysDiff < 0) {
      return '已逾期';
    } else {
      return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    }
  };

  const isOverdue = todo.due_date && todo.status !== 'completed' && (() => {
    const dueDate = new Date(todo.due_date + 'T23:59:59'); // 強制為本地時間的當天結束
    const now = new Date();
    return dueDate < now;
  })();

  return (
    <View style={[styles.todoItem, todo.status === 'completed' && styles.completedItem]}>
      <TouchableOpacity 
        onPress={() => onToggleComplete(todo.id, todo.status !== 'completed')}
        style={styles.checkboxContainer}
      >
        <Ionicons 
          name={getStatusIcon()} 
          size={24} 
          color={getStatusColor()} 
        />
      </TouchableOpacity>
      
      <View style={styles.todoContent}>
        <View style={styles.todoHeader}>
          <Text 
            style={[
              styles.todoTitle, 
              todo.status === 'completed' && styles.completedText
            ]}
            numberOfLines={2}
          >
            {todo.title}
          </Text>
          <View style={styles.todoActions}>
            <TouchableOpacity onPress={() => onEdit(todo)} style={styles.actionButton}>
              <Ionicons name="pencil" size={16} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(todo.id)} style={styles.actionButton}>
              <Ionicons name="trash" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        
        {todo.description && (
          <Text 
            style={[
              styles.todoDescription,
              todo.status === 'completed' && styles.completedText
            ]}
            numberOfLines={2}
          >
            {todo.description}
          </Text>
        )}
        
        <View style={styles.todoMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(todo.priority) }]}>
            <Text style={styles.priorityText}>
              {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
            </Text>
          </View>
          
          {todo.due_date && (
            <Text style={[
              styles.dueDateText,
              isOverdue && styles.overdueText
            ]}>
              {formatDate(todo.due_date)}
            </Text>
          )}
          
          {todo.assigned_user && (
            <Text style={styles.assigneeText}>
              👤 {todo.assigned_user.display_name}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

interface AddTodoModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, description?: string, priority?: string, dueDate?: string) => void;
  editTodo?: TodoWithUser;
}

const AddTodoModal: React.FC<AddTodoModalProps> = ({ visible, onClose, onAdd, editTodo }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (editTodo) {
      setTitle(editTodo.title);
      setDescription(editTodo.description || '');
      setPriority(editTodo.priority as 'low' | 'medium' | 'high');
      setDueDate(editTodo.due_date || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
  }, [editTodo, visible]);

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('錯誤', '請輸入待辦事項標題');
      return;
    }
    
    onAdd(title.trim(), description.trim() || undefined, priority, dueDate || undefined);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editTodo ? '編輯待辦' : '新增待辦'}
          </Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.saveButton}>儲存</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <TextInput
            style={styles.titleInput}
            placeholder="待辦事項標題"
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={100}
          />
          
          <TextInput
            style={styles.descriptionInput}
            placeholder="描述 (可選)"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
          
          <View style={styles.priorityContainer}>
            <Text style={styles.sectionLabel}>優先級</Text>
            <View style={styles.priorityButtons}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.selectedPriorityButton
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    priority === p && styles.selectedPriorityButtonText
                  ]}>
                    {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.dueDateContainer}>
            <Text style={styles.sectionLabel}>到期日期 (可選)</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function TodoView() {
  const { user } = useAuth();
  const { activeFamily } = useFamily();
  const [todos, setTodos] = useState<TodoWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoWithUser | undefined>();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const loadTodos = useCallback(async () => {
    if (!activeFamily) return;
    
    try {
      const data = await todoService.getTodosByFamily(activeFamily.id);
      setTodos(data);
    } catch (error) {
      console.error('載入待辦事項失敗:', error);
      Alert.alert('錯誤', '載入待辦事項失敗');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFamily]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAddTodo = async (title: string, description?: string, priority?: string, dueDate?: string) => {
    if (!activeFamily || !user) return;
    
    try {
      if (editingTodo) {
        await todoService.updateTodo(editingTodo.id, {
          title,
          description,
          priority: priority as any,
          due_date: dueDate,
        });
      } else {
        await todoService.createTodo({
          familyId: activeFamily.id,
          title,
          description,
          priority: priority as any,
          dueDate,
          assignedTo: user.id,
        });
      }
      await loadTodos();
      setEditingTodo(undefined);
    } catch (error) {
      console.error('操作失敗:', error);
      Alert.alert('錯誤', editingTodo ? '更新失敗' : '創建失敗');
    }
  };

  const handleToggleComplete = async (todoId: string, completed: boolean) => {
    try {
      if (completed) {
        await todoService.completeTodo(todoId);
      } else {
        await todoService.updateTodo(todoId, { status: 'pending', completed_at: null });
      }
      await loadTodos();
    } catch (error) {
      console.error('更新狀態失敗:', error);
      Alert.alert('錯誤', '更新狀態失敗');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    Alert.alert(
      '確認刪除',
      '確定要刪除這個待辦事項嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await todoService.deleteTodo(todoId);
              await loadTodos();
            } catch (error) {
              console.error('刪除失敗:', error);
              Alert.alert('錯誤', '刪除失敗');
            }
          }
        }
      ]
    );
  };

  const handleEditTodo = (todo: TodoWithUser) => {
    setEditingTodo(todo);
    setShowAddModal(true);
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'pending') return todo.status !== 'completed';
    if (filter === 'completed') return todo.status === 'completed';
    return true;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTodos();
  }, [loadTodos]);

  if (!activeFamily) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>請先加入或創建家庭</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 篩選器 */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.activeFilterButton]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterButtonText, filter === f && styles.activeFilterButtonText]}>
              {f === 'all' ? '全部' : f === 'pending' ? '進行中' : '已完成'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 待辦列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredTodos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTodo}
              onEdit={handleEditTodo}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filter === 'completed' ? '沒有已完成的待辦事項' : '沒有待辦事項'}
              </Text>
              <Text style={styles.emptySubtext}>點擊下方按鈕創建第一個待辦事項</Text>
            </View>
          }
        />
      )}

      {/* 添加按鈕 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingTodo(undefined);
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* 添加/編輯模態框 */}
      <AddTodoModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTodo(undefined);
        }}
        onAdd={handleAddTodo}
        editTodo={editingTodo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  todoItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  completedItem: {
    opacity: 0.6,
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  todoActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  todoDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  todoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  dueDateText: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 8,
    marginBottom: 4,
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  assigneeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityButtons: {
    flexDirection: 'row',
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  selectedPriorityButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedPriorityButtonText: {
    color: 'white',
  },
  dueDateContainer: {
    marginBottom: 16,
  },
  dateInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
}); 