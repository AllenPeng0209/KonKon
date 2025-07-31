import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { t } from '../../lib/i18n';
import todoService, { CreateTodoParams, TodoWithUser } from '../../lib/todoService';

interface TodoItemProps {
  todo: TodoWithUser;
  onToggleComplete: (todoId: string, completed: boolean) => void;
  onDelete: (todoId: string) => void;
  onEdit: (todo: TodoWithUser) => void;
  drag: () => void;
  isActive: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggleComplete, onDelete, onEdit, drag, isActive }) => {
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
      return t('todos.today');
    } else if (daysDiff === 1) {
      return t('todos.tomorrow');
    } else if (daysDiff < 0) {
      return t('todos.overdue');
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const isOverdue = todo.due_date && todo.status !== 'completed' && (() => {
    const dueDate = new Date(todo.due_date + 'T23:59:59'); // 強制為本地時間的當天結束
    const now = new Date();
    return dueDate < now;
  })();

  return (
    <View style={[
      styles.todoCard, 
      todo.status === 'completed' && styles.completedCard,
      isActive && styles.draggingCard
    ]}>
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={() => onToggleComplete(todo.id, todo.status !== 'completed')}
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
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onEdit(todo)}
            >
              <Ionicons name="pencil" size={16} color="#8E8E93" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onDelete(todo.id)}
            >
              <Ionicons name="trash" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        
        {todo.description && (
          <Text style={styles.todoDescription} numberOfLines={2}>
            {todo.description}
          </Text>
        )}
        
        <View style={styles.todoMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(todo.priority) }]}>
            <Text style={styles.priorityText}>
              {todo.priority === 'high' ? t('todos.high') : 
               todo.priority === 'medium' ? t('todos.medium') : 
               t('todos.low')}
            </Text>
          </View>
          
          {todo.due_date && (
            <Text style={[styles.dueDateText, isOverdue && styles.overdueText]}>
              {formatDate(todo.due_date)}
            </Text>
          )}
          
          {todo.assigned_user && (
            <Text style={styles.assigneeText}>
              {todo.assigned_user.display_name || t('todos.unknownUser')}
            </Text>
          )}
        </View>
      </View>

      {/* 拖拽手柄 */}
      <TouchableOpacity 
        style={styles.dragHandle}
        onPressIn={drag}
        delayPressIn={0}
      >
        <Ionicons name="reorder-three" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    </View>
  );
};

interface AddTodoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, description?: string, priority?: string, dueDate?: string) => void;
  editingTodo?: TodoWithUser;
}

const AddTodoModal: React.FC<AddTodoModalProps> = ({ visible, onClose, onSave, editingTodo }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title);
      setDescription(editingTodo.description || '');
      setPriority(editingTodo.priority as 'low' | 'medium' | 'high');
      setDueDate(editingTodo.due_date || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
  }, [editingTodo, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert(t('todos.error'), t('todos.pleaseEnterTodoTitle'));
      return;
    }
    
    onSave(title.trim(), description.trim() || undefined, priority, dueDate || undefined);
    onClose();
  };

  const getPriorityIcon = (p: string) => {
    switch (p) {
      case 'high': return 'flash';
      case 'medium': return 'radio-button-on';
      case 'low': return 'remove-circle-outline';
      default: return 'radio-button-on';
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return '#FF5722';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#007AFF';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        {/* 美化的頭部 */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Ionicons 
              name={editingTodo ? "pencil" : "add-circle"} 
              size={20} 
              color="#007AFF" 
              style={styles.headerIcon}
            />
            <Text style={styles.modalTitle}>
              {editingTodo ? t('todos.editTodo') : t('todos.addTodo')}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>{t('todos.save')}</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* 標題輸入卡片 */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Ionicons name="document-text" size={20} color="#007AFF" />
              <Text style={styles.inputLabel}>{t('todos.todoTitle')}</Text>
            </View>
            <TextInput
              style={styles.titleInput}
              placeholder={t('todos.taskTitlePlaceholder')}
              value={title}
              onChangeText={setTitle}
              multiline
              placeholderTextColor="#C7C7CC"
            />
          </View>

          {/* 描述輸入卡片 */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#34C759" />
              <Text style={styles.inputLabel}>{t('todos.description')}</Text>
            </View>
            <TextInput
              style={styles.descriptionInput}
              placeholder={t('todos.detailDescriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor="#C7C7CC"
            />
          </View>
          
          {/* 優先級選擇卡片 */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Ionicons name="flag" size={20} color="#FF9500" />
              <Text style={styles.inputLabel}>{t('todos.priority')}</Text>
            </View>
            <View style={styles.priorityButtons}>
              {(['high', 'medium', 'low'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && { 
                      ...styles.selectedPriorityButton,
                      backgroundColor: getPriorityColor(p)
                    }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Ionicons 
                    name={getPriorityIcon(p)} 
                    size={16} 
                    color={priority === p ? 'white' : getPriorityColor(p)}
                    style={styles.priorityIcon}
                  />
                  <Text style={[
                    styles.priorityButtonText,
                    priority === p && styles.selectedPriorityButtonText
                  ]}>
                    {p === 'high' ? t('todos.high') : 
                     p === 'medium' ? t('todos.medium') : 
                     t('todos.low')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* 期限日期卡片 */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Ionicons name="calendar" size={20} color="#8E8E93" />
              <Text style={styles.inputLabel}>{t('todos.dueDateOptional')}</Text>
            </View>
            <View style={styles.dateInputContainer}>
              <Ionicons name="time" size={16} color="#8E8E93" style={styles.dateIcon} />
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={dueDate}
                onChangeText={setDueDate}
                placeholderTextColor="#C7C7CC"
              />
            </View>
          </View>

          {/* 底部間距 */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function TodoView() {
  const { user } = useAuth();
  const { activeFamily, userFamilies } = useFamily();
  const [todos, setTodos] = useState<TodoWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoWithUser | undefined>();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isSorting, setIsSorting] = useState(false);

  // 優化：使用 useMemo 來穩定 userFamilyIds 的引用
  const userFamilyIds = useMemo(() => userFamilies?.map(family => family.id) || [], [userFamilies]);

  const loadTodos = useCallback(async () => {
    if (!activeFamily || !user) return;
    
    // 開始加載時，先清空現有數據，避免看到舊數據的閃爍
    setTodos([]);
    setCurrentTodos([]);
    setLoading(true);

    try {
      // 使用新的空間感知方法，並傳入過濾條件
      const data = await todoService.getTodosBySpace(activeFamily, userFamilyIds, filter);
      setTodos(data);
      setCurrentTodos(data); // 數據庫已經過濾，直接設置
    } catch (error) {
      console.error('載入待辦事項失敗:', error);
      Alert.alert(t('todos.error'), t('todos.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFamily, userFamilyIds, user, filter]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAddTodo = async (title: string, description?: string, priority?: string, dueDate?: string) => {
    if (!activeFamily || !user) return;

    // 尋找用戶的個人空間
    const personalFamily = userFamilies.find(f => f.tag === 'personal');

    try {
      if (editingTodo) {
        await todoService.updateTodo(editingTodo.id, {
          title,
          description,
          priority: priority as any,
          due_date: dueDate,
        });
      } else {
        // 確定待辦事項要創建在哪個familyId下
        let targetFamilyId: string | undefined;

        if (activeFamily.id === 'meta-space' || activeFamily.tag === 'personal') {
          // 如果在元空間或個人空間，使用個人空間的ID
          if (personalFamily) {
            targetFamilyId = personalFamily.id;
          } else {
            Alert.alert(
              t('todos.error'),
              t('todos.noPersonalSpace')
            );
            return;
          }
        } else {
          // 在普通家庭空間，直接使用activeFamily.id
          targetFamilyId = activeFamily.id;
        }

        // 檢查familyId是否為有效UUID
        const isValidUUID = (id: string) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(id);
        };

        if (!targetFamilyId || !isValidUUID(targetFamilyId)) {
          Alert.alert(
            t('todos.error'),
            t('todos.invalidSpace')
          );
          return;
        }

        const createParams: CreateTodoParams = {
          familyId: targetFamilyId,
          title,
          description,
          priority: priority as any,
          dueDate,
          assignedTo: user.id,
        };

        await todoService.createTodo(createParams);
      }
      await loadTodos();
      setEditingTodo(undefined);
    } catch (error) {
      console.error('操作失敗:', error);
      Alert.alert(t('todos.error'), editingTodo ? t('todos.updateFailed') : t('todos.createFailed'));
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
      Alert.alert(t('todos.error'), t('todos.updateStatusFailed'));
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    Alert.alert(
      t('todos.confirmDelete'),
      t('todos.confirmDeleteMessage'),
      [
        { text: t('todos.cancel'), style: 'cancel' },
        {
          text: t('todos.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await todoService.deleteTodo(todoId);
              await loadTodos();
            } catch (error) {
              console.error('刪除失敗:', error);
              Alert.alert(t('todos.error'), t('todos.deleteFailed'));
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

  // 處理拖拽排序
  const handleDragEnd = ({ data }: { data: TodoWithUser[] }) => {
    // 保存原始狀態以備回滾
    const originalCurrentTodos = [...currentTodosRef.current];
    const originalTodos = [...todos];
    
    // *** 關鍵：立即同步更新狀態和ref ***
    currentTodosRef.current = data;
    setCurrentTodos(data);
    
    // 同步更新todos狀態
    const updatedTodos = [...todos];
    const dragUpdates = new Map();
    data.forEach((draggedTodo, newIndex) => {
      dragUpdates.set(draggedTodo.id, newIndex);
    });
    
    updatedTodos.forEach((todo, index) => {
      if (dragUpdates.has(todo.id)) {
        updatedTodos[index] = { 
          ...todo, 
          sort_order: dragUpdates.get(todo.id) 
        };
      }
    });
    setTodos(updatedTodos);
    
    // *** 後台異步處理數據庫更新 ***
    (async () => {
      setIsSorting(true);
      try {
        await todoService.updateTodoOrder(data.map((todo, index) => ({ 
          id: todo.id, 
          sort_order: index 
        })));
      } catch (error) {
        console.error('更新排序失敗:', error);
        
        // 只有失敗時才回滾
        currentTodosRef.current = originalCurrentTodos;
        setCurrentTodos(originalCurrentTodos);
        setTodos(originalTodos);
        
        Alert.alert(
          t('todos.error'), 
          t('todos.updateOrderFailed')
        );
      } finally {
        setIsSorting(false);
      }
    })();
  };

  const [currentTodos, setCurrentTodos] = useState<TodoWithUser[]>([]);
  const currentTodosRef = useRef<TodoWithUser[]>([]);

  // 同步ref和state
  useEffect(() => {
    currentTodosRef.current = currentTodos;
  }, [currentTodos]);

  // 當todos或filter改變時，更新currentTodos（但不在拖拽時）
  useEffect(() => {
    if (isSorting) return; // 拖拽時不重新計算
    
    // **移除客戶端過濾邏輯**
    // 數據庫查询已经处理了过滤，这里只需确保数据同步
    setCurrentTodos(todos);
    currentTodosRef.current = todos;
  }, [todos, isSorting]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTodos();
  }, [loadTodos]);

  // 根據當前空間顯示不同的提示信息
  const getEmptyStateMessage = () => {
    if (!activeFamily) {
      return t('todos.pleaseJoinFamily');
    }
    
    if (activeFamily.tag === 'personal') {
      return t('todos.personalSpaceEmpty');
    }
    
    if (activeFamily.id === 'meta-space') {
      return t('todos.metaSpaceEmpty');
    }
    
    return t('todos.familySpaceEmpty', { familyName: activeFamily.name });
  };

  if (!activeFamily) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{getEmptyStateMessage()}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const renderTodoItem = ({ item, drag, isActive }: RenderItemParams<TodoWithUser>) => (
    <TodoItem
      todo={item}
      onToggleComplete={handleToggleComplete}
      onDelete={handleDeleteTodo}
      onEdit={handleEditTodo}
      drag={drag}
      isActive={isActive}
    />
  );

  return (
    <View style={styles.container}>
      {/* 过滤器 */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterButton,
              filter === filterOption && styles.activeFilterButton
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === filterOption && styles.activeFilterButtonText
            ]}>
              {filterOption === 'all' ? t('todos.all') :
               filterOption === 'pending' ? t('todos.pending') :
               t('todos.completed')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 待办事项列表 */}
      {currentTodos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filter === 'all' ? 
              getEmptyStateMessage() :
              filter === 'pending' ? 
              t('todos.noTodos') : 
              t('todos.noCompletedTodos')
            }
          </Text>
          {filter === 'all' && (
            <Text style={styles.emptySubtext}>{t('todos.createFirstTodo')}</Text>
          )}
        </View>
      ) : (
        <DraggableFlatList
          data={currentTodos}
          renderItem={renderTodoItem}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          onDragBegin={() => {
            setRefreshing(false);
          }}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing && !isSorting} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          activationDistance={0}
          autoscrollSpeed={150}
          dragItemOverflow={false}
          containerStyle={{ backgroundColor: 'transparent' }}
          animationConfig={{
            damping: 25,
            mass: 0.1,
            stiffness: 120,
            overshootClamping: true,
            restSpeedThreshold: 0.01,
            restDisplacementThreshold: 0.01,
          }}
        />
      )}

      {/* 添加按钮 */}
      <TouchableOpacity
        style={[styles.addButton, isSorting && styles.addButtonSorting]}
        onPress={() => setShowAddModal(true)}
        disabled={isSorting}
      >
        {isSorting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="add" size={28} color="white" />
        )}
      </TouchableOpacity>

      {/* 排序狀態指示器 */}
      {isSorting && (
        <View style={styles.sortingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.sortingText}>{t('todos.savingOrder')}</Text>
        </View>
      )}

      {/* 添加/编辑模态框 */}
      <AddTodoModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTodo(undefined);
        }}
        onSave={handleAddTodo}
        editingTodo={editingTodo}
      />
    </View>
  );
}

// 樣式定義
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
  todoCard: {
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
  completedCard: {
    opacity: 0.6,
  },
  draggingCard: {
    opacity: 0.5,
    transform: [{ scale: 0.98 }],
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
  dragHandle: {
    padding: 8,
    marginLeft: 12,
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
  addButtonSorting: {
    backgroundColor: '#8E8E93',
    shadowOpacity: 0.1,
  },
  sortingIndicator: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sortingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  titleInput: {
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 44,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  descriptionInput: {
    fontSize: 14,
    color: '#1C1C1E',
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedPriorityButton: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityIcon: {
    marginRight: 6,
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedPriorityButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  bottomSpacer: {
    height: 40,
  },
}); 