import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRecurringEvents } from '../hooks/useRecurringEvents';
import { RecurrenceInstance } from '../lib/recurrenceEngine';
import RecurrenceRuleEditor from './RecurrenceRuleEditor';

interface RecurringEventManagerProps {
  parentEventId: string;
  onClose: () => void;
}

export default function RecurringEventManager({
  parentEventId,
  onClose,
}: RecurringEventManagerProps) {
  const {
    loading,
    error,
    getRecurringEventInstances,
    modifyRecurringEventInstance,
    cancelRecurringEventInstance,
    deleteRecurringSeries,
    modifyRecurringSeriesFromDate,
  } = useRecurringEvents();

  const [instances, setInstances] = useState<RecurrenceInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<RecurrenceInstance | null>(null);
  const [actionType, setActionType] = useState<'modify' | 'cancel' | 'series' | null>(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);

  useEffect(() => {
    loadInstances();
  }, [parentEventId]);

  const loadInstances = async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6); // 加载6个月的实例

    const instancesData = await getRecurringEventInstances(parentEventId, startDate, endDate);
    setInstances(instancesData);
  };

  const handleInstanceAction = (instance: RecurrenceInstance, action: 'modify' | 'cancel') => {
    setSelectedInstance(instance);
    setActionType(action);

    if (action === 'cancel') {
      showCancelConfirmation(instance);
    } else {
      showModifyOptions(instance);
    }
  };

  const showCancelConfirmation = (instance: RecurrenceInstance) => {
    Alert.alert(
      '取消事件',
      `确定要取消 ${instance.start.toLocaleDateString('zh-CN')} 的这个事件吗？`,
      [
        { text: '保留', style: 'cancel' },
        {
          text: '取消事件',
          style: 'destructive',
          onPress: () => cancelInstance(instance),
        },
      ]
    );
  };

  const showModifyOptions = (instance: RecurrenceInstance) => {
    Alert.alert(
      '修改重复事件',
      '选择修改范围',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '仅此事件',
          onPress: () => modifyOnlyThisEvent(instance),
        },
        {
          text: '此事件及以后',
          onPress: () => modifyThisAndFutureEvents(instance),
        },
      ]
    );
  };

  const cancelInstance = async (instance: RecurrenceInstance) => {
    const success = await cancelRecurringEventInstance(parentEventId, instance.start);
    if (success) {
      Alert.alert('成功', '事件已取消');
      loadInstances();
    }
  };

  const modifyOnlyThisEvent = async (instance: RecurrenceInstance) => {
    // 这里应该打开事件编辑界面
    // 暂时显示提示
    Alert.alert('功能开发中', '单个事件修改功能正在开发中');
  };

  const modifyThisAndFutureEvents = (instance: RecurrenceInstance) => {
    setSelectedInstance(instance);
    setActionType('series');
    setShowRuleEditor(true);
  };

  const handleDeleteSeries = () => {
    Alert.alert(
      '删除重复事件',
      '确定要删除整个重复事件系列吗？这将删除所有相关的事件。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteRecurringSeries(parentEventId);
            if (success) {
              Alert.alert('成功', '重复事件系列已删除');
              onClose();
            }
          },
        },
      ]
    );
  };

  const renderInstance = (instance: RecurrenceInstance, index: number) => {
    const isException = instance.isException;
    const isPast = instance.start < new Date();

    return (
      <View key={index} style={[styles.instanceCard, isException && styles.exceptionCard]}>
        <View style={styles.instanceHeader}>
          <View style={styles.instanceDate}>
            <Text style={styles.dateText}>
              {instance.start.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
              })}
            </Text>
            <Text style={styles.timeText}>
              {instance.start.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {isException && (
            <View style={styles.exceptionBadge}>
              <Text style={styles.exceptionText}>
                {instance.exceptionType === 'cancelled' && '已取消'}
                {instance.exceptionType === 'modified' && '已修改'}
                {instance.exceptionType === 'moved' && '已移动'}
              </Text>
            </View>
          )}

          {!isPast && !isException && (
            <View style={styles.instanceActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleInstanceAction(instance, 'modify')}
              >
                <Text style={styles.actionButtonText}>修改</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleInstanceAction(instance, 'cancel')}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>取消</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose}>
        <Text style={styles.closeButton}>关闭</Text>
      </TouchableOpacity>
      <Text style={styles.title}>重复事件管理</Text>
      <TouchableOpacity onPress={handleDeleteSeries}>
        <Text style={styles.deleteButton}>删除系列</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            即将到来的事件 ({instances.filter(i => i.start >= new Date()).length})
          </Text>
          {instances
            .filter(i => i.start >= new Date())
            .slice(0, 20) // 只显示前20个
            .map((instance, index) => renderInstance(instance, index))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            过去的事件 ({instances.filter(i => i.start < new Date()).length})
          </Text>
          {instances
            .filter(i => i.start < new Date())
            .slice(-10) // 只显示最近10个
            .map((instance, index) => renderInstance(instance, index))}
        </View>
      </ScrollView>

      <Modal
        visible={showRuleEditor}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <RecurrenceRuleEditor
          onRuleChange={(rule) => {
            if (rule && selectedInstance) {
              // 修改从选定日期开始的所有事件
              modifyRecurringSeriesFromDate(parentEventId, selectedInstance.start, {
                recurrenceRule: rule,
              }).then((success) => {
                if (success) {
                  Alert.alert('成功', '重复事件系列已更新');
                  loadInstances();
                }
              });
            }
            setShowRuleEditor(false);
            setSelectedInstance(null);
            setActionType(null);
          }}
          onCancel={() => {
            setShowRuleEditor(false);
            setSelectedInstance(null);
            setActionType(null);
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  deleteButton: {
    fontSize: 16,
    color: '#ff3b30',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exceptionCard: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  instanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instanceDate: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  exceptionBadge: {
    backgroundColor: '#ff9500',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 8,
  },
  exceptionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  instanceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButtonText: {
    color: '#fff',
  },
});