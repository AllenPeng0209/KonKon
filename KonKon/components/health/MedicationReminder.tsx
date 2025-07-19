import { healthService, Medication } from '@/lib/healthService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MedicationReminderProps {
  userId?: string;
  familyId?: string;
}

interface TodayMedication {
  medication: Medication;
  reminderTimes: string[];
  takenTimes: Array<{
    time: string;
    status: 'taken' | 'missed' | 'skipped' | 'delayed';
  }>;
}

const MedicationReminder: React.FC<MedicationReminderProps> = ({
  userId,
  familyId,
}) => {
  const [todayMedications, setTodayMedications] = useState<TodayMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // 添加用藥表單狀態
  const [medicationName, setMedicationName] = useState('');
  const [medicationType, setMedicationType] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg');
  const [frequency, setFrequency] = useState('每日一次');
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [reminderTimes, setReminderTimes] = useState<string[]>(['08:00']);
  const [prescribedBy, setPrescribedBy] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonMedicationTypes = [
    '降壓藥', '降糖藥', '心臟藥物', '抗凝血藥',
    '維他命', '鈣片', '保健品', '其他'
  ];

  const commonUnits = ['mg', 'ml', '粒', '錠', '包', '滴'];

  const frequencyOptions = [
    '每日一次', '每日兩次', '每日三次', '每日四次',
    '每週一次', '每兩天一次', '按需服用'
  ];

  useEffect(() => {
    loadTodayMedications();
  }, [userId]);

  const loadTodayMedications = async () => {
    try {
      setLoading(true);
      const medications = await healthService.getTodayMedicationReminders(userId);
      setTodayMedications(medications);
    } catch (error) {
      console.error('載入今日用藥失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async () => {
    if (!medicationName.trim() || !dosage.trim()) {
      Alert.alert('錯誤', '請填寫藥物名稱和劑量');
      return;
    }

    setIsSubmitting(true);
    try {
      await healthService.addMedication({
        medication_name: medicationName.trim(),
        medication_type: medicationType || null,
        dosage: dosage.trim(),
        unit,
        frequency,
        times_per_day: timesPerDay,
        reminder_times: reminderTimes,
        prescribed_by: prescribedBy.trim() || null,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0] || null,
        notes: notes.trim() || null,
      }, familyId);

      Alert.alert('成功', '用藥記錄已添加', [
        {
          text: '確定',
          onPress: () => {
            setShowAddModal(false);
            resetAddForm();
            loadTodayMedications();
          }
        }
      ]);
    } catch (error) {
      Alert.alert('錯誤', error instanceof Error ? error.message : '添加失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setMedicationName('');
    setMedicationType('');
    setDosage('');
    setUnit('mg');
    setFrequency('每日一次');
    setTimesPerDay(1);
    setReminderTimes(['08:00']);
    setPrescribedBy('');
    setStartDate(new Date());
    setEndDate(null);
    setNotes('');
  };

  const handleLogMedication = async (
    medication: Medication,
    reminderTime: string,
    status: 'taken' | 'missed' | 'skipped' | 'delayed'
  ) => {
    try {
      const today = new Date();
      const [hours, minutes] = reminderTime.split(':');
      const scheduledTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
      
      await healthService.logMedicationTaken(
        medication.id,
        scheduledTime,
        status === 'taken' ? new Date() : undefined,
        status
      );

      loadTodayMedications();
      
      const statusMessages = {
        taken: '已記錄服藥',
        missed: '已標記為錯過',
        skipped: '已標記為跳過',
        delayed: '已標記為延遲'
      };

      Alert.alert('記錄成功', statusMessages[status]);
    } catch (error) {
      Alert.alert('錯誤', error instanceof Error ? error.message : '記錄失敗');
    }
  };

  const addReminderTime = () => {
    const newTime = '08:00';
    setReminderTimes([...reminderTimes, newTime]);
    setTimesPerDay(reminderTimes.length + 1);
  };

  const updateReminderTime = (index: number, time: string) => {
    const updated = [...reminderTimes];
    updated[index] = time;
    setReminderTimes(updated);
  };

  const removeReminderTime = (index: number) => {
    if (reminderTimes.length > 1) {
      const updated = reminderTimes.filter((_, i) => i !== index);
      setReminderTimes(updated);
      setTimesPerDay(updated.length);
    }
  };

  const renderMedicationCard = (item: TodayMedication) => {
    const { medication, reminderTimes, takenTimes } = item;
    
    return (
      <View key={medication.id} style={styles.medicationCard}>
        <View style={styles.medicationHeader}>
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{medication.medication_name}</Text>
            <Text style={styles.medicationDetails}>
              {medication.dosage}{medication.unit} • {medication.frequency}
            </Text>
            {medication.medication_type && (
              <Text style={styles.medicationType}>{medication.medication_type}</Text>
            )}
          </View>
          <View style={styles.medicationStatus}>
            {(() => {
              const totalReminders = reminderTimes.length;
              const completedCount = takenTimes.filter(t => t.status === 'taken').length;
              const progress = totalReminders > 0 ? completedCount / totalReminders : 0;
              
              return (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    {completedCount}/{totalReminders}
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                  </View>
                </View>
              );
            })()}
          </View>
        </View>

        <View style={styles.reminderTimesContainer}>
          {reminderTimes.map((time, index) => {
            const takenTime = takenTimes.find(t => t.time === time);
            const isPastTime = new Date().getHours() * 60 + new Date().getMinutes() > 
                              parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
            
            return (
              <View key={index} style={styles.reminderTimeItem}>
                <View style={styles.reminderTimeInfo}>
                  <Text style={styles.reminderTime}>{time}</Text>
                  {takenTime && (
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor: takenTime.status === 'taken' ? '#4CAF50' :
                                       takenTime.status === 'missed' ? '#FF5722' :
                                       takenTime.status === 'skipped' ? '#FFA726' : '#2196F3'
                      }
                    ]}>
                      <Text style={styles.statusText}>
                        {takenTime.status === 'taken' ? '已服用' :
                         takenTime.status === 'missed' ? '錯過' :
                         takenTime.status === 'skipped' ? '跳過' : '延遲'}
                      </Text>
                    </View>
                  )}
                </View>

                {!takenTime && (
                  <View style={styles.reminderActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.takenButton]}
                      onPress={() => handleLogMedication(medication, time, 'taken')}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>已服用</Text>
                    </TouchableOpacity>
                    
                    {isPastTime && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.missedButton]}
                        onPress={() => handleLogMedication(medication, time, 'missed')}
                      >
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>錯過</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderAddMedicationModal = () => (
    <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>添加用藥記錄</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* 藥物基本信息 */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>藥物基本信息</Text>
            
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>藥物名稱 *</Text>
              <TextInput
                style={styles.textInput}
                value={medicationName}
                onChangeText={setMedicationName}
                placeholder="請輸入藥物名稱"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>藥物類型</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsContainer}>
                  {commonMedicationTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.optionButton,
                        medicationType === type && styles.optionButtonActive
                      ]}
                      onPress={() => setMedicationType(type)}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        medicationType === type && styles.optionButtonTextActive
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, styles.formFieldHalf]}>
                <Text style={styles.fieldLabel}>劑量 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder="5"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formField, styles.formFieldHalf]}>
                <Text style={styles.fieldLabel}>單位</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsContainer}>
                    {commonUnits.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.optionButton,
                          unit === u && styles.optionButtonActive
                        ]}
                        onPress={() => setUnit(u)}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          unit === u && styles.optionButtonTextActive
                        ]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* 服用頻率 */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>服用頻率</Text>
            
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>頻率</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsContainer}>
                  {frequencyOptions.map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.optionButton,
                        frequency === freq && styles.optionButtonActive
                      ]}
                      onPress={() => setFrequency(freq)}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        frequency === freq && styles.optionButtonTextActive
                      ]}>
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>提醒時間</Text>
              {reminderTimes.map((time, index) => (
                <View key={index} style={styles.reminderTimeRow}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      setEditingTimeIndex(index);
                      setShowTimePicker(true);
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.timeButtonText}>{time}</Text>
                  </TouchableOpacity>
                  
                  {reminderTimes.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeTimeButton}
                      onPress={() => removeReminderTime(index)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF5722" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addTimeButton}
                onPress={addReminderTime}
              >
                <Ionicons name="add" size={20} color="#4CAF50" />
                <Text style={styles.addTimeButtonText}>添加提醒時間</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 處方信息 */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>處方信息</Text>
            
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>處方醫生</Text>
              <TextInput
                style={styles.textInput}
                value={prescribedBy}
                onChangeText={setPrescribedBy}
                placeholder="醫生姓名"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, styles.formFieldHalf]}>
                <Text style={styles.fieldLabel}>開始日期</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleDateString('zh-TW')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.formField, styles.formFieldHalf]}>
                <Text style={styles.fieldLabel}>結束日期（可選）</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dateButtonText}>
                    {endDate ? endDate.toLocaleDateString('zh-TW') : '長期服用'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 備註 */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>備註</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="服用注意事項、副作用等"
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* 提交按鈕 */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!medicationName.trim() || !dosage.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleAddMedication}
            disabled={!medicationName.trim() || !dosage.trim() || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? '添加中...' : '添加用藥記錄'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 日期時間選擇器 */}
        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              setEndDate(selectedDate || null);
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={new Date(`2000-01-01T${reminderTimes[editingTimeIndex]}:00`)}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const timeString = selectedTime.toLocaleTimeString('zh-TW', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
                updateReminderTime(editingTimeIndex, timeString);
              }
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>今日用藥提醒</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>添加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {todayMedications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>暫無用藥記錄</Text>
            <Text style={styles.emptySubtext}>點擊右上角"添加"按鈕開始記錄用藥</Text>
          </View>
        ) : (
          todayMedications.map(renderMedicationCard)
        )}
      </ScrollView>

      {renderAddMedicationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    textAlign: 'center',
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  medicationType: {
    fontSize: 12,
    color: '#9C27B0',
    backgroundColor: '#9C27B020',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  medicationStatus: {
    alignItems: 'flex-end',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  reminderTimesContainer: {
    gap: 12,
  },
  reminderTimeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  reminderTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  takenButton: {
    backgroundColor: '#4CAF50',
  },
  missedButton: {
    backgroundColor: '#FF5722',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Modal 樣式
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formFieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    height: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  optionButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  reminderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  removeTimeButton: {
    padding: 8,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    gap: 8,
  },
  addTimeButtonText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MedicationReminder; 