import { healthService, InsertHealthCheckup } from '@/lib/healthService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HealthCheckupFormProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (checkup: any) => void;
  familyId?: string;
}

const HealthCheckupForm: React.FC<HealthCheckupFormProps> = ({
  visible,
  onClose,
  onSaved,
  familyId,
}) => {
  // 基本信息
  const [checkupType, setCheckupType] = useState('定期健診');
  const [checkupDate, setCheckupDate] = useState(new Date());
  const [medicalFacility, setMedicalFacility] = useState('');
  const [doctorName, setDoctorName] = useState('');

  // 基本測量數據
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [restingHeartRate, setRestingHeartRate] = useState('');

  // 血液檢查數據
  const [totalCholesterol, setTotalCholesterol] = useState('');
  const [ldlCholesterol, setLdlCholesterol] = useState('');
  const [hdlCholesterol, setHdlCholesterol] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [hba1c, setHba1c] = useState('');

  // 其他檢查項目
  const [chestXray, setChestXray] = useState('');
  const [ecgResult, setEcgResult] = useState('');

  // 診斷和建議
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkupTypes = [
    '定期健診', '人間ドック', '特定健診', '企業健診', 
    '学校健診', '生活習慣病検診', 'がん検診', '婦人科検診'
  ];

  const chestXrayOptions = ['正常', '異常なし', '要経過観察', '要精密検査', '治療中'];
  const ecgOptions = ['正常', '異常なし', '軽度異常', '要精密検査', '治療中'];

  const resetForm = () => {
    setCheckupType('定期健診');
    setCheckupDate(new Date());
    setMedicalFacility('');
    setDoctorName('');
    setHeight('');
    setWeight('');
    setBmi('');
    setSystolicBp('');
    setDiastolicBp('');
    setRestingHeartRate('');
    setTotalCholesterol('');
    setLdlCholesterol('');
    setHdlCholesterol('');
    setTriglycerides('');
    setBloodSugar('');
    setHba1c('');
    setChestXray('');
    setEcgResult('');
    setDiagnosis('');
    setRecommendations('');
    setFollowUpRequired(false);
    setFollowUpDate(null);
  };

  const calculateBMI = (heightValue: string, weightValue: string) => {
    const h = parseFloat(heightValue);
    const w = parseFloat(weightValue);
    if (h > 0 && w > 0) {
      const bmiValue = w / ((h / 100) ** 2);
      setBmi(bmiValue.toFixed(1));
    }
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    if (weight) {
      calculateBMI(value, weight);
    }
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
    if (height) {
      calculateBMI(height, value);
    }
  };

  const handleSubmit = async () => {
    if (!checkupType) {
      Alert.alert('錯誤', '請選擇檢查類型');
      return;
    }

    setIsSubmitting(true);
    try {
      const checkupData: InsertHealthCheckup = {
        checkup_type: checkupType,
        checkup_date: checkupDate.toISOString().split('T')[0],
        medical_facility: medicalFacility.trim() || null,
        doctor_name: doctorName.trim() || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        systolic_bp: systolicBp ? parseInt(systolicBp) : null,
        diastolic_bp: diastolicBp ? parseInt(diastolicBp) : null,
        resting_heart_rate: restingHeartRate ? parseInt(restingHeartRate) : null,
        total_cholesterol: totalCholesterol ? parseInt(totalCholesterol) : null,
        ldl_cholesterol: ldlCholesterol ? parseInt(ldlCholesterol) : null,
        hdl_cholesterol: hdlCholesterol ? parseInt(hdlCholesterol) : null,
        triglycerides: triglycerides ? parseInt(triglycerides) : null,
        blood_sugar: bloodSugar ? parseInt(bloodSugar) : null,
        hba1c: hba1c ? parseFloat(hba1c) : null,
        chest_xray: chestXray || null,
        ecg_result: ecgResult || null,
        diagnosis: diagnosis.trim() || null,
        recommendations: recommendations.trim() || null,
        follow_up_required: followUpRequired,
        follow_up_date: followUpDate?.toISOString().split('T')[0] || null,
      };

      const result = await healthService.addHealthCheckup(checkupData, familyId);
      
      Alert.alert(
        '儲存成功',
        '健康檢查記錄已儲存',
        [
          {
            text: '確定',
            onPress: () => {
              onSaved(result);
              resetForm();
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('錯誤', error instanceof Error ? error.message : '儲存失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType?: 'default' | 'numeric' | 'decimal-pad',
    unit?: string
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, unit && styles.textInputWithUnit]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType || 'default'}
        />
        {unit && <Text style={styles.unitText}>{unit}</Text>}
      </View>
    </View>
  );

  const renderOptionButtons = (
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.optionButtons}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            selectedValue === option && styles.optionButtonActive
          ]}
          onPress={() => onSelect(option)}
        >
          <Text style={[
            styles.optionButtonText,
            selectedValue === option && styles.optionButtonTextActive
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>健康檢查記錄</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 基本信息 */}
          {renderSection(
            '檢查基本信息',
            <>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>檢查類型</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {renderOptionButtons(checkupTypes, checkupType, setCheckupType)}
                </ScrollView>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>檢查日期</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dateButtonText}>
                    {checkupDate.toLocaleDateString('zh-TW')}
                  </Text>
                </TouchableOpacity>
              </View>

              {renderFormField('醫療機構', medicalFacility, setMedicalFacility, '例：○○醫院')}
              {renderFormField('醫生姓名', doctorName, setDoctorName, '主治醫生姓名')}
            </>
          )}

          {/* 基本測量數據 */}
          {renderSection(
            '基本測量數據',
            <>
              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  {renderFormField('身高', height, handleHeightChange, '170', 'decimal-pad', 'cm')}
                </View>
                <View style={styles.formFieldHalf}>
                  {renderFormField('體重', weight, handleWeightChange, '65', 'decimal-pad', 'kg')}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  {renderFormField('BMI', bmi, setBmi, '自動計算', 'decimal-pad')}
                </View>
                <View style={styles.formFieldHalf}>
                  {renderFormField('心率', restingHeartRate, setRestingHeartRate, '72', 'numeric', 'bpm')}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  {renderFormField('收縮壓', systolicBp, setSystolicBp, '120', 'numeric', 'mmHg')}
                </View>
                <View style={styles.formFieldHalf}>
                  {renderFormField('舒張壓', diastolicBp, setDiastolicBp, '80', 'numeric', 'mmHg')}
                </View>
              </View>
            </>
          )}

          {/* 血液檢查數據 */}
          {renderSection(
            '血液檢查數據',
            <>
              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  {renderFormField('總膽固醇', totalCholesterol, setTotalCholesterol, '200', 'numeric', 'mg/dL')}
                </View>
                <View style={styles.formFieldHalf}>
                  {renderFormField('LDL膽固醇', ldlCholesterol, setLdlCholesterol, '120', 'numeric', 'mg/dL')}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  {renderFormField('HDL膽固醇', hdlCholesterol, setHdlCholesterol, '60', 'numeric', 'mg/dL')}
                </View>
                <View style={styles.formFieldHalf}>
                  {renderFormField('三酸甘油脂', triglycerides, setTriglycerides, '150', 'numeric', 'mg/dL')}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  {renderFormField('血糖', bloodSugar, setBloodSugar, '100', 'numeric', 'mg/dL')}
                </View>
                <View style={styles.formFieldHalf}>
                  {renderFormField('糖化血紅蛋白', hba1c, setHba1c, '5.5', 'decimal-pad', '%')}
                </View>
              </View>
            </>
          )}

          {/* 其他檢查項目 */}
          {renderSection(
            '其他檢查項目',
            <>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>胸部X光</Text>
                {renderOptionButtons(chestXrayOptions, chestXray, setChestXray)}
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>心電圖</Text>
                {renderOptionButtons(ecgOptions, ecgResult, setEcgResult)}
              </View>
            </>
          )}

          {/* 診斷和建議 */}
          {renderSection(
            '診斷和建議',
            <>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>診斷</Text>
                <TextInput
                  style={styles.textArea}
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                  placeholder="醫生診斷結果"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>醫生建議</Text>
                <TextInput
                  style={styles.textArea}
                  value={recommendations}
                  onChangeText={setRecommendations}
                  placeholder="醫生的健康建議和注意事項"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formField}>
                <View style={styles.switchRow}>
                  <Text style={styles.fieldLabel}>需要追蹤檢查</Text>
                  <TouchableOpacity
                    style={[styles.switch, followUpRequired && styles.switchActive]}
                    onPress={() => setFollowUpRequired(!followUpRequired)}
                  >
                    <View style={[styles.switchThumb, followUpRequired && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                {followUpRequired && (
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowFollowUpDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <Text style={styles.dateButtonText}>
                      追蹤日期: {followUpDate ? followUpDate.toLocaleDateString('zh-TW') : '選擇日期'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* 提交按鈕 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? '儲存中...' : '儲存記錄'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 日期選擇器 */}
        {showDatePicker && (
          <DateTimePicker
            value={checkupDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setCheckupDate(selectedDate);
            }}
          />
        )}

        {showFollowUpDatePicker && (
          <DateTimePicker
            value={followUpDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowFollowUpDatePicker(false);
              if (selectedDate) setFollowUpDate(selectedDate);
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  textInputWithUnit: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  unitText: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#E5E5E5',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#666',
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
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#4CAF50',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
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

export default HealthCheckupForm; 