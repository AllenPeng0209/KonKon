import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import SmartButton from '@/components/ui/SmartButton';
import AddEventModal from '@/components/AddEventModal';
import EventListModal from '@/components/EventListModal';
import { VoiceToCalendar } from '@/components/VoiceToCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import CalendarService from '@/lib/calendarService';
import { processVoiceToCalendar, processImageToCalendar, ParsedCalendarResult } from '@/lib/bailian_omni_calendar';
import { useRecurringEvents } from '@/hooks/useRecurringEvents';
import { parseNaturalLanguageRecurrence } from '@/lib/recurrenceEngine';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import LoadingModal from '@/components/LoadingModal';
import RecurringEventManager from '@/components/RecurringEventManager';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 默认值为 'all'
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventListModal, setShowEventListModal] = useState(false);
  const [showVoiceToCalendar, setShowVoiceToCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [showRecurringEventManager, setShowRecurringEventManager] = useState(false);
  const [selectedParentEventId, setSelectedParentEventId] = useState<string | null>(null);
  const [processedEvents, setProcessedEvents] = useState<any[]>([]);
  
  // 事件管理
  const { 
    events, 
    loading: eventsLoading, 
    error: eventsError,
    userFamilyDetails,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate,
    getMonthEvents,
    fetchEvents
  } = useEvents();

  // 重複事件管理
  const {
    loading: recurringLoading,
    error: recurringError,
    createRecurringEvent,
    getRecurringEventInstances,
  } = useRecurringEvents();

  // 语音录制
  const {
    state: voiceState,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder({
    maxDuration: 180000, // 3分钟
    audioFormat: 'wav',
  });

  // 过滤选项，增加 value 字段
  const filterOptions = [
    { label: '全部', value: 'all', icon: '📊', color: '#8E8E93', bgColor: '#F2F2F7' },
    { label: '日曆', value: 'calendar', icon: '🔔', color: '#FF9500', bgColor: '#FFF3E0' },
    { label: '想法', value: 'idea', icon: '💡', color: '#9C27B0', bgColor: '#F3E5F5' },
    { label: '心情', value: 'mood', icon: '❤️', color: '#E91E63', bgColor: '#FCE4EC' },
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // 初始化日历权限
  useEffect(() => {
    initializeCalendarPermissions();
  }, []);

  useEffect(() => {
    const expandRecurringEvents = async () => {
      if (eventsLoading || recurringLoading) return;

      const singleEvents = events.filter(e => !e.recurrence_rule);
      const recurringParents = events.filter(e => e.recurrence_rule);
      
      const [year, month] = currentMonth.split('-').map(Number);
      const viewStartDate = new Date(year, month - 1, 1);
      // 获取当前月份前后各一个月的数据，确保视图边缘的重复事件也能正确显示
      viewStartDate.setMonth(viewStartDate.getMonth() - 1);
      const viewEndDate = new Date(year, month, 0);
      viewEndDate.setMonth(viewEndDate.getMonth() + 1);

      let allInstances: any[] = [];

      for (const parent of recurringParents) {
        // 确保父事件的开始时间是Date对象
        const parentStartDate = new Date(parent.start_ts * 1000);
        // 如果父事件的开始时间在视图结束日期之后，则跳过
        if(parentStartDate > viewEndDate) continue;

        const instances = await getRecurringEventInstances(parent.id, viewStartDate, viewEndDate);
        const instancesWithDetails = instances.map(inst => ({
          ...parent,
          id: `${parent.id}_${inst.start.toISOString()}`, // 为实例创建唯一ID
          start_ts: Math.floor(inst.start.getTime() / 1000),
          end_ts: Math.floor(inst.end.getTime() / 1000),
          recurrence_rule: null, // 实例本身没有重复规则
          parent_event_id: parent.id, // 链接回父事件
          is_instance: true,
        }));
        allInstances = allInstances.concat(instancesWithDetails);
      }
      
      setProcessedEvents([...singleEvents, ...allInstances]);
    };

    expandRecurringEvents();
  }, [events, currentMonth, eventsLoading, recurringLoading, getRecurringEventInstances]);

  const initializeCalendarPermissions = async () => {
    try {
      const hasPermission = await CalendarService.checkPermissions();
      setHasCalendarPermission(hasPermission);
      
      if (!hasPermission) {
        // 显示权限说明对话框
        Alert.alert(
          '日历权限',
          'KonKon 可以与您的系统日历同步，让您的事件在所有应用中保持一致。',
          [
            { text: '暂不开启', style: 'cancel' },
            {
              text: '开启权限',
              onPress: async () => {
                const granted = await CalendarService.requestPermissions();
                setHasCalendarPermission(granted);
                if (granted) {
                  Alert.alert('成功', '日历权限已开启，现在可以与系统日历同步了！');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      // console.error('初始化日历权限失败:', error);
    }
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  // 跳转到洞察页面
  const navigateToExplore = () => {
    router.push('/explore');
  };

  // 处理过滤菜单，使用 value
  const handleFilterSelect = (filterValue: string) => {
    setSelectedFilter(filterValue);
    setShowFilterMenu(false);
  };

  const toggleFilterMenu = () => {
    setShowFilterMenu(!showFilterMenu);
  };

  // 处理手动添加事件
  const handleManualAdd = () => {
    setSelectedDate(new Date());
    setEditingEvent(null); // 清空编辑状态
    setShowAddEventModal(true);
  };

  // 处理语音录制按钮点击
  const handleVoicePress = async () => {
    if (voiceState.isRecording) {
      // 停止录制并处理语音
      try {
        const base64Data = await stopRecording();
        if (base64Data) {
          Alert.alert(
            '处理语音',
            '是否将录制的语音转换为日程？',
            [
              { text: '取消', onPress: () => clearRecording() },
              { 
                text: '转换', 
                onPress: () => handleVoiceToCalendar(base64Data)
              }
            ]
          );
        }
      } catch (error) {
        // console.error('停止录制失败:', error);
        Alert.alert('错误', '录制失败，请重试');
      }
    } else {
      // 开始录制
      try {
        await startRecording();
      } catch (error) {
        // console.error('开始录制失败:', error);
        Alert.alert('错误', '无法开始录制，请检查麦克风权限');
      }
    }
  };

  // 处理图片转日程
  const handleImageSelection = async (pickerFunction: 'camera' | 'library') => {
    let permissionResult;
    if (pickerFunction === 'camera') {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permissionResult.granted === false) {
      Alert.alert('权限不足', `需要${pickerFunction === 'camera' ? '相机' : '相册'}权限才能继续`);
      return;
    }

    const pickerResult = pickerFunction === 'camera'
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        });

    if (pickerResult.canceled) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const imageUri = pickerResult.assets[0].uri;
      try {
        setIsProcessingImage(true);
        setLoadingText('我们正在分析图片内容并为您生成日程，请稍候...');
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const result = await processImageToCalendar(base64Image);
        handleAIResult(result);
      } catch (error) {
        // console.error('图片处理失败:', error);
        Alert.alert('处理失败', `无法从图片创建日程: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setIsProcessingImage(false);
        setLoadingText('');
      }
    }
  };

  const handlePhotoPress = () => {
    handleImageSelection('camera');
  };

  const handleAlbumPress = () => {
    handleImageSelection('library');
  };

  // 处理语音转日程
  const handleVoiceToCalendar = async (base64Data: string) => {
    try {
      const result = await processVoiceToCalendar(base64Data);
      handleAIResult(result);
    } catch (error) {
      // console.error('语音处理失败:', error);
      Alert.alert('处理失败', '语音解析失败，请重试');
    } finally {
      clearRecording();
    }
  };

  // 处理文字输入转日程的结果（兼容原有逻辑）
  const handleTextResult = (result: ParsedCalendarResult) => {
    handleAIResult(result);
  };

  // 统一处理AI解析结果
  const handleAIResult = (result: ParsedCalendarResult) => {
    // console.log('AI result:', result);
    
    if (result.events && result.events.length > 0) {
      // Always take the first event for simplicity, even if multiple are returned.
      const event = result.events[0];
      const confidence = Math.round(result.confidence * 100);
      
      // 格式化时间显示
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      const formatTime = (date: Date) => {
        return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      };
      
      // 生成鼓励语言
      const encouragements = [
        '太棒了！又一个充实的安排！',
        '很好的时间规划！',
        '继续保持这种积极的生活态度！',
        '规律的日程会让生活更有条理！',
        '为你的时间管理点赞！'
      ];
      const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
      
      Alert.alert(
        '🎯 解析成功',
        `${encouragement}\n\n📅 事件：${event.title}\n⏰ 时间：${formatTime(startTime)} - ${formatTime(endTime)}\n${event.location ? `📍 地点：${event.location}\n` : ''}🎯 置信度：${confidence}%\n\n确认创建这个日程吗？`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '✅ 创建', 
            onPress: () => handleCreateAIEvent(event)
          }
        ]
      );
    } else {
      Alert.alert('解析失败', '未能识别到有效的日程事件，请重新输入');
    }
  };

  // 创建从AI解析出的事件（支持语音和文字）
  const handleCreateAIEvent = async (event: any) => {
    try {

      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);

      // Defensively check for invalid date objects
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        Alert.alert('时间解析错误', 'AI返回了无效的时间格式，无法创建日程。');
        return;
      }
      
      // Defensively check that start is before end
      if (startDate >= endDate) {
        Alert.alert('时间顺序错误', 'AI解析出的开始时间晚于或等于结束时间，无法创建日程。');
        return;
      }

      // Check if the event spans across multiple days, which the current createEvent hook might not support.
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(endDate);
      endDay.setHours(0, 0, 0, 0);

      if (startDay.getTime() !== endDay.getTime()) {
        Alert.alert(
          '跨天事件提醒',
          'AI解析出一个跨天的事件。当前版本的创建功能会将它作为一整天的事件（从开始日的00:00到结束日的23:59）来处理，您想继续吗？',
          [
            { text: '手动调整', style: 'cancel' },
            {
              text: '继续创建',
              onPress: async () => {
                const eventData = {
                  title: event.title,
                  description: `${event.description || ''} (跨天事件)`.trim(),
                  date: startDate,
                  allDay: true, // Treat as an all-day event
                  location: event.location || '',
                  color: '#007AFF',
                };
                 await createAndRefresh(eventData);
              },
            },
          ]
        );
        return;
      }
      
      // 檢查是否為重複事件
      if (event.isRecurring && event.recurrenceRule) {
        console.log('Creating recurring event with rule:', event.recurrenceRule);
        
        // 確保 recurrenceRule 有必需的字段
        if (!event.recurrenceRule.frequency) {
          Alert.alert('重複規則錯誤', 'AI 解析的重複規則缺少頻率信息');
          return;
        }
        
        // 創建重複事件
        const recurringEventData = {
          title: event.title,
          description: event.description || '',
          startDate: startDate,
          endDate: endDate,
          location: event.location || '',
          color: '#007AFF',
          recurrenceRule: event.recurrenceRule,
          familyId: userFamilyDetails?.[0]?.id || undefined,
        };
        
        console.log('Recurring event data:', recurringEventData);
        const parentEventId = await createRecurringEvent(recurringEventData);
        
        if (parentEventId) {
          Alert.alert(
            '✅ 重複事件創建成功', 
            `重複日程"${event.title}"已添加到您的日历`,
            [{ text: '好的', style: 'default' }]
          );
          const newEventDate = new Date(startDate);
          await fetchEvents(newEventDate.getFullYear(), newEventDate.getMonth() + 1);
        } else {
          const errorMessage = recurringError || '創建重複日程時發生錯誤，請重試';
          Alert.alert('❌ 創建失敗', errorMessage);
        }
      } else if (event.isRecurring && event.recurringPattern) {
        // 嘗試解析自然語言重複模式
        const recurrenceRule = parseNaturalLanguageRecurrence(event.recurringPattern);
        
        if (recurrenceRule) {
          const recurringEventData = {
            title: event.title,
            description: event.description || '',
            startDate: startDate,
            endDate: endDate,
            location: event.location || '',
            color: '#007AFF',
            recurrenceRule: recurrenceRule,
            familyId: userFamilyDetails?.[0]?.id || undefined,
          };
          
          const parentEventId = await createRecurringEvent(recurringEventData);
          
          if (parentEventId) {
            Alert.alert(
              '✅ 重複事件創建成功', 
              `重複日程"${event.title}"已添加到您的日历`,
              [{ text: '好的', style: 'default' }]
            );
            const newEventDate = new Date(startDate);
            await fetchEvents(newEventDate.getFullYear(), newEventDate.getMonth() + 1);
          } else {
            const errorMessage = recurringError || '創建重複日程時發生錯誤，請重試';
            Alert.alert('❌ 創建失敗', errorMessage);
          }
        } else {
          // 無法解析重複模式，創建普通事件
          Alert.alert(
            '重複模式識別失敗',
            '無法識別重複模式，將創建為普通事件。是否繼續？',
            [
              { text: '取消', style: 'cancel' },
              { 
                text: '繼續', 
                onPress: async () => {
                  const eventData = {
                    title: event.title,
                    description: event.description || '',
                    date: startDate,
                    startTime: startDate.toTimeString().substring(0, 5),
                    endTime: endDate.toTimeString().substring(0, 5),
                    location: event.location || '',
                    color: '#007AFF',
                  };
                  await createAndRefresh(eventData);
                }
              }
            ]
          );
        }
      } else {
        // 創建普通事件
        const eventData = {
          title: event.title,
          description: event.description || '',
          date: startDate,
          startTime: startDate.toTimeString().substring(0, 5),
          endTime: endDate.toTimeString().substring(0, 5),
          location: event.location || '',
          color: '#007AFF',
        };
        
        await createAndRefresh(eventData);
      }

    } catch (error) {
      // console.error('创建AI事件失败:', error);
      Alert.alert('创建失败', `创建日程时发生未知错误: ${error instanceof Error ? error.message : ''}`);
    }
  };

  // Helper function to create event and refresh list
  const createAndRefresh = async (eventData: any) => {
      // console.log('创建事件数据:', eventData);
      
      const createdEvent = await createEvent(eventData);
      if (createdEvent) {
        // console.log('事件创建成功:', createdEvent);
        Alert.alert(
          '✅ 创建成功', 
          `日程"${eventData.title}"已添加到您的日历`,
          [{ text: '好的', style: 'default' }]
        );
        const newEventDate = new Date(eventData.date);
        await fetchEvents(newEventDate.getFullYear(), newEventDate.getMonth() + 1);
      } else {
        // console.error('事件创建失败: createEvent 返回 null');
        const errorMessage = eventsError || '创建日程时发生错误，请重试';
        Alert.alert('❌ 创建失败', errorMessage);
      }
  }


  // 处理文字输入错误
  const handleTextError = (error: string) => {
    // console.error('Text input error:', error);
    Alert.alert('处理失败', error);
  };

  // 处理事件创建
  const handleCreateEvent = async (eventData: any) => {
    try {
      const result = await createEvent(eventData);
      
      if (result) {
        // 如果有日历权限，同步到系统日历
        if (hasCalendarPermission) {
          try {
            const startDate = new Date(eventData.date);
            let endDate = new Date(eventData.date);
            
            if (!eventData.allDay && eventData.startTime && eventData.endTime) {
              // 解析时间
              const [startHour, startMinute] = eventData.startTime.split(':').map(Number);
              const [endHour, endMinute] = eventData.endTime.split(':').map(Number);
              
              startDate.setHours(startHour, startMinute, 0, 0);
              endDate.setHours(endHour, endMinute, 0, 0);
            } else {
              endDate.setDate(endDate.getDate() + 1);
            }
            
            await CalendarService.createSystemEvent({
              title: eventData.title,
              description: eventData.description,
              startDate,
              endDate,
              location: eventData.location,
              allDay: eventData.allDay,
            });
          } catch (calendarError) {
            // console.log('系统日历同步失败:', calendarError);
            // 不影响主要功能，只记录错误
          }
        }
        
        Alert.alert('成功', '事件创建成功');
        // 重新获取当月事件
        const currentDate = new Date();
        fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
      } else {
        // 显示 eventsError 中的具体错误信息
        const errorMessage = eventsError || '创建事件失败，请检查网络连接和权限';
        Alert.alert('错误', errorMessage);
      }
    } catch (error) {
      // console.error('创建事件异常:', error);
      const errorMessage = error instanceof Error ? error.message : '创建事件失败';
      Alert.alert('错误', errorMessage);
    }
  };

  // 处理事件更新
  const handleUpdateEvent = async (eventId: string, eventData: any) => {
    try {
      const result = await updateEvent(eventId, eventData);
      
      if (result) {
        Alert.alert('成功', '事件更新成功');
        // 重新获取当月事件
        const currentDate = new Date();
        fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
      } else {
        // 显示 eventsError 中的具体错误信息
        const errorMessage = eventsError || '更新事件失败，请检查网络连接和权限';
        Alert.alert('错误', errorMessage);
      }
    } catch (error) {
      // console.error('更新事件异常:', error);
      const errorMessage = error instanceof Error ? error.message : '更新事件失败';
      Alert.alert('错误', errorMessage);
    }
  };

  // 处理打开编辑事件
  const handleEditEvent = (event: any) => {
    const parentId = event.parent_event_id || (event.recurrence_rule ? event.id : null);

    if (parentId) {
      setSelectedParentEventId(parentId);
      setShowRecurringEventManager(true);
    } else {
      setEditingEvent(event);
      setShowAddEventModal(true);
    }
  };

  // 处理关闭编辑事件
  const handleCloseEditEvent = () => {
    setEditingEvent(null);
    setShowAddEventModal(false);
  };

  // 处理日期点击
  const handleDatePress = (dateData: DateData) => {
    const clickedDate = new Date(dateData.dateString);
    setSelectedDate(clickedDate);
    
    // 显示该日期的事件
    const dayEvents = getProcessedEventsByDate(clickedDate);
    if (dayEvents.length > 0) {
      setShowEventListModal(true);
    } else {
      // 如果没有事件，询问是否要添加新事件
      Alert.alert(
        '这天没有事件',
        '是否要为这天添加新事件？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '添加事件',
            onPress: () => {
              setEditingEvent(null); // 清空编辑状态
              setShowAddEventModal(true);
            },
          },
        ]
      );
    }
  };

  const getProcessedEventsByDate = (date: Date) => {
    const targetDayStart = new Date(date);
    targetDayStart.setHours(0, 0, 0, 0);
    
    return processedEvents.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0,0,0,0);
      return eventStartDate.getTime() === targetDayStart.getTime();
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  // 获取当前日期信息
  const currentDate = new Date();
  const today = currentDate.toISOString().split('T')[0];

  // 生成日历标记数据
  const getCalendarMarkedDates = () => {
    const markedDates: { [key: string]: any } = {};
    
    // 标记今天
    markedDates[today] = {
      selected: true,
      selectedColor: '#3b82f6',
      selectedTextColor: '#ffffff',
    };
    
    // 标记有事件的日期
    processedEvents.forEach(event => {
      const eventDate = new Date(event.start_ts * 1000).toISOString().split('T')[0];
      if (markedDates[eventDate]) {
        markedDates[eventDate] = {
          ...markedDates[eventDate],
          marked: true,
          dotColor: event.color || '#ff6b6b',
        };
      } else {
        markedDates[eventDate] = {
          marked: true,
          dotColor: event.color || '#ff6b6b',
        };
      }
    });
    
    return markedDates;
  };

  // 处理月份变化
  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString.slice(0, 7));
    const [year, monthNum] = month.dateString.slice(0, 7).split('-').map(Number);
    fetchEvents(year, monthNum);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, styles.activeTab]}>记录</Text>
          <TouchableOpacity onPress={navigateToExplore}>
            <Text style={styles.headerTitle}>洞察</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.filterButton} onPress={toggleFilterMenu}>
            {/* 显示当前选中的过滤项的标签 */}
            <Text style={styles.filterText}>{filterOptions.find(opt => opt.value === selectedFilter)?.label}</Text>
            <Text style={styles.filterIcon}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} onPress={navigateToProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 日历部分 */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthYear}>家庭日历</Text>
            <Text style={styles.calendarNote}>记录家庭美好时光 {hasCalendarPermission && '📱 已连接系统日历'}</Text>
          </View>
          
          <Calendar
            key={currentMonth}
            current={currentMonth}
            markedDates={getCalendarMarkedDates()}
            onDayPress={handleDatePress}
            onMonthChange={handleMonthChange}
            enableSwipeMonths={true}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#2c3e50',
              selectedDayBackgroundColor: '#3b82f6',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#3b82f6',
              dayTextColor: '#2c3e50',
              textDisabledColor: '#d1d5db',
              dotColor: '#ff6b6b',
              selectedDotColor: '#ffffff',
              arrowColor: '#3b82f6',
              disabledArrowColor: '#d1d5db',
              monthTextColor: '#1f2937',
              indicatorColor: '#3b82f6',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '600',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
            hideExtraDays={true}
            firstDay={1}
            showWeekNumbers={false}
            disableMonthChange={false}
            hideDayNames={false}
            showSixWeeks={false}
            disabledByDefault={false}
            markingType={'dot'}
          />
        </View>

        {/* 今天日程 */}
        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayIcon}>📅</Text>
            <Text style={styles.todayTitle}>今天 {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</Text>
          </View>
          
          {/* 显示今天的事件，并应用过滤 */}
          {(() => {
            const todayEvents = getProcessedEventsByDate(new Date());
            
            // 根据 selectedFilter 过滤事件
            const filteredEvents = selectedFilter === 'all'
              ? todayEvents
              : todayEvents.filter(event => event.type === selectedFilter);

            if (filteredEvents.length > 0) {
              return (
                <View style={styles.eventsContainer}>
                  <View style={styles.eventsTitleContainer}>
                    <Text style={styles.eventsTitle}>📋 今日事件</Text>
                    <View style={styles.eventsCountBadge}>
                      <Text style={styles.eventsCountText}>{filteredEvents.length}</Text>
                    </View>
                  </View>
                  {filteredEvents.map((event) => (
                    <TouchableOpacity 
                      key={event.id} 
                      style={styles.eventItem}
                      onPress={() => handleEditEvent(event)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.eventColor, { backgroundColor: event.color || '#007AFF' }]} />
                      <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        {event.description && (
                          <Text style={styles.eventDescription}>{event.description}</Text>
                        )}
                        <View style={styles.eventMeta}>
                          <Text style={styles.eventTime}>
                            🕐 {new Date(event.start_ts * 1000).toLocaleTimeString('zh-CN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Text>
                          {event.location && (
                            <Text style={styles.eventLocation}>📍 {event.location}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.eventActions}>
                        <Text style={styles.eventActionIcon}>›</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            } else {
              return (
                <View style={styles.aiAssistant}>
                  <View style={styles.aiAvatar}>
                    <Text style={styles.aiEmoji}>🦝</Text>
                  </View>
                  <View style={styles.aiContent}>
                    <Text style={styles.aiGreeting}>今天还没有安排事件</Text>
                    <Text style={styles.aiSuggestion}>点击下方&ldquo;手动添加&rdquo;来创建新事件</Text>
                  </View>
                </View>
              );
            }
          })()}
          
          <TouchableOpacity style={styles.autoRecordButton}>
            <Text style={styles.autoRecordText}>智能提醒家庭安排 点我设置 〉</Text>
          </TouchableOpacity>
          
          {/* 快捷功能 */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>👶</Text>
              <Text style={styles.quickActionText}>孩子日程</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>🏠</Text>
              <Text style={styles.quickActionText}>家务安排</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>🎂</Text>
              <Text style={styles.quickActionText}>纪念日提醒</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 底部快速记录按钮 */}
      <SmartButton 
        onPress={handleVoicePress}
        text={voiceState.isRecording ? 
          `录制中... ${Math.floor(voiceState.duration / 1000)}s` : 
          '长按说话，快速记录'
        }
        onTextInputPress={() => {
          // console.log('Text input pressed')
        }}
        onTextResult={handleTextResult}
        onError={handleTextError}
        onManualAddPress={handleManualAdd}
        onPhotoPress={handlePhotoPress}
        onAlbumPress={handleAlbumPress}
        disabled={voiceState.isLoading || isProcessingImage}
      />

      {/* 过滤菜单 */}
      {showFilterMenu && (
        <View style={styles.filterMenuContainer}>
          <TouchableOpacity 
            style={styles.filterMenuOverlay} 
            onPress={() => setShowFilterMenu(false)}
          />
          <View style={styles.filterMenu}>
            {filterOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterOption,
                  selectedFilter === option.value && styles.selectedFilterOption
                ]}
                onPress={() => handleFilterSelect(option.value)}
              >
                                 <View style={styles.filterOptionContent}>
                   <View style={[styles.filterOptionIconContainer, { backgroundColor: option.bgColor }]}>
                     <Text style={[styles.filterOptionIcon, { color: option.color }]}>
                       {option.icon}
                     </Text>
                   </View>
                   <Text style={[
                     styles.filterOptionText,
                     selectedFilter === option.value && styles.selectedFilterOptionText
                   ]}>
                     {option.label}
                   </Text>
                 </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* 添加事件模态框 */}
      <AddEventModal
        visible={showAddEventModal}
        onClose={handleCloseEditEvent}
        onSave={handleCreateEvent}
        onUpdate={handleUpdateEvent}
        initialDate={selectedDate || new Date()}
        userFamilies={userFamilyDetails}
        editingEvent={editingEvent}
      />
      
      {/* 事件列表模态框 */}
      <EventListModal
        visible={showEventListModal}
        onClose={() => setShowEventListModal(false)}
        events={selectedDate ? getProcessedEventsByDate(selectedDate) : []}
        date={selectedDate || new Date()}
        onDeleteEvent={async (eventId: string) => {
          const success = await deleteEvent(eventId);
          if (success) {
            Alert.alert('成功', '事件已删除');
            // 重新获取当月事件
            const currentDate = new Date();
            fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
          }
        }}
      />
      
      <Modal
        visible={showRecurringEventManager}
        animationType="slide"
        onRequestClose={() => setShowRecurringEventManager(false)}
      >
        {selectedParentEventId && (
          <RecurringEventManager
            parentEventId={selectedParentEventId}
            onClose={() => {
              setShowRecurringEventManager(false);
              setSelectedParentEventId(null);
              const currentDate = new Date();
              fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
            }}
          />
        )}
      </Modal>
      
      {/* 语音转日程模态框 */}
      <VoiceToCalendar
        isVisible={showVoiceToCalendar}
        onClose={() => setShowVoiceToCalendar(false)}
        onEventsCreated={(events) => {
          // 重新获取当月事件
          const currentDate = new Date();
          fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
          setShowVoiceToCalendar(false);
        }}
      />

      <LoadingModal isVisible={isProcessingImage} text={loadingText} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 20,
    color: '#999',
  },
  activeTab: {
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  filterIcon: {
    fontSize: 10,
    color: '#666',
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#f0f8ff',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(135, 206, 235, 0.2)',
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 8,
  },
  monthYear: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  calendarNote: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  calendar: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 15,
    color: '#6b7280',
    width: (screenWidth - 80) / 7,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: (screenWidth - 80) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyDay: {
    opacity: 0,
  },
  calendarDayText: {
    fontSize: 17,
    color: '#2c3e50',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  todayText: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  todaySection: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  todayIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.3,
  },
  aiAssistant: {
    flexDirection: 'row',
    backgroundColor: '#fef7f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 229, 218, 0.3)',
  },
  aiAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiEmoji: {
    fontSize: 28,
  },
  aiContent: {
    flex: 1,
    paddingTop: 4,
  },
  aiGreeting: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  aiSuggestion: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  autoRecordButton: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  autoRecordText: {
    fontSize: 14,
    color: '#007AFF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  
  // 事件相关样式 - 日系精美设计
  eventsContainer: {
    marginBottom: 20,
  },
  eventsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  eventsCountBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  eventsCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  eventColor: {
    width: 6,
    height: 50,
    borderRadius: 3,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  eventContent: {
    flex: 1,
    paddingRight: 8,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  eventTime: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  eventLocation: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  eventActions: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  eventActionIcon: {
    fontSize: 18,
    color: '#d1d5db',
    fontWeight: '300',
  },
  
  // 过滤菜单样式
  filterMenuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  filterMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterMenu: {
    position: 'absolute',
    top: 105, // 往下调整更多，避免遮挡按钮
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#f0f8ff',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterOptionIcon: {
    fontSize: 14,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedFilterOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },

});