import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { CreateEventData } from '@/hooks/useEvents';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (eventData: CreateEventData) => Promise<void>;
  initialDate?: Date;
  userFamilies?: Array<{id: string, name: string}>; // 用户所在的群组列表
  editingEvent?: any; // 正在编辑的事件数据
  onUpdate?: (eventId: string, eventData: CreateEventData) => Promise<void>; // 更新事件的回调
}

export default function AddEventModal({ 
  visible, 
  onClose, 
  onSave, 
  initialDate,
  userFamilies = [],
  editingEvent = null,
  onUpdate
}: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate || new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('personal'); // 'personal' 或 family_id

  const colorOptions = [
    { name: '蓝色', value: '#007AFF' },
    { name: '红色', value: '#FF3B30' },
    { name: '绿色', value: '#34C759' },
    { name: '橙色', value: '#FF9500' },
    { name: '紫色', value: '#AF52DE' },
    { name: '粉色', value: '#FF2D92' },
  ];
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);

  // 编辑模式时预填充表单
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || '');
      setDescription(editingEvent.description || '');
      setLocation(editingEvent.location || '');
      setSelectedColor(editingEvent.color || colorOptions[0].value);
      
      // 设置日期
      const eventDate = new Date(editingEvent.start_ts * 1000);
      setDate(eventDate);
      
      // 设置时间
      const startDate = new Date(editingEvent.start_ts * 1000);
      const endDate = new Date(editingEvent.end_ts * 1000);
      
      const formatTime = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      
      setStartTime(formatTime(startDate));
      setEndTime(formatTime(endDate));
      
      // 检查是否是全天事件
      const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0 && 
                      endDate.getHours() === 23 && endDate.getMinutes() === 59;
      setAllDay(isAllDay);
      
      // 设置日历选择（个人或家庭）
      if (editingEvent.shared_families && editingEvent.shared_families.length > 0) {
        setSelectedCalendar(editingEvent.shared_families[0]);
      } else {
        setSelectedCalendar('personal');
      }
    }
  }, [editingEvent]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(initialDate || new Date());
    setStartTime('');
    setEndTime('');
    setLocation('');
    setAllDay(false);
    setSelectedColor(colorOptions[0].value);
  };

  // 格式化时间输入
  const formatTimeInput = (text: string): string => {
    // 移除所有非数字字符
    const numbers = text.replace(/[^\d]/g, '');
    
    // 如果没有数字，返回空字符串
    if (numbers.length === 0) return '';
    
    // 根据数字长度自动添加冒号
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    } else {
      // 限制最多4位数字
      return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
    }
  };

  const handleStartTimeChange = (text: string) => {
    const formattedTime = formatTimeInput(text);
    setStartTime(formattedTime);
  };

  const handleEndTimeChange = (text: string) => {
    const formattedTime = formatTimeInput(text);
    setEndTime(formattedTime);
  };

  const handleSave = async () => {
    // 验证必填字段
    if (!title.trim()) {
      Alert.alert('错误', '请输入事件标题');
      return;
    }

    // 验证时间格式
    if (!allDay && startTime && !isValidTime(startTime)) {
      Alert.alert('错误', '请输入正确的开始时间格式 (HH:MM)');
      return;
    }

    if (!allDay && endTime && !isValidTime(endTime)) {
      Alert.alert('错误', '请输入正确的结束时间格式 (HH:MM)');
      return;
    }

    // 验证结束时间是否在开始时间之后
    if (!allDay && startTime && endTime) {
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);
      if (end <= start) {
        Alert.alert('错误', '结束时间必须晚于开始时间');
        return;
      }
    }

    setLoading(true);
    try {
      const eventData: CreateEventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        startTime: allDay ? undefined : startTime || undefined,
        endTime: allDay ? undefined : endTime || undefined,
        location: location.trim() || undefined,
        color: selectedColor,
        shareToFamilies: selectedCalendar === 'personal' ? undefined : [selectedCalendar],
      };

      // 根据是否是编辑模式调用不同的方法
      if (editingEvent && onUpdate) {
        await onUpdate(editingEvent.id, eventData);
      } else {
        await onSave(eventData);
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('保存事件失败:', error);
      const errorMessage = error instanceof Error ? error.message : editingEvent ? '更新事件失败' : '创建事件失败';
      Alert.alert('错误', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isValidTime = (time: string): boolean => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 标题栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{editingEvent ? '编辑事件' : '添加事件'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
              {loading ? (editingEvent ? '更新中...' : '保存中...') : (editingEvent ? '更新' : '保存')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 事件标题 */}
          <View style={styles.section}>
            <Text style={styles.label}>事件标题 *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="输入事件标题"
              maxLength={100}
              autoFocus
            />
          </View>

          {/* 事件描述 */}
          <View style={styles.section}>
            <Text style={styles.label}>事件描述</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="输入事件描述（可选）"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* 日期选择 */}
          <View style={styles.section}>
            <Text style={styles.label}>日期</Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => adjustDate(-1)}
              >
                <Text style={styles.dateButtonText}>← 前一天</Text>
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => adjustDate(1)}
              >
                <Text style={styles.dateButtonText}>后一天 →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 全天开关 */}
          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>全天</Text>
              <Switch
                value={allDay}
                onValueChange={setAllDay}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={allDay ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* 时间设置 */}
          {!allDay && (
            <View style={styles.section}>
              <Text style={styles.label}>时间</Text>
              <View style={styles.timeContainer}>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>开始时间</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={startTime}
                    onChangeText={handleStartTimeChange}
                    placeholder="09:00"
                    keyboardType="numeric"
                    maxLength={5}
                    autoCorrect={false}
                    autoComplete="off"
                    returnKeyType="done"
                    selectTextOnFocus={true}
                    editable={true}
                  />
                </View>
                <Text style={styles.timeSeparator}>至</Text>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>结束时间</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={endTime}
                    onChangeText={handleEndTimeChange}
                    placeholder="10:00"
                    keyboardType="numeric"
                    maxLength={5}
                    autoCorrect={false}
                    autoComplete="off"
                    returnKeyType="done"
                    selectTextOnFocus={true}
                    editable={true}
                  />
                </View>
              </View>
            </View>
          )}

          {/* 位置 */}
          <View style={styles.section}>
            <Text style={styles.label}>位置</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="输入位置（可选）"
              maxLength={100}
            />
          </View>

          {/* 日历选择 */}
          <View style={styles.section}>
            <Text style={styles.label}>保存到</Text>
            <View style={styles.calendarContainer}>
              {/* 个人日历选项 */}
              <TouchableOpacity
                style={[
                  styles.calendarOption,
                  selectedCalendar === 'personal' && styles.selectedCalendarOption
                ]}
                onPress={() => setSelectedCalendar('personal')}
              >
                <Text style={styles.calendarIcon}>👤</Text>
                <Text style={[
                  styles.calendarText,
                  selectedCalendar === 'personal' && styles.selectedCalendarText
                ]}>
                  个人日历
                </Text>
                {selectedCalendar === 'personal' && (
                  <Text style={styles.calendarCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
              
              {/* 群组日历选项 */}
              {userFamilies.map((family) => (
                <TouchableOpacity
                  key={family.id}
                  style={[
                    styles.calendarOption,
                    selectedCalendar === family.id && styles.selectedCalendarOption
                  ]}
                  onPress={() => setSelectedCalendar(family.id)}
                >
                  <Text style={styles.calendarIcon}>👨‍👩‍👧‍👦</Text>
                  <Text style={[
                    styles.calendarText,
                    selectedCalendar === family.id && styles.selectedCalendarText
                  ]}>
                    {family.name}
                  </Text>
                  {selectedCalendar === family.id && (
                    <Text style={styles.calendarCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 颜色选择 */}
          <View style={styles.section}>
            <Text style={styles.label}>颜色标签</Text>
            <View style={styles.colorContainer}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.value },
                    selectedColor === color.value && styles.selectedColorOption
                  ]}
                  onPress={() => setSelectedColor(color.value)}
                >
                  {selectedColor === color.value && (
                    <Text style={styles.colorCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeInput: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    minWidth: 80,
    backgroundColor: '#fff',
    color: '#333',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#333',
  },
  colorCheckmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // 日历选择样式
  calendarContainer: {
    gap: 8,
  },
  calendarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCalendarOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  calendarIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  calendarText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedCalendarText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  calendarCheckmark: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 