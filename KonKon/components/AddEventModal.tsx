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
        {/* 顶部装饰条 */}
        <View style={styles.topIndicator} />
        
        {/* 标题栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.cancelButton}>✕</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{editingEvent ? '编辑事件' : '创建事件'}</Text>
            <Text style={styles.subtitle}>记录美好时光</Text>
          </View>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={loading}
            style={[styles.headerButton, styles.saveButtonContainer, loading && styles.saveButtonDisabled]}
          >
            <Text style={[styles.saveButton, loading && styles.saveButtonTextDisabled]}>
              {loading ? '...' : (editingEvent ? '更新' : '保存')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 事件标题 */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelEmoji}>📝</Text>
              <Text style={styles.label}>事件标题</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="给你的事件起个名字..."
                placeholderTextColor="#9ca3af"
                maxLength={100}
                autoFocus
              />
            </View>
          </View>

          {/* 事件描述 */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelEmoji}>💭</Text>
              <Text style={styles.label}>事件描述</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="描述这个特别的时刻..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </View>

          {/* 日期选择 */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelEmoji}>📅</Text>
              <Text style={styles.label}>日期</Text>
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.dateContainer}>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => adjustDate(-1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                  <Text style={styles.dateSubtext}>选择日期</Text>
                </View>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => adjustDate(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateButtonText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 全天开关 */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelEmoji}>⏰</Text>
              <Text style={styles.label}>全天事件</Text>
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>全天</Text>
                  <Text style={styles.switchSubtitle}>不设置具体时间</Text>
                </View>
                <Switch
                  value={allDay}
                  onValueChange={setAllDay}
                  trackColor={{ false: '#e5e7eb', true: '#bfdbfe' }}
                  thumbColor={allDay ? '#3b82f6' : '#ffffff'}
                  ios_backgroundColor="#e5e7eb"
                />
              </View>
            </View>
          </View>

          {/* 时间设置 */}
          {!allDay && (
            <View style={styles.section}>
              <View style={styles.labelContainer}>
                <Text style={styles.labelEmoji}>🕐</Text>
                <Text style={styles.label}>时间</Text>
              </View>
              <View style={styles.inputContainer}>
                <View style={styles.timeContainer}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>开始</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={startTime}
                      onChangeText={handleStartTimeChange}
                      placeholder="09:00"
                      placeholderTextColor="#d1d5db"
                      keyboardType="numeric"
                      maxLength={5}
                      autoCorrect={false}
                      autoComplete="off"
                      returnKeyType="done"
                      selectTextOnFocus={true}
                      editable={true}
                    />
                  </View>
                  <View style={styles.timeSeparatorContainer}>
                    <Text style={styles.timeSeparator}>→</Text>
                    <Text style={styles.timeToText}>至</Text>
                  </View>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>结束</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={endTime}
                      onChangeText={handleEndTimeChange}
                      placeholder="10:00"
                      placeholderTextColor="#d1d5db"
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
            </View>
          )}

          {/* 位置 */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelEmoji}>📍</Text>
              <Text style={styles.label}>位置</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="在哪里发生呢？"
                placeholderTextColor="#9ca3af"
                maxLength={100}
              />
            </View>
          </View>

          {/* 日历选择 */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelEmoji}>📚</Text>
              <Text style={styles.label}>保存到</Text>
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.calendarContainer}>
                {/* 个人日历选项 */}
                <TouchableOpacity
                  style={[
                    styles.calendarOption,
                    selectedCalendar === 'personal' && styles.selectedCalendarOption
                  ]}
                  onPress={() => setSelectedCalendar('personal')}
                  activeOpacity={0.7}
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
                    activeOpacity={0.7}
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
          </View>

          {/* 颜色选择 */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelEmoji}>🎨</Text>
              <Text style={styles.label}>颜色标签</Text>
            </View>
            <View style={styles.inputContainer}>
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
                    activeOpacity={0.7}
                  >
                    {selectedColor === color.value && (
                      <Text style={styles.colorCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
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
    backgroundColor: '#f8fafc',
  },
  topIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  cancelButton: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButtonContainer: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  saveButtonDisabled: {
    backgroundColor: '#e5e7eb',
    shadowOpacity: 0,
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 28,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
    flex: 1,
  },
  required: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '700',
    marginLeft: 4,
  },
  inputContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    color: '#1f2937',
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButtonText: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  dateSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  switchInfo: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  timeInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timeInput: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 10,
    minWidth: 100,
    backgroundColor: '#f8fafc',
    color: '#1f2937',
    fontWeight: '700',
    letterSpacing: 0.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  timeSeparatorContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  timeSeparator: {
    fontSize: 20,
    color: '#3b82f6',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timeToText: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
    marginTop: 2,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  colorOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedColorOption: {
    borderColor: '#1f2937',
    shadowOpacity: 0.3,
    shadowColor: '#1f2937',
    transform: [{ scale: 1.1 }],
  },
  colorCheckmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // 日历选择样式
  calendarContainer: {
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  calendarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 4,
  },
  selectedCalendarOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  calendarIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  calendarText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  selectedCalendarText: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  calendarCheckmark: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 