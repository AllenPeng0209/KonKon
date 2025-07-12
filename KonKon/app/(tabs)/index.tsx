import AddEventModal from '@/components/AddEventModal';
import AddExpenseModal from '@/components/AddExpenseModal';
import EventListModal from '@/components/EventListModal';
import LoadingModal from '@/components/LoadingModal';
import RecurringEventManager from '@/components/RecurringEventManager';
import SmartButton from '@/components/ui/SmartButton';
import { VoiceToCalendar } from '@/components/VoiceToCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useRecurringEvents } from '@/hooks/useRecurringEvents';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import {
  ParsedCalendarResult,
  ParsedExpenseResult,
  processImageToCalendar,
  processImageToExpense,
  processTextToCalendar,
  processTextToExpense,
  processVoiceToCalendar,
  processVoiceToExpense
} from '@/lib/bailian_omni_calendar';
import CalendarService from '@/lib/calendarService';
import { TablesInsert } from '@/lib/database.types';
import { t } from '@/lib/i18n';
import { parseNaturalLanguageRecurrence } from '@/lib/recurrenceEngine';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuth } from '../../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 默认值为 'all'
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
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
  const [expenses, setExpenses] = useState<any[]>([]);
  
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
    { label: t('home.all'), value: 'all', icon: '📊', color: '#8E8E93', bgColor: '#F2F2F7' },
    { label: t('home.calendar'), value: 'calendar', icon: '🔔', color: '#FF9500', bgColor: '#FFF3E0' },
    { label: t('home.expense'), value: 'expense', icon: '💰', color: '#4CAF50', bgColor: '#E8F5E9' },
    { label: t('home.idea'), value: 'idea', icon: '💡', color: '#9C27B0', bgColor: '#F3E5F5' },
    { label: t('home.mood'), value: 'mood', icon: '❤️', color: '#E91E63', bgColor: '#FCE4EC' },
  
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (user) {
      fetchExpenses();
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
        if (!instances) continue;
        const instancesWithDetails = instances.instances.map((inst: any) => ({
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

  const fetchExpenses = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      setExpenses(data);
    }
  };

  const initializeCalendarPermissions = async () => {
    try {
      const hasPermission = await CalendarService.checkPermissions();
      setHasCalendarPermission(hasPermission);
      
      if (!hasPermission) {
        // 显示权限说明对话框
        Alert.alert(
          t('home.calendarPermissionTitle'),
          t('home.calendarPermissionMessage'),
          [
            { text: t('home.notNow'), style: 'cancel' },
            {
              text: t('home.grantPermission'),
              onPress: async () => {
                const granted = await CalendarService.requestPermissions();
                setHasCalendarPermission(granted);
                if (granted) {
                  Alert.alert(t('home.success'), t('home.permissionGranted'));
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

  // 处理手动添加
  const handleManualAdd = () => {
    setSelectedDate(new Date());
    if (selectedFilter === 'expense') {
      setEditingExpense(null);
      setShowAddExpenseModal(true);
    } else {
      setEditingEvent(null);
      setShowAddEventModal(true);
    }
  };

  // 处理语音录制按钮点击
  const handleVoicePress = async () => {
    if (voiceState.isRecording) {
      // 停止录制并处理语音
      try {
        const base64Data = await stopRecording();
        if (base64Data) {
          Alert.alert(
            t('home.processVoiceTitle'),
            t('home.processVoiceMessage'),
            [
              {
                text: t('home.cancel'),
                onPress: () => clearRecording(),
                style: 'cancel',
              },
              {
                text: t('home.convert'),
                onPress: () => {
                  if (selectedFilter === 'expense') {
                    handleVoiceToExpense(base64Data);
                  } else {
                    handleVoiceToCalendar(base64Data);
                  }
                },
              },
            ]
          );
        }
      } catch (error) {
        // console.error('停止录制失败:', error);
        Alert.alert(t('home.error'), t('home.recordingFailed'));
      }
    } else {
      // 开始录制
      try {
        await startRecording();
      } catch (error) {
        // console.error('开始录制失败:', error);
        Alert.alert(t('home.error'), t('home.micPermissionError'));
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
      Alert.alert(t('home.permissionDenied'), t('home.permissionRequired', { permission: pickerFunction === 'camera' ? t('home.camera') : t('home.photoLibrary') }));
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
        setLoadingText(t('home.processingImage'));
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (selectedFilter === 'expense') {
          const result = await processImageToExpense(base64Image);
          handleAIExpenseResult(result);
        } else {
          const result = await processImageToCalendar(base64Image);
          handleAIResult(result);
        }
      } catch (error) {
        // console.error('图片处理失败:', error);
        Alert.alert(t('home.error'), t('home.imageProcessingFailed', { error: error instanceof Error ? error.message : t('home.unknownError') }));
      } finally {
        setIsProcessingImage(false);
        setLoadingText('');
      }
    }
  };

  const handlePhotoPress = () => {
    Alert.alert(
      t('home.photo'),
      '',
      [
        { text: t('home.photo'), onPress: () => handleImageSelection('camera') },
        { text: t('home.album'), onPress: () => handleImageSelection('library') },
        { text: t('home.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleAlbumPress = () => {
    handleImageSelection('library');
  };

  // 处理语音转日程
  const handleVoiceToCalendar = async (base64Data: string) => {
    setLoadingText(t('home.processingVoice'));
    try {
      const result = await processVoiceToCalendar(base64Data);
      handleAIResult(result);
    } catch (error) {
      // console.error('语音处理失败:', error);
      Alert.alert(t('home.error'), t('home.voiceProcessingFailed'));
    } finally {
      clearRecording();
    }
  };

  // 新增：处理语音转记账
  const handleVoiceToExpense = async (base64Data: string) => {
    setLoadingText(t('home.processingVoice'));
    try {
      const result = await processVoiceToExpense(base64Data);
      handleAIExpenseResult(result);
    } catch (error) {
      Alert.alert(t('home.error'), t('home.expenseVoiceProcessingFailed'));
    } finally {
      clearRecording();
    }
  };

  // 处理文字输入转日程的结果（兼容原有逻辑）
  const handleTextResult = async (result: string) => {
    setIsProcessingImage(true);
    setLoadingText(t('home.processingVoice'));
    try {
      const calendarResult = await processTextToCalendar(result);
      if (calendarResult.events && calendarResult.events.length > 0) {
        handleAIResult(calendarResult);
      } else {
        const expenseResult = await processTextToExpense(result);
        if (expenseResult.expenses && expenseResult.expenses.length > 0) {
          handleAIExpenseResult(expenseResult);
        } else {
          Alert.alert(t('home.parsingFailed'), t('home.noValidInfo'));
        }
      }
    } catch (error) {
      // console.error('文本处理失败:', error);
      Alert.alert(t('home.error'), t('home.textProcessingFailedWithReason'));
    } finally {
      setIsProcessingImage(false);
      setLoadingText('');
    }
  };

  // 新增：统一处理AI记账结果
  const handleAIExpenseResult = (result: ParsedExpenseResult) => {
    if (!user) {
      Alert.alert(t('home.error'), t('home.userNotLoggedIn'));
      return;
    }
    if (result.expenses && result.expenses.length > 0) {
      const confidence = Math.round(result.confidence * 100);
      
      if (result.expenses.length === 1) {
        // 单个记账项目的情况
        const expense = result.expenses[0];
        const typeText = expense.type === 'income' ? t('home.income') : t('home.expenseType');
        const descriptionText = expense.description ? t('home.notes', { description: expense.description }) : '';
        
        Alert.alert(
          t('home.parsingSuccess'),
          t('home.expenseParsingSuccessMessage', {
            amount: expense.amount,
            category: expense.category,
            type: typeText,
            description: descriptionText,
            confidence: confidence
          }),
          [
            { text: t('home.cancel'), style: 'cancel' },
            { 
              text: t('home.confirmSave'), 
              onPress: () => handleSaveExpense({
                amount: expense.amount,
                category: expense.category,
                description: expense.description || null,
                date: expense.date.toISOString().split('T')[0],
                type: expense.type,
                user_id: user.id,
              })
            }
          ]
        );
      } else {
        // 多个记账项目的情况
        let expensesList = '';
        result.expenses.forEach((expense, index) => {
          const typeText = expense.type === 'income' ? t('home.income') : t('home.expenseType');
          expensesList += `${index + 1}. ${expense.amount} 元 (${typeText})\n   📂 ${expense.category}\n`;
          if (expense.description) {
            expensesList += `   ${t('home.notes', { description: expense.description })}`;
          }
          expensesList += '\n';
        });
        
        Alert.alert(
          t('home.parsingSuccess'),
          t('home.multipleExpensesParsed', {
            count: result.expenses.length,
            list: expensesList,
            confidence: confidence,
          }),
          [
            { text: t('home.cancel'), style: 'cancel' },
            { 
              text: t('home.saveAll'), 
              onPress: () => handleSaveMultipleExpenses(result.expenses)
            }
          ]
        );
      }
    } else {
      Alert.alert(t('home.parsingFailed'), t('home.noValidInfo'));
    }
  };

  // 统一处理AI解析结果
  const handleAIResult = (result: ParsedCalendarResult) => {
    // console.log('AI result:', result);
    
    if (result.events && result.events.length > 0) {
      const confidence = Math.round(result.confidence * 100);
      
      if (result.events.length === 1) {
        // 单个事件的情况
        const event = result.events[0];
        
        // 格式化时间显示
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        const formatTime = (date: Date) => {
          return date.toLocaleString(undefined, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        };
        const timeRange = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        const locationText = event.location ? t('home.location', { location: event.location }) : '';
        
        Alert.alert(
          t('home.parsingSuccess'),
          t('home.eventParsingSuccessMessage', {
            title: event.title,
            timeRange: timeRange,
            location: locationText,
            confidence: confidence
          }),
          [
            { text: t('home.cancel'), style: 'cancel' },
            { 
              text: t('home.create'), 
              onPress: () => handleCreateAIEvent(event)
            }
          ]
        );
      } else {
        // 多个事件的情况
        const formatTime = (date: Date) => {
          return date.toLocaleString(undefined, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        };
        
        let eventsList = '';
        result.events.forEach((event, index) => {
          const startTime = new Date(event.startTime);
          const endTime = new Date(event.endTime);
          const timeRange = `${formatTime(startTime)} - ${formatTime(endTime)}`;
          eventsList += `${index + 1}. ${event.title}\n   ⏰ ${timeRange}\n`;
          if (event.location) {
            eventsList += `   ${t('home.location', { location: event.location })}`;
          }
          eventsList += '\n';
        });
        
        Alert.alert(
          t('home.parsingSuccess'),
          t('home.multipleEventsParsed', {
            count: result.events.length,
            list: eventsList,
            confidence: confidence
          }),
          [
            { text: t('home.cancel'), style: 'cancel' },
            { 
              text: t('home.createAll'), 
              onPress: () => handleCreateMultipleAIEvents(result.events)
            }
          ]
        );
      }
    } else {
      Alert.alert(t('home.parsingFailed'), t('home.noValidInfo'));
    }
  };

  // 创建从AI解析出的事件（支持语音和文字）
  const handleCreateAIEvent = async (event: any) => {
    try {

      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);

      // Defensively check for invalid date objects
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        Alert.alert(t('home.error'), t('home.invalidTimeFormat'));
        return;
      }
      
      // Defensively check that start is before end
      if (startDate >= endDate) {
        Alert.alert(t('home.error'), t('home.timeSequenceError'));
        return;
      }

      // Check if the event spans across multiple days, which the current createEvent hook might not support.
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(endDate);
      endDay.setHours(0, 0, 0, 0);

      if (startDay.getTime() !== endDay.getTime()) {
        Alert.alert(
          t('home.crossDayEventReminder'),
          t('home.crossDayEventReminderMessage'),
          [
            { text: t('home.manualAdjust'), style: 'cancel' },
            {
              text: t('home.continueCreate'),
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
          Alert.alert(t('home.recurringRuleError'), t('home.recurringRuleFrequencyMissing'));
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
            t('home.recurringEventCreationSuccess'), 
            t('home.recurringEventCreationSuccessMessage', { title: event.title }),
            [{ text: t('home.ok'), style: 'default' }]
          );
          const newEventDate = new Date(startDate);
          await fetchEvents(newEventDate.getFullYear(), newEventDate.getMonth() + 1);
        } else {
          const errorMessage = recurringError || t('home.recurringEventCreationFailed');
          Alert.alert(t('home.error'), errorMessage);
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
              t('home.recurringEventCreationSuccess'), 
              t('home.recurringEventCreationSuccessMessage', { title: event.title }),
              [{ text: t('home.ok'), style: 'default' }]
            );
            const newEventDate = new Date(startDate);
            await fetchEvents(newEventDate.getFullYear(), newEventDate.getMonth() + 1);
          } else {
            const errorMessage = recurringError || t('home.recurringEventCreationFailed');
            Alert.alert(t('home.error'), errorMessage);
          }
        } else {
          // 無法解析重複模式，創建普通事件
          Alert.alert(
            t('home.parsingFailed'),
            t('home.recurringPatternRecognitionFailed'),
            [
              { text: t('home.cancel'), style: 'cancel' },
              { 
                text: t('home.continue'), 
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
      Alert.alert(t('home.error'), t('home.createEventFailed', { error: error instanceof Error ? error.message : '' }));
    }
  };

  // Helper function to create event and refresh list
  const createAndRefresh = async (eventData: any) => {
      // console.log('创建事件数据:', eventData);
      
      const createdEvent = await createEvent(eventData);
      if (createdEvent) {
        // console.log('事件创建成功:', createdEvent);
        Alert.alert(
          t('home.eventCreationSuccess'), 
          t('home.eventCreationSuccessMessage', { title: eventData.title }),
          [{ text: t('home.ok'), style: 'default' }]
        );
        const newEventDate = new Date(eventData.date);
        await fetchEvents(newEventDate.getFullYear(), newEventDate.getMonth() + 1);
      } else {
        // console.error('事件创建失败: createEvent 返回 null');
        const errorMessage = eventsError || t('home.eventCreationFailed');
        Alert.alert(t('home.error'), errorMessage);
      }
  }

  // 处理多个AI解析结果
  const handleCreateMultipleAIEvents = async (events: any[]) => {
    setLoadingText(t('home.savingEvents'));
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const event of events) {
        try {
          await handleCreateAIEvent(event);
          successCount++;
        } catch (error) {
          console.error('创建事件失败:', error);
          failCount++;
        }
      }
      
      // 显示结果
      if (successCount > 0 && failCount === 0) {
        Alert.alert(
          t('home.success'), 
          t('home.createMultipleEventsSuccess', { count: successCount }),
          [{ text: t('home.ok'), style: 'default' }]
        );
      } else if (successCount > 0 && failCount > 0) {
        Alert.alert(
          t('home.partialSuccess'), 
          t('home.createMultipleEventsPartialSuccess', { success: successCount, failed: failCount }),
          [{ text: t('home.ok'), style: 'default' }]
        );
      } else {
        Alert.alert(
          t('home.error'), 
          t('home.createMultipleEventsFailed'),
          [{ text: t('home.ok'), style: 'default' }]
        );
      }
      
      // 重新获取当月事件
      const currentDate = new Date();
      await fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
    } catch (error) {
      console.error('批量创建事件失败:', error);
      Alert.alert(t('home.error'), t('home.batchEventCreationFailed'));
    }
  };

  // 处理多个记账项目
  const handleSaveMultipleExpenses = async (expenses: any[]) => {
    if (!user) {
      Alert.alert(t('home.error'), t('home.userNotLoggedIn'));
      return;
    }
    setLoadingText(t('home.savingExpenses'));
    setIsProcessingImage(true);
    try {
      const expensesToSave = expenses.map(exp => ({
        ...exp,
        user_id: user.id,
      }));

      const { data: savedExpenses, error } = await supabase
        .from('expenses')
        .insert(expensesToSave)
        .select();

      if (error) throw error;

      if (savedExpenses) {
        setExpenses(prev => [...prev, ...savedExpenses]);
      }
      
      Alert.alert(t('home.saveSuccess'), t('home.saveExpensesSuccess', { count: savedExpenses?.length || 0 }));
    } catch (error: any) {
      console.error('保存费用失败:', error);
      Alert.alert(t('home.error'), error.message || t('home.saveExpensesFailed'));
    } finally {
      setIsProcessingImage(false);
      setLoadingText('');
      setShowAddExpenseModal(false);
    }
  };

  // 处理文字输入错误
  const handleTextError = (error: string) => {
    let errorMessage = '';
    switch (error) {
      case 'image':
        errorMessage = t('home.imageProcessingError');
        break;
      case 'voice':
        errorMessage = t('home.voiceProcessingError');
        break;
      case 'text':
        errorMessage = t('home.textProcessingError');
        break;
      default:
        errorMessage = error;
    }
    Alert.alert(t('home.error'), errorMessage);
  };

  // 处理记账保存
  const handleSaveExpense = async (expenseData: TablesInsert<'expenses'>) => {
    // 确保用户已登录
    if (!user) {
      Alert.alert(t('home.error'), t('home.expenseSaveNotLoggedIn'));
      return;
    }

    // 使用类型守卫确保 user 不为 null
    const currentUser = user;
    if (!currentUser) {
      Alert.alert(t('home.error'), t('home.userStateError'));
      return;
    }

    // 检查当前认证状态
    const { data: { session } } = await supabase.auth.getSession();
    console.log('当前会话:', session?.user?.id);
    console.log('当前用户ID:', currentUser.id);

    // 确保设置正确的 user_id
    const expenseWithUserId = {
      ...expenseData,
      user_id: currentUser.id,
    };

    console.log('保存记账数据:', expenseWithUserId);

    // 先测试认证状态
    const { data: authTest } = await supabase.auth.getUser();
    console.log('认证用户测试:', authTest);

    // 尝试直接插入
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseWithUserId)
      .select();
    if (error) {
      console.error('保存记账失败:', error);
      Alert.alert(t('home.error'), t('home.expenseSaveFailed', { error: error.message }));
    } else if (data) {
      Alert.alert(t('home.success'), t('home.expenseSaved'));
      setShowAddExpenseModal(false);
      setExpenses(prev => [data[0], ...prev]);
    }
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
        
        Alert.alert(t('home.success'), t('home.eventCreationSuccess'));
        // 重新获取当月事件
        const currentDate = new Date();
        fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
      } else {
        // 显示 eventsError 中的具体错误信息
        const errorMessage = eventsError || t('home.eventCreationFailed');
        Alert.alert(t('home.error'), errorMessage);
      }
    } catch (error) {
      // console.error('创建事件异常:', error);
      const errorMessage = error instanceof Error ? error.message : t('home.eventCreationFailed');
      Alert.alert(t('home.error'), errorMessage);
    }
  };

  // 处理事件更新
  const handleUpdateEvent = async (eventId: string, eventData: any) => {
    try {
      const result = await updateEvent(eventId, eventData);
      
      if (result) {
        Alert.alert(t('home.success'), t('home.eventUpdateSuccess'));
        // 重新获取当月事件
        const currentDate = new Date();
        fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
      } else {
        // 显示 eventsError 中的具体错误信息
        const errorMessage = eventsError || t('home.eventUpdateFailed');
        Alert.alert(t('home.error'), errorMessage);
      }
    } catch (error) {
      // console.error('更新事件异常:', error);
      const errorMessage = error instanceof Error ? error.message : t('home.eventUpdateFailed');
      Alert.alert(t('home.error'), errorMessage);
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
        t('home.noEventThisDay'),
        t('home.addEventPrompt'),
        [
          { text: t('home.cancel'), style: 'cancel' },
          {
            text: t('home.addEvent'),
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
        <Text style={styles.loadingText}>{t('home.loadingData')}</Text>
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
          <Text style={[styles.headerTitle, styles.activeTab]}>{t('home.recordTab')}</Text>
          <TouchableOpacity onPress={navigateToExplore}>
            <Text style={styles.headerTitle}>{t('home.exploreTab')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.filterButton} onPress={toggleFilterMenu}>
            {/* 显示当前选中的过滤项的标签 */}
            <Text style={styles.filterButtonText}>{filterOptions.find(opt => opt.value === selectedFilter)?.label}</Text>
            <Text style={styles.filterIcon}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} onPress={navigateToProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {showFilterMenu && (
        <View style={styles.filterMenu}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.filterMenuItem}
              onPress={() => handleFilterSelect(option.value)}
            >
              <Text style={styles.filterMenuText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 日历部分 */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthYear}>{t('home.familyCalendar')}</Text>
            <Text style={styles.calendarNote}>
              {t('home.recordFamilyTime')}{' '}
              {hasCalendarPermission && `📱 ${t('home.connectedToSystemCalendar')}`}
            </Text>
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
            <Text style={styles.todayTitle}>{t('home.today')} {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</Text>
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
                    <Text style={styles.eventsTitle}>📋 {t('home.todayEvents')}</Text>
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
                            🕐 {new Date(event.start_ts * 1000).toLocaleTimeString(undefined, { 
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
            } else if (selectedFilter === 'expense' && expenses.length > 0) {
              return (
                <View style={styles.eventsContainer}>
                  <View style={styles.eventsTitleContainer}>
                    <Text style={styles.eventsTitle}>💰 {t('home.recentExpenses')}</Text>
                    <View style={styles.eventsCountBadge}>
                      <Text style={styles.eventsCountText}>{expenses.length}</Text>
                    </View>
                  </View>
                  {expenses.map((expense) => (
                    <View key={expense.id} style={styles.eventItem}>
                      <View style={[styles.eventColor, { backgroundColor: expense.type === 'income' ? '#4CAF50' : '#F44336' }]} />
                      <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{expense.category}: {expense.amount}元</Text>
                        <Text style={styles.eventDescription}>{expense.description}</Text>
                        <View style={styles.eventMeta}>
                          <Text style={styles.eventTime}>
                            📅 {new Date(expense.date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )
            } else {
              return (
                <View style={styles.aiAssistant}>
                  <View style={styles.aiAvatar}>
                    <Text style={styles.aiEmoji}>🦝</Text>
                  </View>
                  <View style={styles.aiContent}>
                    <Text style={styles.aiGreeting}>{t('home.noEventsToday')}</Text>
                    <Text style={styles.aiSuggestion}>{t('home.manualAddPrompt')}</Text>
                  </View>
                </View>
              );
            }
          })()}
          
          <TouchableOpacity style={styles.autoRecordButton}>
            <Text style={styles.autoRecordText}>{t('home.smartReminder')} 〉</Text>
          </TouchableOpacity>
          
          {/* 快捷功能 */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>👶</Text>
              <Text style={styles.quickActionText}>{t('home.kidsSchedule')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>🏠</Text>
              <Text style={styles.quickActionText}>{t('home.choreSchedule')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>🎂</Text>
              <Text style={styles.quickActionText}>{t('home.anniversaryReminder')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 底部快速记录按钮 */}
      <SmartButton 
        onPress={handleVoicePress}
        text={voiceState.isRecording ? 
          t('home.isRecording', { duration: Math.floor(voiceState.duration / 1000) }) : 
          t('home.longPressToTalk')
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

      <AddExpenseModal
        isVisible={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        selectedDate={selectedDate}
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
            Alert.alert(t('home.success'), t('home.eventDeleted'));
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
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  filterIcon: {
    fontSize: 12,
    color: '#8E8E93',
  },
  filterMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  filterMenu: {
    position: 'absolute',
    top: 60, // Adjust this value to position the menu correctly below the button
    right: 60, // Adjust this value to align with the button
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000, // Make sure menu is on top
  },
  filterMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  filterMenuText: {
    fontSize: 16,
    color: '#333',
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
  
  // No longer need filterMenuContainer or the complex structure inside it
});