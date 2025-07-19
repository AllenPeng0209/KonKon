import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChoreTaskService, ChoreTemplate } from '@/lib/choreService';
import { useAuth } from '@/contexts/AuthContext';

interface AddChoreModalProps {
  visible: boolean;
  onClose: () => void;
  onChoreAdded: () => void;
  templates: ChoreTemplate[];
  familyMembers: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
  currentFamily: {
    id: string;
    name: string;
  };
}

export default function AddChoreModal({
  visible,
  onClose,
  onChoreAdded,
  templates,
  familyMembers,
  currentFamily,
}: AddChoreModalProps) {
  const { user } = useAuth();
  
  const [selectedTemplate, setSelectedTemplate] = useState<ChoreTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('清潔');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState(3);
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['清潔', '烹飪', '購物', '照顧', '維修', '其他'];
  const priorities = [
    { value: 1, label: '低', color: '#6B7280' },
    { value: 2, label: '中低', color: '#22C55E' },
    { value: 3, label: '中等', color: '#EAB308' },
    { value: 4, label: '中高', color: '#F97316' },
    { value: 5, label: '高', color: '#EF4444' },
  ];

  const resetForm = () => {
    setSelectedTemplate(null);
    setTitle('');
    setDescription('');
    setCategory('清潔');
    setAssignedTo('');
    setPriority(3);
    setEstimatedDuration('');
    setDueDate(null);
  };

  const handleTemplateSelect = (template: ChoreTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.name);
    setDescription(template.description || '');
    setCategory(template.category);
    setEstimatedDuration(template.estimated_duration?.toString() || '');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('錯誤', '請輸入家務標題');
      return;
    }

    if (!currentFamily) {
      Alert.alert('錯誤', '請選擇家庭');
      return;
    }

    const currentMember = familyMembers.find(m => m.id === user?.id);
    if (!currentMember) {
      Alert.alert('錯誤', '無法確定創建者身份');
      return;
    }

    try {
      setIsSubmitting(true);

      const taskData = {
        family_id: currentFamily.id,
        template_id: selectedTemplate?.id || null,
        title: title.trim(),
        description: description.trim() || null,
        category,
        assigned_to: assignedTo || null,
        created_by: currentMember.id,
        priority,
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
        due_date: dueDate?.toISOString() || null,
        status: 'pending' as const,
        points_reward: Math.max(1, priority * 2), // 基於優先級的積分獎勵
      };

      await ChoreTaskService.create(taskData);
      
      Alert.alert('成功', '家務任務已創建', [
        { text: '確定', onPress: () => {
          resetForm();
          onChoreAdded();
        }}
      ]);
    } catch (error) {
      console.error('Error creating chore task:', error);
      Alert.alert('錯誤', '創建家務任務時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 標題欄 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>新增家務</Text>
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled
            ]}>
              {isSubmitting ? '建立中...' : '建立'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 家務模板選擇 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>快速選擇模板</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templatesContainer}
            >
              {templates.slice(0, 10).map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate?.id === template.id && styles.templateCardSelected
                  ]}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <Text style={styles.templateIcon}>
                    {template.icon_name === 'dish-washing' ? '🍽️' :
                     template.icon_name === 'floor-mopping' ? '🧽' :
                     template.icon_name === 'room-cleaning' ? '🧹' :
                     template.icon_name === 'laundry' ? '👕' :
                     template.icon_name === 'breakfast' ? '🍳' :
                     template.icon_name === 'dinner' ? '🍽️' :
                     template.icon_name === 'wash-vegetables' ? '🥬' :
                     template.icon_name === 'daily-shopping' ? '🛒' :
                     template.icon_name === 'grocery-shopping' ? '🥕' :
                     template.icon_name === 'pet-care' ? '🐕' :
                     template.icon_name === 'plant-care' ? '🪴' :
                     template.icon_name === 'repair' ? '🔧' :
                     template.icon_name === 'furniture-assembly' ? '🪑' :
                     template.icon_name === 'trash' ? '🗑️' :
                     template.icon_name === 'toy-cleanup' ? '🧸' : '📋'}
                  </Text>
                  <Text style={styles.templateName} numberOfLines={2}>
                    {template.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 基本信息 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本信息</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>家務標題 *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="輸入家務名稱"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>描述</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="輸入家務描述或備註"
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>分類</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                >
                  {categories.map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* 分配和優先級 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>分配設置</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>分配給</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={assignedTo}
                  onValueChange={setAssignedTo}
                  style={styles.picker}
                >
                  <Picker.Item label="暫不分配" value="" />
                  {familyMembers.map(member => (
                    <Picker.Item 
                      key={member.id} 
                      label={member.name} 
                      value={member.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>優先級</Text>
              <View style={styles.priorityContainer}>
                {priorities.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.priorityButton,
                      { borderColor: p.color },
                      priority === p.value && { backgroundColor: p.color }
                    ]}
                    onPress={() => setPriority(p.value)}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      { color: priority === p.value ? '#FFFFFF' : p.color }
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>預估時間（分鐘）</Text>
              <TextInput
                style={styles.textInput}
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
                placeholder="例如：30"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          {/* 時間設置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>時間設置</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>截止時間</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {dueDate 
                    ? dueDate.toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '選擇截止時間（可選）'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* 日期時間選擇器 */}
        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDueDate(selectedDate);
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
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
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  saveButtonDisabled: {
    color: '#9CA3AF',
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
  templatesContainer: {
    paddingRight: 16,
    gap: 12,
  },
  templateCard: {
    width: 80,
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  templateCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  templateIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  templateName: {
    fontSize: 10,
    textAlign: 'center',
    color: '#6B7280',
    fontWeight: '500',
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 32,
  },
});