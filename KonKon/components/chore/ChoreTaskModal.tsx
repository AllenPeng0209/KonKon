import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { ChoreTaskService, ChoreTaskWithDetails } from '@/lib/choreService';
import { useAuth } from '@/contexts/AuthContext';

interface ChoreTaskModalProps {
  visible: boolean;
  task: ChoreTaskWithDetails | null;
  onClose: () => void;
  onTaskUpdated: () => void;
  familyMembers: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
}

export default function ChoreTaskModal({
  visible,
  task,
  onClose,
  onTaskUpdated,
  familyMembers,
}: ChoreTaskModalProps) {
  const { user } = useAuth();
  const [completionNotes, setCompletionNotes] = useState('');
  const [timeTaken, setTimeTaken] = useState('');
  const [qualityRating, setQualityRating] = useState(5);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (task) {
      setCompletionNotes('');
      setTimeTaken(task.estimated_duration?.toString() || '');
      setQualityRating(5);
    }
  }, [task]);

  if (!task) return null;

  const handleMarkCompleted = async () => {
    if (!user) {
      Alert.alert('錯誤', '請先登入');
      return;
    }

    try {
      setIsUpdating(true);

      const completionData = {
        notes: completionNotes.trim() || undefined,
        timeTaken: timeTaken ? parseInt(timeTaken, 10) : undefined,
        qualityRating,
      };

      await ChoreTaskService.markCompleted(task.id, user.id, completionData);
      
      Alert.alert('恭喜！', '家務任務已完成，獲得積分獎勵！', [
        { text: '確定', onPress: onTaskUpdated }
      ]);
    } catch (error) {
      console.error('Error marking task completed:', error);
      Alert.alert('錯誤', '標記完成時發生錯誤');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (status: 'pending' | 'in_progress' | 'cancelled') => {
    try {
      setIsUpdating(true);
      await ChoreTaskService.update(task.id, { status });
      onTaskUpdated();
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('錯誤', '更新狀態時發生錯誤');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      '確認刪除',
      '確定要刪除這個家務任務嗎？此操作無法撤銷。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              await ChoreTaskService.delete(task.id);
              onTaskUpdated();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('錯誤', '刪除任務時發生錯誤');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

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

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 5: return '高';
      case 4: return '中高';
      case 3: return '中等';
      case 2: return '中低';
      case 1: return '低';
      default: return '中等';
    }
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return '無截止時間';
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const dateStr = date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (diffDays < 0) return `${dateStr} (已逾期)`;
    if (diffDays === 0) return `${dateStr} (今天到期)`;
    if (diffDays === 1) return `${dateStr} (明天到期)`;
    return `${dateStr} (${diffDays}天後)`;
  };

  const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();
  const canComplete = task.status === 'pending' || task.status === 'in_progress';
  const canUpdate = task.status !== 'completed';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 標題欄 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>關閉</Text>
          </TouchableOpacity>
          <Text style={styles.title}>家務詳情</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 基本信息 */}
          <View style={styles.section}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(task.status) }
              ]}>
                <Text style={styles.statusText}>
                  {getStatusText(task.status)}
                </Text>
              </View>
            </View>

            {task.description && (
              <Text style={styles.taskDescription}>{task.description}</Text>
            )}

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>分類</Text>
                <Text style={styles.metaValue}>{task.category}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>優先級</Text>
                <Text style={styles.metaValue}>
                  {getPriorityText(task.priority || 3)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>分配給</Text>
                <Text style={styles.metaValue}>
                  {task.assigned_member?.name || '未分配'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>預估時間</Text>
                <Text style={styles.metaValue}>
                  {task.estimated_duration ? `${task.estimated_duration}分鐘` : '未設定'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>積分獎勵</Text>
                <Text style={styles.metaValue}>
                  {task.points_reward || 0} 分
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>截止時間</Text>
                <Text style={[
                  styles.metaValue,
                  isOverdue && styles.overdueText
                ]}>
                  {formatDueDate(task.due_date)}
                </Text>
              </View>
            </View>
          </View>

          {/* 完成任務區域（僅當可以完成時顯示） */}
          {canComplete && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>完成任務</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>完成備註</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={completionNotes}
                  onChangeText={setCompletionNotes}
                  placeholder="描述完成情況或遇到的問題..."
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>實際用時（分鐘）</Text>
                <TextInput
                  style={styles.textInput}
                  value={timeTaken}
                  onChangeText={setTimeTaken}
                  placeholder="輸入實際花費的時間"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>完成質量評分</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingButton,
                        qualityRating >= rating && styles.ratingButtonActive
                      ]}
                      onPress={() => setQualityRating(rating)}
                    >
                      <Text style={[
                        styles.ratingButtonText,
                        qualityRating >= rating && styles.ratingButtonTextActive
                      ]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.completeButton, isUpdating && styles.buttonDisabled]}
                onPress={handleMarkCompleted}
                disabled={isUpdating}
              >
                <Text style={styles.completeButtonText}>
                  {isUpdating ? '完成中...' : '標記為完成'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 操作按鈕區域 */}
          {canUpdate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>操作</Text>
              
              <View style={styles.actionButtons}>
                {task.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.startButton]}
                    onPress={() => handleUpdateStatus('in_progress')}
                    disabled={isUpdating}
                  >
                    <Text style={styles.actionButtonText}>開始執行</Text>
                  </TouchableOpacity>
                )}
                
                {task.status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.pauseButton]}
                    onPress={() => handleUpdateStatus('pending')}
                    disabled={isUpdating}
                  >
                    <Text style={styles.actionButtonText}>暫停</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleUpdateStatus('cancelled')}
                  disabled={isUpdating}
                >
                  <Text style={styles.actionButtonText}>取消任務</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 危險操作區域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>危險操作</Text>
            <TouchableOpacity
              style={[styles.deleteButton, isUpdating && styles.buttonDisabled]}
              onPress={handleDeleteTask}
              disabled={isUpdating}
            >
              <Text style={styles.deleteButtonText}>刪除任務</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaGrid: {
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  overdueText: {
    color: '#EF4444',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  ratingButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  ratingButtonText: {
    fontSize: 20,
    color: '#D1D5DB',
  },
  ratingButtonTextActive: {
    color: '#F59E0B',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  bottomPadding: {
    height: 32,
  },
});