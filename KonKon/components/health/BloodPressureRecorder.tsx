import { BloodPressureData, healthService } from '@/lib/healthService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BloodPressureRecorderProps {
  visible: boolean;
  onClose: () => void;
  onRecorded: (record: any) => void;
  familyId?: string;
}

const BloodPressureRecorder: React.FC<BloodPressureRecorderProps> = ({
  visible,
  onClose,
  onRecorded,
  familyId,
}) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');
  const [measurementTime, setMeasurementTime] = useState(new Date());
  const [measurementLocation, setMeasurementLocation] = useState('家中');
  const [deviceName, setDeviceName] = useState('');
  const [hasSymptoms, setHasSymptoms] = useState(false);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 常見症狀選項
  const commonSymptoms = [
    '頭痛', '頭暈', '胸悶', '心悸',
    '呼吸困難', '噁心', '視線模糊', '疲勞'
  ];

  const resetForm = () => {
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNotes('');
    setMeasurementTime(new Date());
    setMeasurementLocation('家中');
    setDeviceName('');
    setHasSymptoms(false);
    setSymptoms([]);
  };

  const validateInput = (): boolean => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);

    if (!systolic || !diastolic) {
      Alert.alert('錯誤', '請輸入收縮壓和舒張壓');
      return false;
    }

    if (sys < 50 || sys > 250) {
      Alert.alert('錯誤', '收縮壓應在50-250之間');
      return false;
    }

    if (dia < 30 || dia > 150) {
      Alert.alert('錯誤', '舒張壓應在30-150之間');
      return false;
    }

    if (sys <= dia) {
      Alert.alert('錯誤', '收縮壓應高於舒張壓');
      return false;
    }

    if (pulse && (parseInt(pulse) < 30 || parseInt(pulse) > 200)) {
      Alert.alert('錯誤', '脈搏應在30-200之間');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput()) return;

    setIsSubmitting(true);
    try {
      const data: BloodPressureData = {
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: pulse ? parseInt(pulse) : undefined,
        notes: notes.trim() || undefined,
        measurementTime,
        measurementLocation: measurementLocation.trim() || undefined,
        deviceName: deviceName.trim() || undefined,
        hasSymptoms,
        symptoms: hasSymptoms && symptoms.length > 0 ? symptoms : undefined,
      };

      const record = await healthService.recordBloodPressure(data, familyId);
      
      Alert.alert(
        '記錄成功',
        '血壓數據已記錄',
        [
          {
            text: '確定',
            onPress: () => {
              onRecorded(record);
              resetForm();
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('錯誤', error instanceof Error ? error.message : '記錄失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const getBloodPressureCategory = (sys: number, dia: number) => {
    return healthService.getBloodPressureCategory(sys, dia);
  };

  const currentCategory = systolic && diastolic ? 
    getBloodPressureCategory(parseInt(systolic), parseInt(diastolic)) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>記錄血壓</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 血壓輸入 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>血壓測量</Text>
            
            <View style={styles.bpInputContainer}>
              <View style={styles.bpInput}>
                <Text style={styles.bpLabel}>收縮壓</Text>
                <TextInput
                  style={styles.bpValue}
                  value={systolic}
                  onChangeText={setSystolic}
                  placeholder="120"
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.bpUnit}>mmHg</Text>
              </View>
              
              <Text style={styles.bpSeparator}>/</Text>
              
              <View style={styles.bpInput}>
                <Text style={styles.bpLabel}>舒張壓</Text>
                <TextInput
                  style={styles.bpValue}
                  value={diastolic}
                  onChangeText={setDiastolic}
                  placeholder="80"
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.bpUnit}>mmHg</Text>
              </View>
            </View>

            {/* 血壓分類顯示 */}
            {currentCategory && (
              <View style={[styles.categoryBadge, { backgroundColor: currentCategory.color + '20' }]}>
                <Text style={[styles.categoryText, { color: currentCategory.color }]}>
                  {currentCategory.label}
                </Text>
                <Text style={styles.categoryDescription}>
                  {currentCategory.description}
                </Text>
              </View>
            )}
          </View>

          {/* 脈搏 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>脈搏（選填）</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.pulseInput}
                value={pulse}
                onChangeText={setPulse}
                placeholder="72"
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.unit}>次/分</Text>
            </View>
          </View>

          {/* 測量時間 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>測量時間</Text>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>
                {measurementTime.toLocaleDateString('zh-TW')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>
                {measurementTime.toLocaleTimeString('zh-TW', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 測量地點 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>測量地點</Text>
            <View style={styles.locationButtons}>
              {['家中', '醫院', '藥局', '其他'].map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.locationButton,
                    measurementLocation === location && styles.locationButtonActive
                  ]}
                  onPress={() => setMeasurementLocation(location)}
                >
                  <Text style={[
                    styles.locationButtonText,
                    measurementLocation === location && styles.locationButtonTextActive
                  ]}>
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 測量設備 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>測量設備（選填）</Text>
            <TextInput
              style={styles.textInput}
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="血壓計品牌/型號"
            />
          </View>

          {/* 症狀 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>是否有症狀</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>有不適症狀</Text>
              <Switch
                value={hasSymptoms}
                onValueChange={setHasSymptoms}
                trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
                thumbColor={hasSymptoms ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>

            {hasSymptoms && (
              <View style={styles.symptomsContainer}>
                <Text style={styles.symptomsTitle}>選擇症狀：</Text>
                <View style={styles.symptomsGrid}>
                  {commonSymptoms.map((symptom) => (
                    <TouchableOpacity
                      key={symptom}
                      style={[
                        styles.symptomButton,
                        symptoms.includes(symptom) && styles.symptomButtonActive
                      ]}
                      onPress={() => toggleSymptom(symptom)}
                    >
                      <Text style={[
                        styles.symptomButtonText,
                        symptoms.includes(symptom) && styles.symptomButtonTextActive
                      ]}>
                        {symptom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* 備註 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>備註（選填）</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="記錄測量前的活動、心情或其他相關資訊"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* 提交按鈕 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!systolic || !diastolic || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!systolic || !diastolic || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? '記錄中...' : '記錄血壓'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 日期選擇器 */}
        {showDatePicker && (
          <DateTimePicker
            value={measurementTime}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const newDateTime = new Date(measurementTime);
                newDateTime.setFullYear(selectedDate.getFullYear());
                newDateTime.setMonth(selectedDate.getMonth());
                newDateTime.setDate(selectedDate.getDate());
                setMeasurementTime(newDateTime);
              }
            }}
          />
        )}

        {/* 時間選擇器 */}
        {showTimePicker && (
          <DateTimePicker
            value={measurementTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const newDateTime = new Date(measurementTime);
                newDateTime.setHours(selectedTime.getHours());
                newDateTime.setMinutes(selectedTime.getMinutes());
                setMeasurementTime(newDateTime);
              }
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  bpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bpInput: {
    alignItems: 'center',
    flex: 1,
  },
  bpLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bpValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    minWidth: 80,
    paddingBottom: 4,
  },
  bpUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bpSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#999',
    marginHorizontal: 16,
  },
  categoryBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
    textAlign: 'center',
  },
  unit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  locationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  locationButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#666',
  },
  locationButtonTextActive: {
    color: '#FFFFFF',
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  symptomsContainer: {
    marginTop: 16,
  },
  symptomsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  symptomButtonActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  symptomButtonText: {
    fontSize: 12,
    color: '#666',
  },
  symptomButtonTextActive: {
    color: '#FFFFFF',
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
  },
  footer: {
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

export default BloodPressureRecorder; 