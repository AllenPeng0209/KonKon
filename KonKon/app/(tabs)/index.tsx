import AddEventModal from '@/components/AddEventModal';
import AddExpenseModal from '@/components/AddExpenseModal';
import AddMemoryModal from '@/components/AddMemoryModal';
import AlbumView from '@/components/AlbumView'; // 新增：导入相簿视图
import { ConfirmationModal } from '@/components/ConfirmationModal';
import EventListModal from '@/components/EventListModal';
import FinanceView from '@/components/FinanceView'; // Import the new component
import LoadingModal from '@/components/LoadingModal';
import RecurringEventManager from '@/components/RecurringEventManager';
import { SuccessModal } from '@/components/SuccessModal';
import SmartButton from '@/components/ui/SmartButton';
import { VoiceToCalendar } from '@/components/VoiceToCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useRecurringEvents } from '@/hooks/useRecurringEvents';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import {
  CalendarEvent,
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
  const [isProcessingText, setIsProcessingText] = useState(false); // 新增：文本处理状态
  const [loadingText, setLoadingText] = useState('');
  const [showRecurringEventManager, setShowRecurringEventManager] = useState(false);
  const [selectedParentEventId, setSelectedParentEventId] = useState<string | null>(null);
  const [processedEvents, setProcessedEvents] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState({ expense: 0, income: 0 });
  
  // 新增：确认弹窗状态
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<CalendarEvent[]>([]);
  const [pendingUserInput, setPendingUserInput] = useState<string | null>(null);
  const [pendingSummary, setPendingSummary] = useState<string | null>(null);

  // 新增：成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 新增：相簿模态框状态
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [initialMemoryImages, setInitialMemoryImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

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
    { label: t('home.album'), value: 'album', icon: '🖼️', color: '#5856D6', bgColor: '#E9E9FF' },
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

  useEffect(() => {
    if (user) {
      calculateMonthlySummary();
    }
  }, [expenses, user]);

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
      setExpenses(data || []);
    }
  };

  const calculateMonthlySummary = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let totalExpense = 0;
    let totalIncome = 0;

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        if (expense.type === 'expense') {
          totalExpense += expense.amount;
        } else if (expense.type === 'income') {
          totalIncome += expense.amount;
        }
      }
    });

    setMonthlySummary({ expense: totalExpense, income: totalIncome });
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
      // 如果当前是相册视图，则打开 AddMemoryModal
      if (selectedFilter === 'album') {
        setInitialMemoryImages(pickerResult.assets);
        setShowAddMemoryModal(true);
        return;
      }
      
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
    console.log('接收到文本输入:', result);
    setLoadingText(t('home.analyzingText'));
    setIsProcessingText(true); // 使用新的状态

    try {
      // 简单的意图识别
      if (result.match(/记账|消费|收入|花了|赚了|买单|付款/)) {
        console.log('判断为记账意图');
        const expenseResult = await processTextToExpense(result);
        handleAIExpenseResult(expenseResult);
      } else {
        console.log('判断为日程意图');
        const calendarResult = await processTextToCalendar(result);
        handleAIResult(calendarResult);
      }
    } catch (error) {
      // handleTextError(); // No longer needed, SmartButton will handle it
    } finally {
      setIsProcessingText(false); // 结束时重置状态
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

  const handleAIResult = (result: ParsedCalendarResult) => {
    console.log('Got AI result:', result);
    if (result.events && result.events.length > 0) {
      setPendingEvent(result.events);
      setPendingUserInput(result.userInput || null);
      setPendingSummary(result.summary);
      setIsConfirmationModalVisible(true);
    } else {
      // handleTextError(); // No longer needed, SmartButton will handle it
    }
  };

  const handleConfirmCreateEvent = () => {
    setIsConfirmationModalVisible(false);
    if (pendingEvent.length > 0) {
      if (pendingEvent.length > 1) {
        handleCreateMultipleAIEvents(pendingEvent);
      } else {
        handleCreateAIEvent(pendingEvent[0]);
      }
    }
  };

  const handleCancelCreateEvent = () => {
    setIsConfirmationModalVisible(false);
    setPendingEvent([]);
    setPendingUserInput(null);
    setPendingSummary(null);
  };


  // 创建从AI解析出的事件（支持语音和文字）
  const handleCreateAIEvent = async (event: any) => {
    try {
      const eventData = {
        title: event.title,
        description: event.description,
        startTime: new Date(event.startTime),
        endTime: event.endTime ? new Date(event.endTime) : undefined,
        location: event.location,
      };
      
      const createdId = await createEvent(eventData);

      if (createdId) {
        setSuccessTitle(t('home.eventCreationSuccess'));
        setSuccessMessage(t('home.eventCreationSuccessMessage', { title: event.title }));
        setShowSuccessModal(true);
      } else {
        Alert.alert(t('home.error'), t('home.eventCreationFailed'));
      }
    } catch (error) {
      console.error('AI event creation failed:', error);
      Alert.alert(t('home.error'), error instanceof Error ? error.message : t('home.eventCreationFailed'));
    }
  };

  // This function is deprecated and will be removed.
  // const createAndRefresh = async (eventData: any) => { ... }

  const handleCreateMultipleAIEvents = async (events: any[]) => {
    let successCount = 0;
    for (const event of events) {
      try {
        const eventData = {
          title: event.title,
          description: event.description,
          startTime: new Date(event.startTime),
          endTime: event.endTime ? new Date(event.endTime) : undefined,
          location: event.location,
        };
        const createdId = await createEvent(eventData);
        if (createdId) {
          successCount++;
        }
      } catch (e) {
        console.error("Failed to create one of multiple events:", e);
      }
    }

    if (successCount > 0) {
      setSuccessTitle(t('home.eventCreationSuccess'));
      setSuccessMessage(t('home.multipleEventsCreationSuccessMessage', { count: successCount }));
      setShowSuccessModal(true);
    } else {
      Alert.alert(t('home.error'), t('home.eventCreationFailed'));
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

  const handleTextError = () => {
    Alert.alert(t('home.error'), t('smartButton.parseError'));
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

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
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
          <Text style={[styles.headerTitle, styles.activeTab]}>{t('tabs.record')}</Text>
          <TouchableOpacity onPress={navigateToExplore}>
            <Text style={styles.headerTitle}>{t('tabs.explore')}</Text>
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
        {selectedFilter === 'expense' ? (
          <FinanceView expenses={expenses} monthlySummary={monthlySummary} />
        ) : selectedFilter === 'album' ? (
          <AlbumView />
        ) : (
          <>
            {/* 日历部分 */}
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.monthYear}>{t('home.familyCalendar')}</Text>
                <Text style={styles.calendarNote}>
                  {t('home.recordFamilyTime')}{' '}
                  {hasCalendarPermission && `📱 ${t('home.connectedToSystemCalendar')}`}
                </Text>
              </View>
              
              {/*
              <View style={styles.calendarTitleContainer}>
                <Text style={styles.monthYear}>{t('home.familyCalendar')}</Text>
                <Text style={styles.slogan}>
                  {t('home.recordGoodTimes')}
                  {' '}
                  <View style={styles.phoneIconContainer}>
                    <Text style={{ fontSize: 10 }}>📱</Text>
                  </View>
                  {' '}
                  {t('home.connectedToSystemCalendar')}
                </Text>
              </View>
              */}
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
          </>
        )}
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
        onParseResult={handleAIResult}
        onError={handleTextError}
        onManualAddPress={handleManualAdd}
        onPhotoPress={handlePhotoPress}
        onAlbumPress={handleAlbumPress}
        disabled={voiceState.isLoading || isProcessingImage || isProcessingText}
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
      
      {/* 新增：添加回忆模态框 */}
      <AddMemoryModal
        isVisible={showAddMemoryModal}
        onClose={() => {
          setShowAddMemoryModal(false);
          setInitialMemoryImages([]); // 清理图片
        }}
        onSave={() => {
          setShowAddMemoryModal(false);
          setInitialMemoryImages([]);
          // Note: AlbumView has its own refresh logic, so we don't need to call refresh here.
        }}
        initialImages={initialMemoryImages}
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

      <LoadingModal isVisible={isProcessingImage || isProcessingText} text={loadingText} />

      {/* 确认弹窗 */}
      <ConfirmationModal
        isVisible={isConfirmationModalVisible}
        events={pendingEvent}
        userInput={pendingUserInput}
        summary={pendingSummary}
        onConfirm={handleConfirmCreateEvent}
        onCancel={handleCancelCreateEvent}
      />
      <SuccessModal
        isVisible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successTitle}
        message={successMessage}
      />
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