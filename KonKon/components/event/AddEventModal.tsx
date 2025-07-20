import { CreateEventData } from '@/hooks/useEvents';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActionSheetIOS,
  Image,
  FlatList,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  isCurrentUser: boolean;
}

interface AttendeeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  availableUsers: User[];
  selectedAttendees: string[];
  onSelectionChange: (attendeeIds: string[]) => void;
}

// 参与人选择模态框组件
function AttendeeSelectionModal({
  visible,
  onClose,
  availableUsers,
  selectedAttendees,
  onSelectionChange,
}: AttendeeSelectionModalProps) {
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (visible) {
      setTempSelected([...selectedAttendees]);
    }
  }, [visible, selectedAttendees]);

  const toggleAttendee = (userId: string) => {
    setTempSelected(prev => {
      if (prev.includes(userId)) {
        // 如果是当前用户，不允许取消选择
        if (userId === user?.id) {
          Alert.alert('提示', '不能取消选择自己作为参与人');
          return prev;
        }
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleConfirm = () => {
    onSelectionChange(tempSelected);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <BlurView intensity={30} style={styles.modalBackground}>
        <View style={styles.attendeeModal}>
          <View style={styles.attendeeModalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.attendeeModalTitle}>选择参与人</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmButton}>确定</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableUsers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.attendeeItem,
                  tempSelected.includes(item.id) && styles.attendeeItemSelected,
                ]}
                onPress={() => toggleAttendee(item.id)}
              >
                <View style={styles.attendeeItemLeft}>
                  <View style={styles.attendeeModalAvatar}>
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} style={styles.attendeeModalAvatarImage} />
                    ) : (
                      <Ionicons name="person" size={24} color="#007AFF" />
                    )}
                  </View>
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.attendeeModalName}>{item.name}</Text>
                    {item.isCurrentUser && (
                      <Text style={styles.attendeeLabel}>我</Text>
                    )}
                  </View>
                </View>
                {tempSelected.includes(item.id) && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
            style={styles.attendeeList}
          />
        </View>
      </BlurView>
    </Modal>
  );
}

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (eventData: CreateEventData) => Promise<void>;
  initialDate?: Date;
  userFamilies?: Array<{id: string, name: string, [key: string]: any}>;
  editingEvent?: any;
  onUpdate?: (eventId: string, eventData: CreateEventData) => Promise<void>;
}

const repeatOptions = [
  { label: '从不', value: 'never' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每年', value: 'yearly' },
];

const colors = [
  '#FF3B30', '#FF9500', '#FFCC02', '#34C759', 
  '#007AFF', '#5856D6', '#AF52DE'
];

export default function AddEventModal({
  visible,
  onClose,
  onSave,
  initialDate,
  userFamilies = [],
  editingEvent,
  onUpdate
}: AddEventModalProps) {
  const { user } = useAuth();
  const { familyMembers } = useFamily();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [allDay, setAllDay] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('#007AFF');
  const [repeatOption, setRepeatOption] = useState('never');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // 获取所有可选的用户列表（当前用户 + 家庭成员）
  const availableUsers = React.useMemo(() => {
    const users: User[] = [];
    
    // 添加当前用户
    if (user) {
      users.push({
        id: user.id,
        name: user.user_metadata?.display_name || user.email || '我',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url,
        isCurrentUser: true,
      });
    }
    
    // 添加家庭成员
    familyMembers.forEach(member => {
      if (member.user_id !== user?.id) {
        users.push({
          id: member.user_id,
          name: member.user?.display_name || member.user?.email || '家庭成员',
          email: member.user?.email,
          avatar_url: member.user?.avatar_url,
          isCurrentUser: false,
        });
      }
    });
    
    return users;
  }, [user, familyMembers]);

  // 获取已选择的参与人信息
  const selectedAttendeesInfo = React.useMemo(() => {
    return availableUsers.filter(user => selectedAttendees.includes(user.id));
  }, [availableUsers, selectedAttendees]);

  useEffect(() => {
    if (visible) {
      if (editingEvent) {
        setTitle(editingEvent.title || '');
        setDescription(editingEvent.description || '');
        setSelectedColor(editingEvent.color || '#007AFF');
        
        if (editingEvent.start_ts) {
          const eventDate = new Date(editingEvent.start_ts * 1000);
          setDate(eventDate);
          setStartTime(eventDate);
        }
        if (editingEvent.end_ts) {
          setEndTime(new Date(editingEvent.end_ts * 1000));
        }
        if (editingEvent.shared_families && editingEvent.shared_families.length > 0) {
          setSelectedFamilies(editingEvent.shared_families);
        }
        // 获取事件的参与人信息
        if (editingEvent.attendees && editingEvent.attendees.length > 0) {
          const attendeeIds = editingEvent.attendees.map((attendee: any) => attendee.user_id);
          setSelectedAttendees(attendeeIds);
        } else {
          // 如果没有参与人信息，默认选择创建者
          setSelectedAttendees([editingEvent.creator_id]);
        }
      } else {
        resetForm();
        if (initialDate) {
          setDate(initialDate);
          const start = new Date(initialDate);
          start.setHours(9, 0, 0, 0);
          setStartTime(start);
          const end = new Date(initialDate);
          end.setHours(10, 0, 0, 0);
          setEndTime(end);
        }
        // 默认选择当前用户作为参与人
        if (user) {
          setSelectedAttendees([user.id]);
        }
      }
    }
  }, [visible, editingEvent, initialDate, user]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(new Date());
    const now = new Date();
    const start = new Date(now);
    start.setHours(9, 0, 0, 0);
    setStartTime(start);
    const end = new Date(now);
    end.setHours(10, 0, 0, 0);
    setEndTime(end);
    setAllDay(false);
    setSelectedFamilies([]);
    setSelectedColor('#007AFF');
    setRepeatOption('never');
    setSelectedAttendees(user ? [user.id] : []);
    setShowDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入事件标题');
      return;
    }

    setLoading(true);
    try {
      const eventData: CreateEventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: allDay ? date : startTime,
        endTime: allDay ? undefined : endTime,
        color: selectedColor,
        type: 'calendar',
        shareToFamilies: selectedFamilies.length > 0 ? selectedFamilies : undefined,
        attendees: selectedAttendees,
      };

      if (editingEvent && onUpdate) {
        await onUpdate(editingEvent.id, eventData);
      } else {
        await onSave(eventData);
      }

      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('错误', '保存失败');
    } finally {
      setLoading(false);
    }
  };



  const onDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
      
      // 更新时间日期部分
      const newStartTime = new Date(startTime);
      newStartTime.setFullYear(selectedDate.getFullYear());
      newStartTime.setMonth(selectedDate.getMonth());
      newStartTime.setDate(selectedDate.getDate());
      setStartTime(newStartTime);
      
      const newEndTime = new Date(endTime);
      newEndTime.setFullYear(selectedDate.getFullYear());
      newEndTime.setMonth(selectedDate.getMonth());
      newEndTime.setDate(selectedDate.getDate());
      setEndTime(newEndTime);
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setStartTime(selectedTime);
      // 自动设置结束时间为开始时间+1小时
      const newEndTime = new Date(selectedTime);
      newEndTime.setHours(newEndTime.getHours() + 1);
      setEndTime(newEndTime);
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const showRepeatOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...repeatOptions.map(r => r.label), '取消'],
          cancelButtonIndex: repeatOptions.length,
          title: '重复频率',
        },
        (buttonIndex) => {
          if (buttonIndex < repeatOptions.length) {
            setRepeatOption(repeatOptions[buttonIndex].value);
          }
        }
      );
    } else {
      Alert.alert(
        '重复频率',
        '选择重复选项',
        [
          ...repeatOptions.map(option => ({
            text: option.label,
            onPress: () => setRepeatOption(option.value),
          })),
          { text: '取消', style: 'cancel' },
        ]
      );
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getRepeatLabel = (value: string): string => {
    return repeatOptions.find(option => option.value === value)?.label || '从不';
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <BlurView intensity={30} style={styles.blurContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredView}
          keyboardVerticalOffset={20}
        >
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#999" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {editingEvent ? '编辑事件' : '新建事件'}
            </Text>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* 标题输入 */}
                   <TextInput
                style={styles.input}
                placeholder="事件标题"
                value={title}
                onChangeText={setTitle}
                autoFocus={!editingEvent}
              />

         
              {/* 日期和时间选择区域 */}
              <View style={styles.dateTimeSection}>

                
              {/* 参与人选择 - 移到顶部 */}
              <TouchableOpacity 
                style={styles.attendeeSelectorButton}
                onPress={() => setShowAttendeeModal(true)}
              >
                <View style={styles.attendeeSelectorLeft}>
                  <Ionicons name="people" size={20} color="#007AFF" />
                  <Text style={styles.attendeeSelectorLabel}>参与人</Text>
                </View>
                <View style={styles.attendeeSelectorRight}>
                  <View style={styles.attendeeSelectorList}>
                    {selectedAttendeesInfo.slice(0, 3).map((attendee, index) => (
                      <View key={attendee.id} style={[styles.attendeeSelectorAvatar, { marginLeft: index > 0 ? -8 : 0 }]}>
                        {attendee.avatar_url ? (
                          <Image source={{ uri: attendee.avatar_url }} style={styles.attendeeSelectorAvatarImage} />
                        ) : (
                          <Ionicons name="person" size={16} color="#007AFF" />
                        )}
                      </View>
                    ))}
                    {selectedAttendeesInfo.length > 3 && (
                      <View style={[styles.attendeeSelectorAvatar, styles.attendeeSelectorMore, { marginLeft: -8 }]}>
                        <Text style={styles.attendeeSelectorMoreText}>+{selectedAttendeesInfo.length - 3}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C7C7CD" />
                </View>
              </TouchableOpacity>

                {/* 日期选择 */}
                <TouchableOpacity
                  style={[styles.dateTimeButton, showDatePicker && styles.dateTimeButtonActive]}
                  onPress={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowStartTimePicker(false);
                    setShowEndTimePicker(false);
                  }}
                >
                  <View style={styles.dateTimeLeft}>
                    <Ionicons name="calendar" size={20} color="#007AFF" />
                    <Text style={styles.dateTimeLabel}>日期</Text>
                  </View>
                  <Text style={styles.dateTimeValue}>{formatDate(date)}</Text>
                </TouchableOpacity>

                {/* 内联日期选择器 */}
                {showDatePicker && (
                  <View style={styles.inlinePicker}>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      is24Hour={true}
                      display="spinner"
                      onChange={onDateChange}
                      style={styles.picker}
                    />
                  </View>
                )}

                {/* 全天开关 */}
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setAllDay(!allDay)}
                >
                  <View style={styles.dateTimeLeft}>
                    <Ionicons name="time" size={20} color="#007AFF" />
                    <Text style={styles.dateTimeLabel}>全天</Text>
                  </View>
                  <View style={[styles.switch, allDay && styles.switchActive]}>
                    <View style={[styles.switchThumb, allDay && styles.switchThumbActive]} />
                  </View>
                </TouchableOpacity>

                {/* 时间选择 */}
                {!allDay && (
                  <>
                    <TouchableOpacity
                      style={[styles.dateTimeButton, showStartTimePicker && styles.dateTimeButtonActive]}
                      onPress={() => {
                        setShowStartTimePicker(!showStartTimePicker);
                        setShowDatePicker(false);
                        setShowEndTimePicker(false);
                      }}
                    >
                      <View style={styles.dateTimeLeft}>
                        <Ionicons name="play" size={20} color="#007AFF" />
                        <Text style={styles.dateTimeLabel}>开始</Text>
                      </View>
                      <Text style={styles.dateTimeValue}>{formatTime(startTime)}</Text>
                    </TouchableOpacity>

                    {/* 内联开始时间选择器 */}
                    {showStartTimePicker && (
                      <View style={styles.inlinePicker}>
                        <DateTimePicker
                          value={startTime}
                          mode="time"
                          is24Hour={true}
                          display="spinner"
                          onChange={onStartTimeChange}
                          style={styles.picker}
                        />
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.dateTimeButton, showEndTimePicker && styles.dateTimeButtonActive]}
                      onPress={() => {
                        setShowEndTimePicker(!showEndTimePicker);
                        setShowDatePicker(false);
                        setShowStartTimePicker(false);
                      }}
                    >
                      <View style={styles.dateTimeLeft}>
                        <Ionicons name="stop" size={20} color="#007AFF" />
                        <Text style={styles.dateTimeLabel}>结束</Text>
                      </View>
                      <Text style={styles.dateTimeValue}>{formatTime(endTime)}</Text>
                    </TouchableOpacity>

                    {/* 内联结束时间选择器 */}
                    {showEndTimePicker && (
                      <View style={styles.inlinePicker}>
                        <DateTimePicker
                          value={endTime}
                          mode="time"
                          is24Hour={true}
                          display="spinner"
                          onChange={onEndTimeChange}
                          style={styles.picker}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* 重复选项 */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={showRepeatOptions}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name="repeat" size={20} color="#007AFF" />
                  <Text style={styles.optionLabel}>重复</Text>
                </View>
                <View style={styles.optionRight}>
                  <Text style={styles.optionValue}>{getRepeatLabel(repeatOption)}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#C7C7CD" />
                </View>
              </TouchableOpacity>

              {/* 颜色选择 */}
              <View style={styles.colorSection}>
                <Text style={styles.sectionTitle}>颜色标签</Text>
                <View style={styles.colorGrid}>
                  {colors.map((color, index) => (
                    <TouchableOpacity
                      key={`color-${index}`}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorOption
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 描述输入 */}
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="备注"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />

              {/* 家庭分享选择 */}
              {userFamilies.length > 0 && (
                <View style={styles.familySection}>
                  <Text style={styles.sectionTitle}>分享到</Text>
                  <Text style={styles.sectionDescription}>
                    {selectedFamilies.length === 0 
                      ? '选择家庭后，该家庭的所有成员都能看到这个事件（不选择则为个人事件）' 
                      : `已选择 ${selectedFamilies.length} 个家庭`}
                  </Text>
                  <View style={styles.familyContainer}>
                    {userFamilies.map((family, index) => (
                      <TouchableOpacity
                        key={`family-${index}`}
                        style={[
                          styles.familyButton,
                          selectedFamilies.includes(family.id) && styles.familyButtonSelected,
                        ]}
                        onPress={() => {
                          if (selectedFamilies.includes(family.id)) {
                            // 取消选择
                            setSelectedFamilies(prev => prev.filter(id => id !== family.id));
                          } else {
                            // 添加选择
                            setSelectedFamilies(prev => [...prev, family.id]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.familyButtonText,
                          selectedFamilies.includes(family.id) && styles.familyButtonTextSelected
                        ]}>
                          {family.name}
                        </Text>
                        {selectedFamilies.includes(family.id) && (
                          <Ionicons name="checkmark" size={16} color="white" style={{ marginLeft: 5 }} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}


            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? '保存中...' : '保存'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BlurView>

      {/* 参与人选择模态框 */}
      <AttendeeSelectionModal
        visible={showAttendeeModal}
        onClose={() => setShowAttendeeModal(false)}
        availableUsers={availableUsers}
        selectedAttendees={selectedAttendees}
        onSelectionChange={setSelectedAttendees}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
  dateTimeButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  dateTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  inlinePicker: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  picker: {
    height: 120,
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#34C759',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 18 }],
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionValue: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
  colorSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  selectedColorOption: {
    transform: [{ scale: 1.2 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  familySection: {
    marginBottom: 15,
  },
  familyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  familyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  familyButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  familyButtonText: {
    fontSize: 14,
    color: '#333',
  },
  familyButtonTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  attendeesSection: {
    marginBottom: 15,
  },
  attendeesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attendeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attendeeButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  attendeeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attendeeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  attendeeName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    elevation: 2,
    marginTop: 10,
    minWidth: 120,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  // New styles for AttendeeSelectionModal
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    alignItems: 'center',
  },
  attendeeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  attendeeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  attendeeList: {
    width: '100%',
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  attendeeItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  attendeeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeModalAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  attendeeModalAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeModalName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  attendeeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // New styles for AttendeeSelectorButton
  attendeeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  attendeeSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeSelectorLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  attendeeSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeSelectorList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  attendeeSelectorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeSelectorAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  attendeeSelectorMore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeSelectorMoreText: {
    fontSize: 12,
    color: '#333',
  },
});