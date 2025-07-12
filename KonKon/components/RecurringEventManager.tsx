import { t } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { RecurringEventData, useRecurringEvents } from '../hooks/useRecurringEvents';
import { RecurrenceInstance, RecurrenceRule } from '../lib/recurrenceEngine';
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
  const [seriesRule, setSeriesRule] = useState<RecurrenceRule | null>(null);

  useEffect(() => {
    loadInstances();
  }, [parentEventId]);

  const loadInstances = async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6); // 加载6个月的实例

    const { instances: instancesData, rule } = await getRecurringEventInstances(parentEventId, startDate, endDate);
    setInstances(instancesData);
    setSeriesRule(rule);
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
      t('recurringEventManager.cancelEvent'),
      t('recurringEventManager.cancelConfirmation', { date: instance.start.toLocaleDateString() }),
      [
        { text: t('recurringEventManager.keep'), style: 'cancel' },
        {
          text: t('recurringEventManager.cancelThisEvent'),
          style: 'destructive',
          onPress: () => cancelInstance(instance),
        },
      ]
    );
  };

  const showModifyOptions = (instance: RecurrenceInstance) => {
    Alert.alert(
      t('recurringEventManager.modifyRecurringEvent'),
      t('recurringEventManager.modifyScope'),
      [
        { text: t('recurringEventManager.cancel'), style: 'cancel' },
        {
          text: t('recurringEventManager.onlyThisEvent'),
          onPress: () => modifyOnlyThisEvent(instance),
        },
        {
          text: t('recurringEventManager.thisAndFutureEvents'),
          onPress: () => modifyThisAndFutureEvents(instance),
        },
      ]
    );
  };

  const cancelInstance = async (instance: RecurrenceInstance) => {
    const success = await cancelRecurringEventInstance(parentEventId, instance.start);
    if (success) {
      Alert.alert(t('recurringEventManager.success'), t('recurringEventManager.eventCancelled'));
      loadInstances();
    }
  };

  const modifyOnlyThisEvent = async (instance: RecurrenceInstance) => {
    // 这里应该打开事件编辑界面
    // 暂时显示提示
    Alert.alert(t('recurringEventManager.featureInProgress'), t('recurringEventManager.singleEventModificationInDev'));
  };

  const modifyThisAndFutureEvents = (instance: RecurrenceInstance) => {
    setSelectedInstance(instance);
    setActionType('series');
    setShowRuleEditor(true);
  };

  const handleDeleteSeries = () => {
    Alert.alert(
      t('recurringEventManager.deleteRecurringSeries'),
      t('recurringEventManager.deleteSeriesConfirmation'),
      [
        { text: t('recurringEventManager.cancel'), style: 'cancel' },
        {
          text: t('recurringEventManager.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteRecurringSeries(parentEventId);
            if (success) {
              Alert.alert(t('recurringEventManager.success'), t('recurringEventManager.seriesDeleted'));
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
              {instance.start.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
              })}
            </Text>
            <Text style={styles.timeText}>
              {instance.start.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {isException && (
            <View style={styles.exceptionBadge}>
              <Text style={styles.exceptionText}>
                {instance.exceptionType === 'cancelled' && t('recurringEventManager.cancelled')}
                {instance.exceptionType === 'modified' && t('recurringEventManager.modified')}
                {instance.exceptionType === 'moved' && t('recurringEventManager.moved')}
              </Text>
            </View>
          )}

          {!isPast && !isException && (
            <View style={styles.instanceActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleInstanceAction(instance, 'modify')}
              >
                <Text style={styles.actionButtonText}>{t('recurringEventManager.modify')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleInstanceAction(instance, 'cancel')}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>{t('recurringEventManager.cancel')}</Text>
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
        <Text style={styles.closeButton}>{t('recurringEventManager.close')}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{t('recurringEventManager.manageRecurringEvent')}</Text>
      <TouchableOpacity onPress={handleDeleteSeries}>
        <Text style={styles.deleteButton}>{t('recurringEventManager.deleteSeries')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('recurringEventManager.loading')}</Text>
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
            {t('recurringEventManager.upcomingEvents', { count: instances.filter(i => i.start >= new Date()).length })}
          </Text>
          {instances
            .filter(i => i.start >= new Date())
            .slice(0, 20) // 只显示前20个
            .map((instance, index) => renderInstance(instance, index))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('recurringEventManager.pastEvents', { count: instances.filter(i => i.start < new Date()).length })}
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
          initialRule={seriesRule || undefined}
          onCancel={() => setShowRuleEditor(false)}
          onRuleChange={(newRule) => {
            if (newRule && selectedInstance) {
              // The hook expects a Partial<RecurringEventData>, so we wrap the new rule
              const eventUpdate: Partial<RecurringEventData> = { recurrenceRule: newRule };
              modifyRecurringSeriesFromDate(
                parentEventId,
                selectedInstance.start,
                eventUpdate
              ).then((success) => {
                if (success) {
                  Alert.alert(t('recurringEventManager.success'), t('recurringEventManager.seriesUpdated'));
                  loadInstances();
                }
                setShowRuleEditor(false);
              });
            } else {
              setShowRuleEditor(false);
            }
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