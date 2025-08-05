import AddMemoryModal from '@/components/album/AddMemoryModal';
import AlbumDetailView from '@/components/album/AlbumDetailView';
import MemoryDetailView from '@/components/album/MemoryDetailView';
import type { SimpleAlbum } from '@/components/album/SimpleAlbumView';
import SimpleAlbumView from '@/components/album/SimpleAlbumView';
import SmartAlbumModal from '@/components/album/SmartAlbumModal';
import CalendarViewSelector from '@/components/calendar/CalendarViewSelector';
import ChoreViewSelector from '@/components/chore/ChoreViewSelector';
import { ConfirmationModal, LoadingModal, SuccessModal } from '@/components/common';
import AddEventModal from '@/components/event/AddEventModal';
import EventListModal from '@/components/event/EventListModal';
import { VoiceToCalendar } from '@/components/event/VoiceToCalendar';
import MealViewSelector from '@/components/meal/MealViewSelector';
import type { MealRecord } from '@/components/meal/MealViewTypes';
import { TodoView } from '@/components/todo';
import SmartButton from '@/components/ui/SmartButton';
import todoService from '@/lib/todoService';

import EventPreviewModal from '@/components/event/EventPreviewModal';
import FamilyHealthDashboard from '@/components/health/FamilyHealthDashboard';
import ShoppingViewSelector, {
  FamilyMember,
  ShoppingBudget,
  ShoppingItem,
  Store,
} from '@/components/shopping/ShoppingViewSelector';
import { useDrawer } from '@/contexts/DrawerContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useFeatureSettings } from '@/contexts/FeatureSettingsContext';
import { useChores } from '@/hooks/useChores';
import { useEvents } from '@/hooks/useEvents';
import { useRecurringEvents } from '@/hooks/useRecurringEvents';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import {
  CalendarEvent,
  ParsedCalendarResult,
  ParsedTodoResult,
  processImageToCalendar,
  processImageToMeal,
  processImageToTodo,
  processTextToCalendar,
  processTextToMeal,
  processTextToTodo,
  processVoiceToCalendar,
  processVoiceToMeal,
  processVoiceToTodo
} from '@/lib/bailian_omni_calendar';
import CalendarService from '@/lib/calendarService';
import { t } from '@/lib/i18n';
import type { MealPlan } from '@/lib/mealService';
import mealService from '@/lib/mealService';
import { ParsedAlbumResult, voiceAlbumService } from '@/lib/voiceAlbumService';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DateData } from 'react-native-calendars';
import { useAuth } from '../../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const { userFamilies, activeFamily, switchFamily } = useFamily();
  const { featureSettings, resetAllSettings } = useFeatureSettings();
  const { openDrawer } = useDrawer();
  const router = useRouter();
  
  // 處理來自通知的導航參數
  const params = useLocalSearchParams();
  const eventIdFromNotification = params.eventId as string;
  const fromNotification = params.from as string;

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('calendar'); // 默认值为 'calendar'
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  // 已移除：记账相关状态
  const [showEventListModal, setShowEventListModal] = useState(false);
  const [showVoiceToCalendar, setShowVoiceToCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEventPreview, setShowEventPreview] = useState(false);
  const [previewingEvent, setPreviewingEvent] = useState<any>(null);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isProcessingText, setIsProcessingText] = useState(false); // 新增：文本处理状态
  const [loadingText, setLoadingText] = useState('');

  // 新增：确认弹窗状态
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<CalendarEvent[]>([]);
  const [pendingUserInput, setPendingUserInput] = useState<string | null>(null);
  const [pendingSummary, setPendingSummary] = useState<string | null>(null);

  // 新增：成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 照片查看器状态
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [photoViewerImages, setPhotoViewerImages] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // 新增：相簿模态框状态
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [showSmartAlbumModal, setShowSmartAlbumModal] = useState(false);
  const [initialMemoryImages, setInitialMemoryImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [albumCreationData, setAlbumCreationData] = useState<{ albumName: string; theme: string; keywords: string[] } | null>(null);
  
  // 相簿詳情狀態
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [showMemoryDetail, setShowMemoryDetail] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<SimpleAlbum | null>(null);
  const [showAlbumDetail, setShowAlbumDetail] = useState(false);
  const [albumRefreshTrigger, setAlbumRefreshTrigger] = useState(0);

  // 餐食管理狀態
  const [lunchSuggestions, setLunchSuggestions] = useState<MealPlan[]>([]);
  const [isGeneratingMeals, setIsGeneratingMeals] = useState(false);
  const [showMealGenerator, setShowMealGenerator] = useState(false);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);

  // 家務管理狀態
  const { tasks, isLoading: choresLoading } = useChores();
  const [currentChoreMonth, setCurrentChoreMonth] = useState(new Date().toISOString().slice(0, 7));

  // 购物管理状态
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);

  const [shoppingStores, setShoppingStores] = useState<Store[]>([]);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const [shoppingBudget, setShoppingBudget] = useState<ShoppingBudget>({
    monthly: 0,
    weekly: 0,
    spent: 0,
    remaining: 0,
    categories: {},
  });

  const handleItemToggle = (itemId: string) => {
    setShoppingItems(items => items.map(item => item.id === itemId ? { ...item, completed: !item.completed, completedDate: !item.completed ? new Date() : undefined } : item));
  };
  const handleItemAdd = (item: Omit<ShoppingItem, 'id'>) => {
    // 使用時間戳和隨機數組合生成唯一ID
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const newItem = { ...item, id: uniqueId };
    setShoppingItems(items => [...items, newItem]);
  };
  const handleItemDelete = (itemId: string) => {
    setShoppingItems(items => items.filter(item => item.id !== itemId));
  };
  const handleAssignMember = (itemId: string, memberId: string) => {
    setShoppingItems(items => items.map(item => item.id === itemId ? { ...item, assignedTo: memberId } : item));
  };

  // 使用事件管理钩子
  const { 
    events, 
    loading: eventsLoading, 
    error: eventsError, 
    createEvent, 
    updateEvent, 
    deleteEvent, 
    fetchEvents,
    clearEvents,
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

  // 动态生成过滤选项，基于启用的功能
  const filterOptions = (() => {
    const options = [];

    // 始终保持日历功能
    options.push({ label: t('home.calendar'), value: 'calendar', icon: '🔔', color: '#FF9500', bgColor: '#FFF3E0' });

    // 根据启用的功能添加选项
    if (featureSettings.familyAssistant.enabled) {
      options.push({ label: t('home.assistant'), value: 'todos', icon: '✓', color: '#007AFF', bgColor: '#E3F2FD' });
    }
    
    if (featureSettings.choreAssignment.enabled) {
      options.push({ label: t('home.chores'), value: 'choreAssignment', icon: '🏠', color: '#4CAF50', bgColor: '#E8F5E9' });
    }
    
    if (featureSettings.familyActivities.enabled) {
      options.push({ label: t('home.health'), value: 'familyActivities', icon: '🏥', color: '#FF5722', bgColor: '#FFF3E0' });
    }
    
    if (featureSettings.familyAlbum.enabled) {
      options.push({ label: t('home.album'), value: 'familyAlbum', icon: '📸', color: '#5856D6', bgColor: '#E9E9FF' });
    }
    
    if (featureSettings.shoppingList.enabled) {
      options.push({ label: t('home.shopping'), value: 'shoppingList', icon: '🛒', color: '#FF5722', bgColor: '#FFF3E0' });
    }
    
    if (featureSettings.familyFinance.enabled) {
      options.push({ label: t('home.finance'), value: 'familyFinance', icon: '💰', color: '#4CAF50', bgColor: '#E8F5E9' });
    }
    
    if (featureSettings.familyRecipes.enabled) {
      options.push({ label: t('home.recipes'), value: 'familyRecipes', icon: '🍽️', color: '#FF6B35', bgColor: '#FFF3E0' });
    }

    return options;
  })();

  useEffect(() => {
    // 初始化空的餐食數據
    setMealRecords([]);
  }, []);

  // 處理來自通知的導航參數
  useEffect(() => {
    if (eventIdFromNotification && fromNotification === 'notification') {
      console.log(`[首頁] 接收到來自通知的事件ID: ${eventIdFromNotification}`);
      
      // 確保顯示日曆視圖
      setSelectedFilter('calendar');
      
      // 可以在這裡添加更多邏輯，比如：
      // 1. 滾動到特定日期
      // 2. 高亮顯示特定事件
      // 3. 自動打開事件詳情
      
      // 清理 URL 參數，避免重複觸發
      router.replace('/(tabs)');
    }
  }, [eventIdFromNotification, fromNotification, router]);

  // 处理过滤菜单，使用 value
  const handleFilterSelect = (filterValue: string) => {
    setSelectedFilter(filterValue);
    setShowFilterMenu(false);
    
    // 所有功能都在當前頁面中顯示，不需要導航
  };

  const toggleFilterMenu = () => {
    setShowFilterMenu(!showFilterMenu);
  };

  // 餐食管理相關功能
  const generateLunchSuggestions = async () => {
    if (!user) return;
    
    setIsGeneratingMeals(true);
    try {
      const suggestions = await mealService.generateLunchSuggestions(user.id, {
        servings: 2,
        available_time: 15,
        cuisine_preference: '家常'
      });
      setLunchSuggestions(suggestions);
    } catch (error) {
      console.error('生成午餐建議失敗:', error);
      Alert.alert('錯誤', '無法生成午餐建議，請稍後重試');
    } finally {
      setIsGeneratingMeals(false);
    }
  };

  const handleMealGeneratorPress = () => {
    setShowMealGenerator(true);
  };

  const closeMealGenerator = () => {
    setShowMealGenerator(false);
    setLunchSuggestions([]);
  };

  const handleMealPress = (meal: MealRecord) => {
    router.push('/recipe-detail');
  };

  // 處理手動添加 - 根據當前filter決定打開哪個模態框
  const handleManualAdd = () => {
    // 如果當前是相簿模式，直接打開相簿添加模態框
    if (selectedFilter === 'familyAlbum') {
      setInitialMemoryImages([]); // 沒有初始圖片，純手動添加
      setShowAddMemoryModal(true);
      return;
    }
    
    // 如果是待辦模式，創建新的待辦事項
    if (selectedFilter === 'todos') {
      if (!activeFamily) {
        Alert.alert('錯誤', '請先加入或創建家庭');
        return;
      }
      // 使用SmartButton的文字輸入功能來創建待辦
      // 或者直接打開事件創建模態框，但設置為無時間的類型
      if (!selectedDate) {
        setSelectedDate(new Date());
      }
      setEditingEvent(null);
      setShowAddEventModal(true);
      return;
    }
    
    // 其他模式（日曆等）打開事件添加模態框
    // 如果没有选中日期，则使用今天
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
    setEditingEvent(null);
    setShowAddEventModal(true);
  };

  // 处理语音录制按钮点击
  const handleVoicePress = async () => {
    if (voiceState.isRecording) {
      // 停止录制并处理语音
      try {
        const base64Data = await stopRecording();
        if (base64Data) {
          // 根据当前filter决定处理方式
          if (selectedFilter === 'familyAlbum') {
            // 相簿模式：讓用戶選擇功能
            handleAlbumModeVoiceResult(base64Data);
          } else if (selectedFilter === 'todos') {
            Alert.alert(
              '語音處理',
              '是否將語音轉換為待辦事項？',
              [
                {
                  text: t('home.cancel'),
                  onPress: () => clearRecording(),
                  style: 'cancel',
                },
                {
                  text: '創建待辦',
                  onPress: () => handleVoiceToTodo(base64Data),
                },
              ]
            );
          } else if (selectedFilter === 'familyRecipes') {
            Alert.alert(
              '語音處理',
              '是否將語音轉換為餐食記錄？',
              [
                {
                  text: t('home.cancel'),
                  onPress: () => clearRecording(),
                  style: 'cancel',
                },
                {
                  text: '記錄餐食',
                  onPress: () => handleVoiceToMeal(base64Data),
                },
              ]
            );
          } else {
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
                  onPress: () => handleVoiceToCalendar(base64Data),
                },
              ]
            );
          }
        }
      } catch (error) {
        Alert.alert(t('home.error'), t('home.recordingFailed'));
      }
    } else {
      // 开始录制
      try {
        await startRecording();
      } catch (error) {
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
      // if (selectedFilter === 'album') {
      //   setInitialMemoryImages(pickerResult.assets);
      //   setShowAddMemoryModal(true);
      //   return;
      // } // 移除相册功能，还未实现
      
      const imageUri = pickerResult.assets[0].uri;
      try {
        setIsProcessingImage(true);
        setLoadingText(t('home.processingImage'));
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (selectedFilter === 'expense') {
          // const result = await processImageToExpense(base64Image); // 移除记账相关功能
          // handleAIExpenseResult(result); // 移除记账相关功能
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

  // 處理拍照功能 - 根據當前模式決定行為
  const handlePhotoPress = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('權限錯誤', '需要相機權限才能拍照');
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true, // 需要base64用於上傳
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      
      if (selectedFilter === 'familyAlbum') {
        // 相簿模式：直接打開 AddMemoryModal 來添加到相簿
        setInitialMemoryImages(pickerResult.assets);
        setShowAddMemoryModal(true);
      } else if (selectedFilter === 'todos' && asset.base64) {
        // 待辦模式：使用OCR識別照片中的待辦事項
        setIsProcessingImage(true);
        setLoadingText('正在識別圖片中的待辦事項...');
        try {
          const result = await processImageToTodo(asset.base64);
          await handleTodoResult(result);
        } catch (error) {
          console.error('圖片處理失敗:', error);
          Alert.alert(t('home.error'), '圖片識別失敗，請重試');
        } finally {
          setIsProcessingImage(false);
          setLoadingText('');
        }
      } else if (selectedFilter === 'familyRecipes' && asset.base64) {
        // 餐食模式：使用OCR識別照片中的餐食信息
        setIsProcessingImage(true);
        setLoadingText('正在識別圖片中的餐食信息...');
        try {
          const result = await processImageToMeal(asset.base64);
          await handleMealResult(result);
        } catch (error) {
          console.error('圖片處理失敗:', error);
          Alert.alert(t('home.error'), '圖片識別失敗，請重試');
        } finally {
          setIsProcessingImage(false);
          setLoadingText('');
        }
      } else if (asset.base64) {
        // 其他模式：使用OCR識別日程內容
        setIsProcessingImage(true);
        setLoadingText(t('home.processingImage'));
        try {
          const result = await processImageToCalendar(asset.base64);
          handleAIResult(result);
        } catch (error) {
          console.error('圖片處理失敗:', error);
          Alert.alert(t('home.error'), t('home.imageProcessingFailed'));
        } finally {
          setIsProcessingImage(false);
          setLoadingText('');
        }
      }
    }
  };

  // 處理相簿選取功能 - 根據當前模式決定行為
  const handleAlbumPress = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('權限錯誤', '需要相簿權限才能選取照片');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: selectedFilter === 'familyAlbum', // 只有相簿模式才允許多選
      quality: 0.7,
      base64: true, // 需要base64用於上傳和OCR識別
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      
      if (selectedFilter === 'familyAlbum') {
        // 相簿模式：打開 AddMemoryModal 來添加到相簿
        setInitialMemoryImages(pickerResult.assets);
        setShowAddMemoryModal(true);
      } else if (selectedFilter === 'todos' && asset.base64) {
        // 待辦模式：使用OCR識別圖片中的待辦事項
        setIsProcessingImage(true);
        setLoadingText('正在識別圖片中的待辦事項...');
        try {
          const result = await processImageToTodo(asset.base64);
          await handleTodoResult(result);
        } catch (error) {
          console.error('圖片處理失敗:', error);
          Alert.alert(t('home.error'), '圖片識別失敗，請重試');
        } finally {
          setIsProcessingImage(false);
          setLoadingText('');
        }
      } else if (selectedFilter === 'familyRecipes' && asset.base64) {
        // 餐食模式：使用OCR識別圖片中的餐食信息
        setIsProcessingImage(true);
        setLoadingText('正在識別圖片中的餐食信息...');
        try {
          const result = await processImageToMeal(asset.base64);
          await handleMealResult(result);
        } catch (error) {
          console.error('圖片處理失敗:', error);
          Alert.alert(t('home.error'), '圖片識別失敗，請重試');
        } finally {
          setIsProcessingImage(false);
          setLoadingText('');
        }
      } else if (asset.base64) {
        // 其他模式（日曆等）：使用OCR識別日程內容
        setIsProcessingImage(true);
        setLoadingText(t('home.processingImage'));
        try {
          const result = await processImageToCalendar(asset.base64);
          handleAIResult(result);
        } catch (error) {
          console.error('圖片處理失敗:', error);
          Alert.alert(t('home.error'), t('home.imageProcessingFailed'));
        } finally {
          setIsProcessingImage(false);
          setLoadingText('');
        }
      }
    }
  };

  // 處理語音轉待辦事項
  const handleVoiceToTodo = async (base64Data: string) => {
    setLoadingText('正在識別語音並創建待辦事項...');
    setIsProcessingImage(true); // 使用現有的處理狀態
    try {
      const result = await processVoiceToTodo(base64Data, (progress) => {
        setLoadingText(progress);
      });
      await handleTodoResult(result);
    } catch (error) {
      console.error('語音轉待辦失敗:', error);
      Alert.alert(t('home.error'), '語音轉待辦事項失敗，請重試');
    } finally {
      setIsProcessingImage(false);
      setLoadingText('');
      clearRecording();
    }
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

  // 新增：处理语音转餐食
  const handleVoiceToMeal = async (base64Data: string) => {
    setLoadingText('正在識別語音並記錄餐食...');
    setIsProcessingImage(true);
    try {
      const result = await processVoiceToMeal(base64Data);
      await handleMealResult(result);
    } catch (error) {
      console.error('语音转餐食失败:', error);
      Alert.alert(t('home.error'), '語音轉餐食記錄失敗，請重試');
    } finally {
      setIsProcessingImage(false);
      setLoadingText('');
      clearRecording();
    }
  };

  // 处理文字输入转日程的结果（兼容原有逻辑）
  const handleTextResult = async (result: string) => {
    console.log('接收到文本输入:', result);
    setLoadingText(t('home.analyzingText'));
    setIsProcessingText(true); // 使用新的状态

    try {
      // 根据当前filter决定如何处理
      if (selectedFilter === 'todos') {
        console.log('判断为待办意图');
        await handleCreateTodoFromText(result);
      } else if (selectedFilter === 'familyRecipes') {
        console.log('判断为餐食意图');
        const mealResult = await processTextToMeal(result);
        await handleMealResult(mealResult);
      } else if (result.match(/记账|消费|收入|花了|赚了|买单|付款/)) {
        console.log('判断为记账意图');
        // const expenseResult = await processTextToExpense(result); // 移除记账相关功能
        // handleAIExpenseResult(expenseResult); // 移除记账相关功能
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

  // 新增：處理待辦事項結果
  const handleTodoResult = async (result: ParsedTodoResult) => {
    if (!activeFamily || !user) {
      Alert.alert('錯誤', '請先登錄並加入家庭');
      return;
    }

    // 确定创建待办事项的目标familyId
    let targetFamilyId: string | undefined;
    if (activeFamily.id === 'meta-space' || activeFamily.tag === 'personal') {
      const personalFamily = userFamilies.find(f => f.tag === 'personal');
      if (personalFamily) {
        targetFamilyId = personalFamily.id;
      } else {
        Alert.alert('錯誤', '找不到您的個人空間來保存待辦事項');
        return;
      }
    } else {
      targetFamilyId = activeFamily.id;
    }

    if (result.todos && result.todos.length > 0) {
      try {
        // 批量創建待辦事項
        const createdTodos = [];
        for (const todo of result.todos) {
          const createParams = {
            familyId: targetFamilyId,
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            dueDate: todo.dueDate,
            assignedTo: user.id,
            // 根據當前空間決定分享邏輯（與日曆事件保持一致）
            shareToFamilies: (activeFamily.tag !== 'personal' && activeFamily.id !== 'meta-space') ? [activeFamily.id] : undefined,
          };
          const createdTodo = await todoService.createTodo(createParams);
          createdTodos.push(createdTodo);
        }

        if (createdTodos.length === 1) {
          setSuccessTitle('待辦創建成功');
          setSuccessMessage(`已成功創建待辦事項：${createdTodos[0].title}`);
        } else {
          setSuccessTitle('待辦創建成功');
          setSuccessMessage(`已成功創建 ${createdTodos.length} 個待辦事項`);
        }
        setShowSuccessModal(true);
      } catch (error) {
        console.error('创建待办失败:', error);
        Alert.alert('錯誤', '創建待辦事項失敗，請重試');
      }
    } else {
      Alert.alert(
        '圖片解析結果',
        '未能從圖片中識別出待辦事項。\n\n請確保圖片中包含明確的任務描述。',
        [
          { text: '重新選擇', onPress: () => handleAlbumPress() },
          { text: '手動添加', onPress: () => handleManualAdd() },
          { text: '取消', style: 'cancel' }
        ]
      );
    }
  };

  // 新增：處理餐食記錄結果
  const handleMealResult = async (result: any) => {
    if (!user) {
      Alert.alert('錯誤', '請先登錄');
      return;
    }

    if (result.meals && result.meals.length > 0) {
      try {
        // 更新餐食記錄狀態
        const newMealRecords = result.meals.map((meal: any) => ({
          id: `${meal.date}-${meal.mealType}-${Date.now()}`,
          date: meal.date,
          mealType: meal.mealType,
          title: meal.title,
          calories: meal.calories,
          tags: meal.tags || [],
          time: meal.time,
          emoji: (() => {
            switch (meal.mealType) {
              case 'breakfast': return '🌅';
              case 'lunch': return '☀️';
              case 'dinner': return '🌆';
              case 'snack': return '🍰';
              default: return '🍽️';
            }
          })(),
          nutrition: meal.nutrition || {
            protein: 0,
            carbs: 0,
            fat: 0,
          }
        }));

        // 添加到現有記錄中
        setMealRecords(prev => [...newMealRecords, ...prev]);

        if (newMealRecords.length === 1) {
          setSuccessTitle('餐食記錄成功');
          setSuccessMessage(`已成功記錄餐食：${newMealRecords[0].title} (${newMealRecords[0].calories}卡)`);
        } else {
          setSuccessTitle('餐食記錄成功');
          setSuccessMessage(`已成功記錄 ${newMealRecords.length} 個餐食`);
        }
        setShowSuccessModal(true);
      } catch (error) {
        console.error('创建餐食记录失败:', error);
        Alert.alert('錯誤', '創建餐食記錄失敗，請重試');
      }
    } else {
      Alert.alert(
        '解析結果',
        '未能從輸入中識別出餐食信息。\n\n請確保包含明確的餐食描述。',
        [
          { text: '重新輸入', onPress: () => {} },
          { text: '手動添加', onPress: () => handleManualAdd() },
          { text: '取消', style: 'cancel' }
        ]
      );
    }
  };

  // 新增：从文字创建待办事项
  const handleCreateTodoFromText = async (text: string) => {
    if (!activeFamily || !user) {
      Alert.alert('錯誤', '請先登錄並加入家庭');
      return;
    }

    // 确定创建待办事项的目标familyId
    let targetFamilyId: string | undefined;
    if (activeFamily.id === 'meta-space' || activeFamily.tag === 'personal') {
      const personalFamily = userFamilies.find(f => f.tag === 'personal');
      if (personalFamily) {
        targetFamilyId = personalFamily.id;
      } else {
        Alert.alert('錯誤', '找不到您的個人空間來保存待辦事項');
        return;
      }
    } else {
      targetFamilyId = activeFamily.id;
    }

    try {
      // 使用AI解析待辦事項
      const todoResult = await processTextToTodo(text);
      
      if (todoResult && todoResult.todos && todoResult.todos.length > 0) {
        // 批量創建待辦事項
        const createdTodos = [];
        for (const todo of todoResult.todos) {
          const createParams = {
            familyId: targetFamilyId,
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            dueDate: todo.dueDate,
            assignedTo: user.id,
            // 根據當前空間決定分享邏輯（與日曆事件保持一致）
            shareToFamilies: (activeFamily.tag !== 'personal' && activeFamily.id !== 'meta-space') ? [activeFamily.id] : undefined,
          };
          const createdTodo = await todoService.createTodo(createParams);
          createdTodos.push(createdTodo);
        }

        if (createdTodos.length === 1) {
          setSuccessTitle('待辦創建成功');
          setSuccessMessage(`已成功創建待辦事項：${createdTodos[0].title}`);
        } else {
          setSuccessTitle('待辦創建成功');
          setSuccessMessage(`已成功創建 ${createdTodos.length} 個待辦事項`);
        }
        setShowSuccessModal(true);
      } else {
        // 如果AI解析失敗，使用簡單解析
        const lines = text.trim().split('\n').filter(line => line.trim());
        const title = lines[0]?.trim() || text.substring(0, 50);
        const description = lines.length > 1 ? lines.slice(1).join('\n') : undefined;
        
        // 检测优先级
        let priority: 'low' | 'medium' | 'high' = 'medium';
        if (text.match(/紧急|急|重要|高优先级|高/i)) {
          priority = 'high';
        } else if (text.match(/低优先级|不急|低/i)) {
          priority = 'low';
        }

        // 檢測日期
        let dueDate: string | undefined;
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);
        
        const toLocalDateString = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        if (text.match(/今天|今日/i)) {
          dueDate = toLocalDateString(today);
        } else if (text.match(/明天|明日/i)) {
          dueDate = toLocalDateString(tomorrow);
        } else if (text.match(/後天/i)) {
          dueDate = toLocalDateString(dayAfterTomorrow);
        }

        const createParams = {
          familyId: targetFamilyId,
          title,
          description,
          priority,
          dueDate,
          assignedTo: user.id,
          // 根據當前空間決定分享邏輯（與日曆事件保持一致）
          shareToFamilies: (activeFamily.tag !== 'personal' && activeFamily.id !== 'meta-space') ? [activeFamily.id] : undefined,
        };
        await todoService.createTodo(createParams);

        setSuccessTitle('待辦創建成功');
        setSuccessMessage(`已成功創建待辦事項：${title}`);
        setShowSuccessModal(true);
      }
      
    } catch (error) {
      console.error('创建待办失败:', error);
      Alert.alert('錯誤', '創建待辦事項失敗，請重試');
    }
  };

  // 新增：统一处理AI记账结果
  // const handleAIExpenseResult = (result: ParsedExpenseResult) => { // 移除记账相关功能
  //   if (!user) {
  //     Alert.alert(t('home.error'), t('home.userNotLoggedIn'));
  //     return;
  //   }
  //   if (result.expenses && result.expenses.length > 0) {
  //     const confidence = Math.round(result.confidence * 100);
      
  //     if (result.expenses.length === 1) {
  //       // 单个记账项目的情况
  //       const expense = result.expenses[0];
  //       const typeText = expense.type === 'income' ? t('home.income') : t('home.expenseType');
  //       const descriptionText = expense.description ? t('home.notes', { description: expense.description }) : '';
        
  //       Alert.alert(
  //         t('home.parsingSuccess'),
  //         t('home.expenseParsingSuccessMessage', {
  //           amount: expense.amount,
  //           category: expense.category,
  //           type: typeText,
  //           description: descriptionText,
  //           confidence: confidence
  //         }),
  //         [
  //           { text: t('home.cancel'), style: 'cancel' },
  //           { 
  //             text: t('home.confirmSave'), 
  //             onPress: () => handleSaveExpense({
  //               amount: expense.amount,
  //               category: expense.category,
  //               description: expense.description || null,
  //               date: expense.date.toISOString().split('T')[0],
  //               type: expense.type,
  //               user_id: user.id,
  //             })
  //           }
  //         ]
  //       );
  //     } else {
  //       // 多个记账项目的情况
  //       let expensesList = '';
  //       result.expenses.forEach((expense, index) => {
  //         const typeText = expense.type === 'income' ? t('home.income') : t('home.expenseType');
  //         expensesList += `${index + 1}. ${expense.amount} 元 (${typeText})\n   📂 ${expense.category}\n`;
  //         if (expense.description) {
  //           expensesList += `   ${t('home.notes', { description: expense.description })}`;
  //         }
  //         expensesList += '\n';
  //       });
        
  //       Alert.alert(
  //         t('home.parsingSuccess'),
  //         t('home.multipleExpensesParsed', {
  //           count: result.expenses.length,
  //           list: expensesList,
  //           confidence: confidence,
  //         }),
  //         [
  //           { text: t('home.cancel'), style: 'cancel' },
  //           { 
  //             text: t('home.saveAll'), 
  //             onPress: () => handleSaveMultipleExpenses(result.expenses)
  //           }
  //         ]
  //       );
  //     }
  //   } else {
  //     Alert.alert(t('home.parsingFailed'), t('home.noValidInfo'));
  //   }
  // };

  const handleAIResult = (result: ParsedCalendarResult) => {
    console.log('Got AI result:', result);
    if (result.events && result.events.length > 0) {
      setPendingEvent(result.events);
      setPendingUserInput(result.userInput || null);
      setPendingSummary(result.summary);
      setIsConfirmationModalVisible(true);
    } else {
      // 當沒有解析出事件時，給用戶友好的反饋
      const summary = result.summary || '未能從圖片中識別出日程信息';
      Alert.alert(
        '圖片解析結果',
        `${summary}\n\n請確保圖片中包含明確的日程信息，如時間、地點、事件名稱等。`,
        [
          { text: '重新選擇', onPress: () => handleAlbumPress() },
          { text: '手動添加', onPress: () => handleManualAdd() },
          { text: '取消', style: 'cancel' }
        ]
      );
    }
  };

  // 新增：處理待辦事項語音結果的包裝函數
  const handleTodoVoiceResult = async (result: ParsedCalendarResult) => {
    // 注意：這裡的result實際上是來自processVoiceToCalendar的結果
    // 我們需要從userInput重新處理為待辦事項
    if (result.userInput) {
      try {
        // 直接使用AI文本處理來創建待辦事項
        const todoResult = await processTextToTodo(result.userInput);
        await handleTodoResult(todoResult);
      } catch (error) {
        console.error('語音轉待辦失敗:', error);
        Alert.alert(t('home.error'), '語音轉待辦事項失敗，請重試');
      }
    } else {
      Alert.alert('提示', '未能從語音中識別出待辦事項');
    }
  };

  const handleAlbumAIResult = (result: ParsedAlbumResult) => {
    console.log('Got album AI result:', result);
    if (result.success && result.albumName) {
      // 設置相簿創建數據並打開智能相簿模態框
      setAlbumCreationData({
        albumName: result.albumName,
        theme: result.theme || '日常生活',
        keywords: result.keywords || []
      });
      setShowSmartAlbumModal(true);
      
      // 顯示解析成功的提示
      const keywordText = result.keywords && result.keywords.length > 0 
        ? `，將根據關鍵詞「${result.keywords.join('、')}」智能篩選照片` 
        : '';
      Alert.alert(
        '語音解析成功',
        `準備創建相簿「${result.albumName}」（${result.theme}）${keywordText}`,
        [{ text: '開始創建', style: 'default' }]
      );
    } else {
      Alert.alert('語音識別失敗', result.error || '無法識別相簿創建指令，請重新嘗試');
    }
  };

  // 新增：處理相簿模式下的語音輸入，讓用戶選擇功能
  const handleAlbumModeVoiceResult = async (base64Data: string) => {
    Alert.alert(
      '語音功能選擇',
      '您想要用這段語音做什麼？',
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: () => clearRecording()
        },
        {
          text: '創建相簿',
          onPress: async () => {
            try {
              setLoadingText('正在解析相簿創建指令...');
              setIsProcessingImage(true);
              const result = await voiceAlbumService.processVoiceToAlbum(base64Data);
              handleAlbumAIResult(result);
            } catch (error: any) {
              Alert.alert('錯誤', error.message || '相簿創建失敗');
            } finally {
              setIsProcessingImage(false);
              setLoadingText('');
              clearRecording();
            }
          }
        },
        {
          text: '創建日程',
          onPress: () => {
            handleVoiceToCalendar(base64Data);
          }
        }
      ]
    );
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

  // 新增：處理編輯AI解析的事件
  const handleEditAIEvent = () => {
    setIsConfirmationModalVisible(false);
    
    if (pendingEvent.length > 0) {
      // 將AI解析的事件轉換為可編輯格式
      const aiEvent = pendingEvent[0]; // 如果有多個事件，編輯第一個
      
      const editableEvent = {
        id: 'temp-ai-event', // 臨時ID，表示這是新創建的事件
        title: aiEvent.title,
        description: aiEvent.description || '',
        start_ts: Math.floor(aiEvent.startTime.getTime() / 1000),
        end_ts: aiEvent.endTime ? Math.floor(aiEvent.endTime.getTime() / 1000) : Math.floor(aiEvent.startTime.getTime() / 1000) + 3600,
        location: aiEvent.location || '',
        color: '#007AFF', // 預設顏色
        type: 'calendar',
        creator_id: user?.id || '',
        // 添加一個標記，表示這是從AI解析而來的
        _isFromAI: true,
        _originalAIData: pendingEvent, // 保留原始AI解析數據
      };
      
      setEditingEvent(editableEvent);
      setShowAddEventModal(true);
    }
    
    // 清理pending數據
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
        // 🚀 修復：個人空間的事件不應該被分享，保持為私人事件
        shareToFamilies: (activeFamily?.id && activeFamily.tag !== 'personal') ? [activeFamily.id] : undefined,
        // 🚀 新增：默认添加当前用户作为参与者
        attendees: user?.id ? [user.id] : undefined,
      };
      
      const createdId = await createEvent(eventData);

      if (createdId) {
        // 🚀 发送事件创建通知给家庭成员（個人空間不發送通知）
        if (activeFamily?.id && activeFamily.tag !== 'personal' && user?.id) {
          try {
            const currentUserName = user?.user_metadata?.display_name || user?.email || '用户';
            const { notifyEventCreated } = await import('../../lib/notificationService');
            await notifyEventCreated(
              activeFamily.id, 
              event.title, 
              createdId, 
              [user.id], // 参与者列表 
              currentUserName
            );
          } catch (notificationError) {
            console.error('Failed to send AI event creation notification:', notificationError);
          }
        }
        
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
    const currentUserName = user?.user_metadata?.display_name || user?.email || '用户';
    
    for (const event of events) {
      try {
        const eventData = {
          title: event.title,
          description: event.description,
          startTime: new Date(event.startTime),
          endTime: event.endTime ? new Date(event.endTime) : undefined,
          location: event.location,
          // 🚀 修復：個人空間的事件不應該被分享，保持為私人事件
          shareToFamilies: (activeFamily?.id && activeFamily.tag !== 'personal') ? [activeFamily.id] : undefined,
          // 🚀 新增：默认添加当前用户作为参与者
          attendees: user?.id ? [user.id] : undefined,
        };
        const createdId = await createEvent(eventData);
        if (createdId) {
          successCount++;
          
          // 🚀 发送事件创建通知给家庭成员（個人空間不發送通知）
          if (activeFamily?.id && activeFamily.tag !== 'personal' && user?.id) {
            try {
              const { notifyEventCreated } = await import('../../lib/notificationService');
              await notifyEventCreated(
                activeFamily.id, 
                event.title, 
                createdId, 
                [user.id], // 参与者列表 
                currentUserName
              );
            } catch (notificationError) {
              console.error('Failed to send AI event creation notification:', notificationError);
            }
          }
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
  // const handleSaveMultipleExpenses = async (expenses: any[]) => { // 移除记账相关功能
  //   if (!user) {
  //     Alert.alert(t('home.error'), t('home.userNotLoggedIn'));
  //     return;
  //   }
  //   setLoadingText(t('home.savingExpenses'));
  //   setIsProcessingImage(true);
  //   try {
  //     const expensesToSave = expenses.map(exp => ({
  //       ...exp,
  //       user_id: user.id,
  //     }));

  //     const { data: savedExpenses, error } = await supabase
  //       .from('expenses')
  //       .insert(expensesToSave)
  //       .select();

  //     if (error) throw error;

  //     if (savedExpenses) {
  //       setExpenses(prev => [...prev, ...savedExpenses]);
  //     }
      
  //     Alert.alert(t('home.saveSuccess'), t('home.saveExpensesSuccess', { count: savedExpenses?.length || 0 }));
  //   } catch (error: any) {
  //     console.error('保存费用失败:', error);
  //     Alert.alert(t('home.error'), error.message || t('home.saveExpensesFailed'));
  //   } finally {
  //     setIsProcessingImage(false);
  //     setLoadingText('');
  //     setShowAddExpenseModal(false);
  //   }
  // };

  const handleTextError = () => {
    Alert.alert(t('home.error'), t('smartButton.parseError'));
  };

  // 处理照片点击查看
  const handlePhotoViewerPress = (imageUrls: string[], selectedIndex: number) => {
    setPhotoViewerImages(imageUrls);
    setCurrentPhotoIndex(selectedIndex);
    setShowPhotoViewer(true);
  };

  // 处理记账保存
  // const handleSaveExpense = async (expenseData: TablesInsert<'expenses'>) => { // 移除记账相关功能
  //   // 确保用户已登录
  //   if (!user) {
  //     Alert.alert(t('home.error'), t('home.expenseSaveNotLoggedIn'));
  //     return;
  //   }

  //   // 使用类型守卫确保 user 不为 null
  //   const currentUser = user;
  //   if (!currentUser) {
  //     Alert.alert(t('home.error'), t('home.userStateError'));
  //     return;
  //   }

  //   // 检查当前认证状态
  //   const { data: { session } } = await supabase.auth.getSession();
  //   console.log('当前会话:', session?.user?.id);
  //   console.log('当前用户ID:', currentUser.id);

  //   // 确保设置正确的 user_id
  //   const expenseWithUserId = {
  //     ...expenseData,
  //     user_id: currentUser.id,
  //   };

  //   console.log('保存记账数据:', expenseWithUserId);

  //   // 先测试认证状态
  //   const { data: authTest } = await supabase.auth.getUser();
  //   console.log('认证用户测试:', authTest);

  //   // 尝试直接插入
  //   const { data, error } = await supabase
  //     .from('expenses')
  //     .insert(expenseWithUserId)
  //     .select();
  //   if (error) {
  //     console.error('保存记账失败:', error);
  //     Alert.alert(t('home.error'), t('home.expenseSaveFailed', { error: error.message }));
  //   } else if (data) {
  //     Alert.alert(t('home.success'), t('home.expenseSaved'));
  //     setShowAddExpenseModal(false);
  //     setExpenses(prev => [data[0], ...prev]);
  //   }
  // };

  // 处理事件创建
  const handleCreateEvent = async (eventData: any) => {
    try {
      let result;

      // 检查是否是重复事件
      if (eventData.recurrenceRule) {
        // 创建重复事件
        const recurringEventData = {
          title: eventData.title,
          description: eventData.description,
          startDate: eventData.startTime,
          endDate: eventData.endTime || eventData.startTime,
          location: eventData.location,
          color: eventData.color,
          recurrenceRule: eventData.recurrenceRule,
          familyId: eventData.shareToFamilies && eventData.shareToFamilies.length > 0 
            ? eventData.shareToFamilies[0] 
            : undefined,
        };
        
        result = await createRecurringEvent(recurringEventData);
      } else {
        // 创建普通事件
        result = await createEvent(eventData);
      }
      
      if (result) {
        // 如果有日历权限，同步到系统日历
        if (hasCalendarPermission) {
          try {
            // 使用 eventData.startTime 作为开始时间
            const startDate = new Date(eventData.startTime);
            let endDate = eventData.endTime ? new Date(eventData.endTime) : new Date(eventData.startTime);
            
            // 如果没有endTime，设置为开始时间+1小时
            if (!eventData.endTime) {
              endDate.setTime(startDate.getTime() + 60 * 60 * 1000);
            }
            
            const systemEventId = await CalendarService.createSystemEvent({
              title: eventData.title,
              description: eventData.description,
              startDate,
              endDate,
              location: eventData.location,
              allDay: eventData.type === 'todo' ? false : false, // 待办事项不设置全天
            });
            
            // 系统日历同步成功
            if (systemEventId) {
              console.log('已同步到系统日历:', systemEventId);
            }
          } catch (calendarError) {
            console.error('系统日历同步失败:', calendarError);
            // 显示用户友好的错误信息
            if (calendarError instanceof Error && calendarError.message.includes('saveEventAsync')) {
              console.warn('系统日历同步功能暂时不可用，但事件已成功保存到应用内');
            }
            // 不影响主要功能，只记录错误
          }
        }
        
        // 使用美化的成功模態框
        setSuccessTitle(t('home.eventCreationSuccess'));
        setSuccessMessage(t('home.eventCreationSuccessMessage', { title: eventData.title }));
        setShowSuccessModal(true);
        
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
        // 使用美化的成功模態框
        setSuccessTitle(t('home.eventUpdateSuccess'));
        setSuccessMessage(`事件「${eventData.title || ''}」已更新成功`);
        setShowSuccessModal(true);
        // ✅ 移除不必要的 fetchEvents 调用 - updateEvent 内部已经处理了乐观更新
        // 只有在重复状态变化时，updateEvent 内部会异步刷新
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
    // 统一使用 AddEventModal 编辑所有类型的事件
    // 无论是普通事件还是重复事件，都使用相同的 UI
    setEditingEvent(event);
    setShowAddEventModal(true);
  };

  // 处理打开预览事件
  const handlePreviewEvent = (event: any) => {
    setPreviewingEvent(event);
    setShowEventPreview(true);
  };

  // 处理从预览到编辑的转换
  const handleEditFromPreview = () => {
    if (previewingEvent) {
      setShowEventPreview(false);
      setEditingEvent(previewingEvent);
      setShowAddEventModal(true);
    }
  };

  // 处理关闭预览事件
  const handleCloseEventPreview = () => {
    setPreviewingEvent(null);
    setShowEventPreview(false);
  };

  // 处理关闭编辑事件
  const handleCloseEditEvent = () => {
    setEditingEvent(null);
    setShowAddEventModal(false);
  };

  // 处理日期点击
  const handleDatePress = (dateData: DateData) => {
    const clickedDate = new Date(dateData.year, dateData.month - 1, dateData.day);
    setSelectedDate(clickedDate);
    
    // 不再弹出模态框，而是直接更新选中的日期
    // 日历视图会自动响应 selectedDate 的变化
    // 如果需要添加事件，用户可以通过底部的添加按钮操作
  };

  const getProcessedEventsByDate = (date: Date) => {
    const targetDayStart = new Date(date);
    targetDayStart.setHours(0, 0, 0, 0);
    
    // 直接使用 events 而不是 processedEvents 來確保事件正確顯示
    return events.filter(event => {
      const eventStartDate = new Date(event.start_ts * 1000);
      eventStartDate.setHours(0, 0, 0, 0);
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
  
  // 获取本地日期字符串（避免时区问题）
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getLocalDateString(currentDate);

  // 生成日历标记数据
  const getCalendarMarkedDates = () => {
    const markedDates: { [key: string]: any } = {};
    const selectedDateString = selectedDate ? getLocalDateString(selectedDate) : today;
    
    // 标记选中的日期
    markedDates[selectedDateString] = {
      selected: true,
      selectedColor: '#3b82f6',
      selectedTextColor: '#ffffff',
    };
    
    // 如果今天不是选中日期，为今天设置特殊的文字颜色
    if (today !== selectedDateString) {
      markedDates[today] = {
        selected: false,
        // todayTextColor 在 theme 中定义
      };
    }
    
    // 标记有事件的日期
    events.forEach(event => {
      const eventDate = getLocalDateString(new Date(event.start_ts * 1000));
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
    const newMonth = month.dateString.slice(0, 7);
    
    // 强制清除事件缓存，确保重新计算重复事件
    clearEvents();
    setCurrentMonth(newMonth);
    
    const [year, monthNum] = newMonth.split('-').map(Number);
    
    // 延迟获取事件，确保状态已更新
    setTimeout(() => {
      fetchEvents(year, monthNum);
    }, 100);
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  // 處理家庭選擇
  const handleFamilySelect = async (family: any) => {
    setShowFamilyMenu(false);
    if (family && family.id !== activeFamily?.id) {
      await switchFamily(family.id);
    }
  };

  // 跳转到洞察页面
  const navigateToExplore = () => {
    router.push('/explore');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.hamburgerButton} 
            onPress={openDrawer}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={22} color="#1D1D1F" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerCenter}>
                               <View style={styles.segmentedControlContainer}>
            <TouchableOpacity 
              style={[
                styles.segmentedButton,
                styles.leftSegment,
                showFamilyMenu ? styles.segmentActive : styles.segmentInactive
              ]}
              onPress={() => setShowFamilyMenu(!showFamilyMenu)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.segmentText,
                showFamilyMenu ? styles.segmentTextActive : styles.segmentTextInactive
              ]} numberOfLines={1}>
                {activeFamily 
                  ? (activeFamily.tag === 'personal' ? t('space.personalSpace') : 
                     activeFamily.id === 'meta-space' ? t('drawer.metaSpace') : 
                     activeFamily.name)
                  : '空間'}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={12} 
                color={showFamilyMenu ? "#1D1D1F" : "#3C3C43"} 
                style={styles.segmentIcon}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.segmentedButton,
                styles.rightSegment,
                showFilterMenu ? styles.segmentActive : styles.segmentInactive
              ]}
              onPress={toggleFilterMenu}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.segmentText,
                showFilterMenu ? styles.segmentTextActive : styles.segmentTextInactive
              ]} numberOfLines={1}>
                {filterOptions.find(opt => opt.value === selectedFilter)?.label || 'カレンダー'}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={12} 
                color={showFilterMenu ? "#1D1D1F" : "#3C3C43"} 
                style={styles.segmentIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.exploreButton} 
            onPress={navigateToExplore}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles-outline" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>

      {showFilterMenu && (
        <View style={styles.filterMenuOverlay}>
          <TouchableOpacity style={styles.filterMenuBackground} onPress={() => setShowFilterMenu(false)} />
          <View style={styles.filterMenu}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterMenuItem,
                  selectedFilter === option.value && styles.filterMenuItemActive
                ]}
                onPress={() => handleFilterSelect(option.value)}
              >
                <View style={[styles.filterMenuIcon, { backgroundColor: option.bgColor }]}>
                  <Text style={styles.filterMenuIconText}>{option.icon}</Text>
                </View>
                <Text style={[
                  styles.filterMenuText,
                  selectedFilter === option.value && styles.filterMenuTextActive
                ]}>
                  {option.label}
                </Text>
                {selectedFilter === option.value && (
                  <Text style={styles.filterMenuCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showFamilyMenu && (
        <View style={styles.familyMenuOverlay}>
          <TouchableOpacity style={styles.familyMenuBackground} onPress={() => setShowFamilyMenu(false)} />
          <View style={styles.familyMenu}>
            {/* 元空間選項 - 固定在最上方 */}
            <TouchableOpacity
              style={[
                styles.familyMenuItem,
                styles.metaSpaceMenuItem,
                activeFamily?.id === 'meta-space' && styles.familyMenuItemActive
              ]}
                              onPress={() => handleFamilySelect({ id: 'meta-space', name: t('drawer.metaSpace') })}
            >
              <View style={[styles.familyMenuIcon, styles.metaSpaceIcon]}>
                <Text style={styles.familyMenuIconText}>🌌</Text>
              </View>
              <Text style={[
                styles.familyMenuText,
                styles.metaSpaceText,
                activeFamily?.id === 'meta-space' && styles.familyMenuTextActive
              ]}>
                                  {t('drawer.metaSpace')}
              </Text>
              {activeFamily?.id === 'meta-space' && (
                <Text style={styles.familyMenuCheck}>✓</Text>
              )}
            </TouchableOpacity>
            
            {/* 個人空間選項 */}
            {userFamilies.find(f => f.tag === 'personal') && (
              <TouchableOpacity
                style={[
                  styles.familyMenuItem,
                  styles.metaSpaceMenuItem,
                  activeFamily?.tag === 'personal' && styles.familyMenuItemActive
                ]}
                onPress={() => handleFamilySelect(userFamilies.find(f => f.tag === 'personal'))}
              >
                <View style={[styles.familyMenuIcon, styles.metaSpaceIcon]}>
                  <Text style={styles.familyMenuIconText}>👤</Text>
                </View>
                <Text style={[
                  styles.familyMenuText,
                  styles.metaSpaceText,
                  activeFamily?.tag === 'personal' && styles.familyMenuTextActive
                ]}>
                  {t('space.personalSpace')}
                </Text>
                {activeFamily?.tag === 'personal' && (
                  <Text style={styles.familyMenuCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            
            {/* 分隔線 */}
            {userFamilies.filter(f => f.tag !== 'personal').length > 0 && (
              <View style={styles.familyMenuSeparator} />
            )}
            
            {/* 其他家庭列表（排除個人空間） */}
            {userFamilies.filter(f => f.tag !== 'personal').map((family) => (
              <TouchableOpacity
                key={family.id}
                style={[
                  styles.familyMenuItem,
                  activeFamily?.id === family.id && styles.familyMenuItemActive
                ]}
                onPress={() => handleFamilySelect(family)}
              >
                <View style={[styles.familyMenuIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={styles.familyMenuIconText}>🏠</Text>
                </View>
                <Text style={[
                  styles.familyMenuText,
                  activeFamily?.id === family.id && styles.familyMenuTextActive
                ]}>
                  {family.name}
                </Text>
                {activeFamily?.id === family.id && (
                  <Text style={styles.familyMenuCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 直接渲染避免嵌套問題的功能 */}
      {selectedFilter === 'familyAlbum' ? (
        <SimpleAlbumView 
          onAlbumPress={(album) => {
            setSelectedAlbum(album);
            setShowAlbumDetail(true);
          }}
          onAddAlbum={() => {
            setShowSmartAlbumModal(true);
          }}
          refreshTrigger={albumRefreshTrigger}
        />
      ) : selectedFilter === 'todos' ? (
        // 待辦功能 - 避免FlatList嵌套在ScrollView中
        <TodoView />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedFilter === 'familyRecipes' ? (
            // 使用新的餐食視圖選擇器
            <MealViewSelector
              mealRecords={mealRecords}
              selectedDate={selectedDate || new Date()}
              onMealPress={handleMealPress}
              onDatePress={(date: Date) => setSelectedDate(date)}
              currentView={(() => {
                const selectedStyle = featureSettings.familyRecipes?.settings?.selectedStyle;
                switch (selectedStyle) {
                  case '日曆網格': return 'calendar_grid';
                  case '每日記錄': return 'daily_records';
                  case '週間概覽': return 'weekly_overview';
                  case '營養圖表': return 'nutrition_chart';
                  default: return 'calendar_grid';
                }
              })()}
            />
          ) : selectedFilter === 'choreAssignment' ? (
          // 使用家務視圖選擇器
          <ChoreViewSelector
            tasks={tasks}
            selectedDate={selectedDate || new Date()}
            currentMonth={currentChoreMonth}
            onDatePress={(date: Date) => setSelectedDate(date)}
            onTaskPress={(task) => {
              // TODO: 處理家務任務點擊
              console.log('Task clicked:', task);
            }}
            onMonthChange={(month: string) => setCurrentChoreMonth(month)}
            style={(() => {
              const selectedStyle = featureSettings.choreAssignment?.settings?.selectedStyle;
              switch (selectedStyle) {
                case '任務看板': return 'task-board';
                case '日曆網格': return 'calendar-grid';
                case '家庭儀表板': return 'family-dashboard';
                case '進度花園': return 'progress-garden';
                case '統計儀表板': return 'stats-dashboard';
                default: return 'task-board';
              }
            })()}
          />
        ) : selectedFilter === 'familyActivities' ? (
          // 健康管理功能
          <FamilyHealthDashboard />
        ) : selectedFilter === 'shoppingList' ? (
          <ShoppingViewSelector
            shoppingItems={shoppingItems}
            stores={shoppingStores}
            familyMembers={familyMembers}
            budget={shoppingBudget}
            onItemToggle={handleItemToggle}
            onItemAdd={handleItemAdd}
            onItemDelete={handleItemDelete}
            onAssignMember={handleAssignMember}
            style={(() => {
                const selectedStyle = featureSettings.shoppingList?.settings?.selectedStyle;
                switch (selectedStyle) {
                    case '智能清单': return 'smart-list';
                    case '家庭看板': return 'family-board';
                    case '商店优惠': return 'store-deals';
                    case '预算跟踪': return 'budget-tracker';
                    case '历史分析': return 'history-analyzer';
                    default: return 'smart-list';
                }
            })()}
          />
        ) : selectedFilter === 'familyFinance' ? (
          // 家庭財務管理功能 - 直接顯示在主頁面
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* 演示模式提醒 */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#E3F2FD',
              borderRadius: 8,
              padding: 12,
              margin: 16,
              gap: 8,
            }}>
              <Text style={{ fontSize: 24 }}>ℹ️</Text>
              <Text style={{
                flex: 1,
                fontSize: 14,
                color: '#1976D2',
              }}>
                這是演示模式，創建家庭後可保存真實記帳數據
              </Text>
            </View>

            {/* 主要餘額展示 */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              margin: 16,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}>
              <Text style={{ 
                fontSize: 14, 
                color: '#8E8E93', 
                textAlign: 'center',
                marginBottom: 8,
                fontWeight: '500' 
              }}>
                本月結餘
              </Text>
              <Text style={{ 
                fontSize: 36, 
                fontWeight: '700', 
                color: '#8E8E93',
                textAlign: 'center',
                marginBottom: 16,
              }}>
                ¥0
              </Text>
              
              {/* 收支對比 */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: '#F2F2F7',
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>收入</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#8E8E93' }}>
                    ¥0
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>支出</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#8E8E93' }}>
                    ¥0
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>交易</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#8E8E93' }}>
                    0 筆
                  </Text>
                </View>
              </View>
            </View>

            {/* 最近交易 */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              margin: 16,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 6,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#1D1D1F' }}>
                  最近記錄
                </Text>
                <TouchableOpacity onPress={() => router.push('/finance-management')}>
                  <Text style={{ fontSize: 14, color: '#007AFF', fontWeight: '500' }}>
                    查看全部
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* 空狀態提示 */}
              <View style={{
                alignItems: 'center',
                paddingVertical: 40,
                paddingHorizontal: 20,
              }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: '#8E8E93',
                  textAlign: 'center',
                  marginBottom: 8
                }}>
                  還沒有記錄
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: '#8E8E93',
                  textAlign: 'center',
                  lineHeight: 20
                }}>
                  開始記錄您的收支，建立財務習慣
                </Text>
              </View>
            </View>

            {/* 快速新增按鈕 */}
            <View style={{
              padding: 20,
              alignItems: 'center',
            }}>
              <TouchableOpacity 
                style={{
                  backgroundColor: '#007AFF',
                  borderRadius: 25,
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#007AFF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={() => router.push('/finance-management')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>💰</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  記一筆
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <>
            {/* 日历部分 */}
            <CalendarViewSelector
              events={events.map(event => ({
                id: event.id,
                title: event.title,
                description: event.description || undefined,
                start_ts: event.start_ts,
                end_ts: event.end_ts || event.start_ts,
                location: event.location || undefined,
                color: event.color || undefined,
                type: event.type || undefined,
                parent_event_id: event.parent_event_id || undefined,
                creator_id: event.creator_id,
                image_urls: event.image_urls // ✅ 添加 image_urls 字段
              }))}
              selectedDate={selectedDate || new Date()}
              currentMonth={currentMonth}
              onDatePress={(date: Date) => {
                const dateData = {
                  year: date.getFullYear(),
                  month: date.getMonth() + 1,
                  day: date.getDate(),
                  timestamp: date.getTime(),
                  dateString: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
                };
                handleDatePress(dateData);
              }}
              onEventPress={handlePreviewEvent}
              onMonthChange={(month: string) => {
                const dateData = {
                  year: parseInt(month.split('-')[0]),
                  month: parseInt(month.split('-')[1]),
                  day: 1,
                  timestamp: new Date(month + '-01').getTime(),
                  dateString: month + '-01',
                };
                handleMonthChange(dateData);
              }}
              style={(() => {
                const selectedStyle = featureSettings.familySchedule?.settings?.selectedStyle;
                switch (selectedStyle) {
                  case '網格月視圖': return 'grid-month';
                  case '週間網格': return 'weekly-grid';
                  case '時間線視圖': return 'timeline';
                  case '家庭花園': return 'family-garden';
                  case '議程列表': return 'agenda-list';
                  default: return 'grid-month';
                }
              })()}
            />

            {/* 选中日期的日程 */}
            <View style={styles.todaySection}>
              <View style={styles.todayHeader}>
                <Text style={styles.todayIcon}>📅</Text>
                <Text style={styles.todayTitle}>
                  {(() => {
                    const displayDate = selectedDate || new Date();
                    const today = new Date();
                    const isToday = displayDate.toDateString() === today.toDateString();
                    
                    if (isToday) {
                      return `${t('home.today')} ${displayDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`;
                    } else {
                      return displayDate.toLocaleDateString(undefined, { 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                      });
                    }
                  })()}
                </Text>
              </View>
              
              {/* 显示选中日期的事件，并应用过滤 */}
              {(() => {
                const displayDate = selectedDate || new Date();
                const dayEvents = getProcessedEventsByDate(displayDate);
                
                // 根据 selectedFilter 过滤事件
                const filteredEvents = selectedFilter === 'calendar'
                  ? dayEvents
                  : dayEvents.filter(event => event.type === selectedFilter);

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
                          onPress={() => handlePreviewEvent(event)}
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
                            {/* 照片预览 */}
                            {event.image_urls && event.image_urls.length > 0 && (
                              <View style={styles.eventPhotos}>
                                <ScrollView 
                                  horizontal 
                                  showsHorizontalScrollIndicator={false}
                                  style={styles.eventPhotosContainer}
                                >
                                  {event.image_urls.slice(0, 3).map((url: string, index: number) => (
                                    <TouchableOpacity
                                      key={index}
                                      onPress={() => handlePhotoViewerPress(event.image_urls!, index)}
                                      activeOpacity={0.8}
                                    >
                                      <Image
                                        source={{ uri: url }}
                                        style={styles.eventPhoto}
                                        resizeMode="cover"
                                      />
                                    </TouchableOpacity>
                                  ))}
                                  {event.image_urls.length > 3 && (
                                    <TouchableOpacity 
                                      style={styles.eventPhotoMore}
                                      onPress={() => handlePhotoViewerPress(event.image_urls!, 3)}
                                      activeOpacity={0.8}
                                    >
                                      <Text style={styles.eventPhotoMoreText}>+{event.image_urls.length - 3}</Text>
                                    </TouchableOpacity>
                                  )}
                                </ScrollView>
                              </View>
                            )}
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
                        <Text style={styles.aiEmoji}>🌟</Text>
                      </View>
                      <View style={styles.aiContent}>
                        <Text style={styles.aiGreeting}>
                          {selectedDate ? '这一天很清闲哦' : '今天没有安排'}
                        </Text>
                        <Text style={styles.aiSuggestion}>可以添加新的日程安排</Text>
                      </View>
                    </View>
                  );
                }
              })()}
              
              {/* <TouchableOpacity style={styles.autoRecordButton}>
                <Text style={styles.autoRecordText}>{t('home.smartReminder')} 〉</Text>
              </TouchableOpacity> */}
              
              {/* 快捷功能 */}
              {/* <View style={styles.quickActions}>
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
              </View> */}
            </View>
          </>
        )}
        </ScrollView>
      )}

      {/* 底部快速记录按钮 */}
      <SmartButton 
        onPress={handleVoicePress}
        text={voiceState.isRecording ? 
          t('home.isRecording', { duration: Math.floor(voiceState.duration / 1000) }) : 
          (selectedFilter === 'familyAlbum' ? 
            t('voice.longPressSmartSelect') : 
            selectedFilter === 'todos' ?
              t('voice.pressSpeakQuickCreate') :
              t('home.longPressToTalk')
          )
        }
        onTextInputPress={() => {
          // console.log('Text input pressed')
        }}
        onTextResult={handleTextResult}
        onParseResult={selectedFilter === 'todos' ? handleTodoVoiceResult : 
          (selectedFilter !== 'familyAlbum' ? handleAIResult : undefined)}
        onAlbumParseResult={undefined} // 相簿模式不再自動解析，改為用戶選擇
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
        onDelete={async (eventId: string) => {
          const success = await deleteEvent(eventId);
          if (success) {
            setShowAddEventModal(false);
            setEditingEvent(null);
          }
        }}
        initialDate={selectedDate || new Date()}
        userFamilies={userFamilies}
        editingEvent={editingEvent}
      />

      {/* 事件預覽模态框 */}
      <EventPreviewModal
        visible={showEventPreview}
        onClose={handleCloseEventPreview}
        onEdit={handleEditFromPreview}
        event={previewingEvent}
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
          // Note: SimpleAlbumView has its own refresh logic, so we don't need to call refresh here.
        }}
        initialImages={initialMemoryImages}
      />

      {/* 新增：智能相簿創建模態框 */}
      <SmartAlbumModal
        isVisible={showSmartAlbumModal}
        onClose={() => {
          setShowSmartAlbumModal(false);
          setAlbumCreationData(null);
        }}
        onSave={() => {
          setShowSmartAlbumModal(false);
          setAlbumCreationData(null);
          // 觸發相簿列表刷新
          setAlbumRefreshTrigger(prev => prev + 1);
        }}
        albumName={albumCreationData?.albumName || ''}
        theme={albumCreationData?.theme || '日常生活'}
        keywords={albumCreationData?.keywords || []}
      />

      {/* 餐食生成器模態框 */}
      <Modal visible={showMealGenerator} animationType="slide">
        <SafeAreaView style={styles.mealGeneratorContainer}>
          <View style={styles.mealGeneratorHeader}>
            <TouchableOpacity onPress={closeMealGenerator}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.mealGeneratorTitle}>30秒智能午餐生成器</Text>
            <View />
          </View>
          
          <View style={styles.mealGeneratorContent}>
            <Text style={styles.aiDescription}>
              🤖 解決74.1%家庭主婦的最大痛點
            </Text>
            <Text style={styles.aiSubtitle}>
              輸入家庭需求，AI立即推薦3-5個15分鐘可完成的午餐選項
            </Text>
            
            <TouchableOpacity 
              style={[styles.generateMealButton, isGeneratingMeals && styles.generateMealButtonDisabled]}
              onPress={generateLunchSuggestions}
              disabled={isGeneratingMeals}
            >
              <Text style={styles.generateMealButtonText}>
                {isGeneratingMeals ? '🤖 AI 生成中...' : '🚀 開始生成午餐方案'}
              </Text>
            </TouchableOpacity>
            
            {lunchSuggestions.length > 0 && (
              <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.suggestionsTitle}>💡 AI 推薦午餐方案</Text>
                {lunchSuggestions.map((suggestion) => (
                  <TouchableOpacity 
                    key={suggestion.id} 
                    style={styles.suggestionCard}
                    onPress={() => Alert.alert(
                      `${suggestion.title} 詳情`,
                      `🕐 料理時間：${suggestion.cooking_time}分鐘\n👥 份數：${suggestion.servings}人份\n🍽️ 料理類型：${suggestion.cuisine_type}\n⭐ 難度：${'⭐'.repeat(suggestion.difficulty)}\n\n📝 食材：\n${suggestion.ingredients.map(ing => `• ${ing.name} ${ing.amount} ${ing.unit}`).join('\n')}\n\n👨‍🍳 做法：\n${suggestion.instructions.map((step, index) => `${index + 1}. ${step}`).join('\n')}`
                    )}
                  >
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionTitleText}>{suggestion.title}</Text>
                      <View style={styles.suggestionMeta}>
                        <Text style={styles.suggestionTime}>⏱️ {suggestion.cooking_time}分</Text>
                        <Text style={styles.suggestionDifficulty}>{'⭐'.repeat(suggestion.difficulty)}</Text>
                      </View>
                    </View>
                    <Text style={styles.suggestionDescription}>
                      {suggestion.cuisine_type} · {suggestion.servings}人份 · {suggestion.nutrition.calories}卡
                    </Text>
                    <View style={styles.suggestionTags}>
                      {suggestion.tags.map((tag) => (
                        <Text key={tag} style={styles.suggestionTag}>#{tag}</Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* 事件列表模态框 */}
      <EventListModal
        visible={showEventListModal}
        onClose={() => setShowEventListModal(false)}
        events={selectedDate ? getProcessedEventsByDate(selectedDate) : []}
        date={selectedDate || new Date()}
        onDeleteEvent={async (eventId: string) => {
          const success = await deleteEvent(eventId);
          if (success) {
            // 使用美化的成功模態框
            setSuccessTitle(t('home.success'));
            setSuccessMessage(t('home.eventDeleted'));
            setShowSuccessModal(true);
            
            // 重新获取当月事件
            const currentDate = new Date();
            fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
          }
        }}
      />
      
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
        onEdit={handleEditAIEvent}
      />
      <SuccessModal
        isVisible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successTitle}
        message={successMessage}
      />
      
      {/* 相簿詳情頁 */}
      {selectedMemory && (
        <MemoryDetailView
          memory={selectedMemory}
          isVisible={showMemoryDetail}
          onClose={() => {
            setShowMemoryDetail(false);
            setSelectedMemory(null);
          }}
          onMemoryUpdate={(updatedMemory) => {
            // 這裡可以更新本地狀態，但由於我們在SimpleAlbumView中處理，
            // 這個回調主要用於其他可能的狀態同步
          }}
        />
      )}

      {/* 相簿詳情頁 */}
      {selectedAlbum && (
        <AlbumDetailView
          album={selectedAlbum}
          isVisible={showAlbumDetail}
          onClose={() => {
            setShowAlbumDetail(false);
            setSelectedAlbum(null);
          }}
          onDelete={() => {
            try {
              // 刷新相簿列表
              setAlbumRefreshTrigger(prev => prev + 1);
              setShowAlbumDetail(false);
              setSelectedAlbum(null);
            } catch (error) {
              console.error('Error in album delete callback:', error);
              // 確保 UI 狀態正確重置
              setShowAlbumDetail(false);
              setSelectedAlbum(null);
            }
          }}
          onPhotoAdded={() => {
            // 刷新相簿列表以更新照片數量
            setAlbumRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {/* 照片查看器 */}
      <Modal
        visible={showPhotoViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoViewer(false)}
      >
        <View style={styles.photoViewerContainer}>
          <View style={styles.photoViewerHeader}>
            <TouchableOpacity 
              style={styles.photoViewerCloseButton}
              onPress={() => setShowPhotoViewer(false)}
            >
              <Text style={styles.photoViewerCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.photoViewerCounter}>
              {currentPhotoIndex + 1} / {photoViewerImages.length}
            </Text>
            <View style={styles.photoViewerPlaceholder} />
          </View>
          
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
              setCurrentPhotoIndex(newIndex);
            }}
            contentOffset={{ x: currentPhotoIndex * screenWidth, y: 0 }}
          >
            {photoViewerImages.map((imageUrl, index) => (
              <View key={index} style={styles.photoViewerImageContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.photoViewerImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          
          {photoViewerImages.length > 1 && (
            <View style={styles.photoViewerDots}>
              {photoViewerImages.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.photoViewerDot,
                    index === currentPhotoIndex && styles.photoViewerActiveDot
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFBFC',
    position: 'relative',
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  recordFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    minWidth: 80,
    maxWidth: 120,
    height: 36,
  },
  recordFilterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    textAlign: 'center',
    marginRight: 8,
  },
  recordFilterIcon: {
    fontSize: 12,
    color: '#8E8E93',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  segmentedControlContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F5',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    height: 34,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    zIndex: 1,
      },
    familyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    minWidth: 80,
    maxWidth: 150,
    height: 36, // 與exploreButton保持一致的高度
  },
  familyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    textAlign: 'center',
    marginRight: 8,
  },
  familyDropdownIcon: {
    fontSize: 10,
    color: '#8E8E93',
  },
  noFamilyText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  exploreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.15)',
  },
  exploreIcon: {
    fontSize: 18,
  },
  filterMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  filterMenuBackground: {
    flex: 1,
  },
  filterMenu: {
    position: 'absolute',
    top: 62,
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2,
  },
  filterMenuItemActive: {
    backgroundColor: '#F0F8FF',
  },
  filterMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterMenuIconText: {
    fontSize: 16,
  },
  filterMenuText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 1,
  },
  filterMenuTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  filterMenuCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  familyMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
  },
  familyMenuBackground: {
    flex: 1,
  },
  familyMenu: {
    position: 'absolute',
    top: 62,
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    maxWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  familyMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2,
  },
  familyMenuItemActive: {
    backgroundColor: '#F0F8FF',
  },
  familyMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  familyMenuIconText: {
    fontSize: 16,
  },
  familyMenuText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 1,
  },
  familyMenuTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
    familyMenuCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  metaSpaceMenuItem: {
    borderWidth: 1,
    borderColor: '#E3F2FD',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  metaSpaceIcon: {
    backgroundColor: '#6366f1',
  },
  metaSpaceText: {
    color: '#6366f1',
    fontWeight: '700',
  },
  familyMenuSeparator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
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
  // 照片预览样式
  eventPhotos: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  eventPhotosContainer: {
    paddingVertical: 4,
  },
  eventPhoto: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventPhotoMore: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventPhotoMoreText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
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
  mealManagementContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  todayRecommendation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '48%', // 两列布局
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  mealEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  mealSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  difficultyStars: {
    fontSize: 14,
    color: '#FFD700', // 金色星星
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%', // 两列布局
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  quickActionEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  collaborationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  collaborationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  collaborationEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  collaborationText: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
  },
  mealGeneratorContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  mealGeneratorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  mealGeneratorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.3,
  },
  mealGeneratorContent: {
    flex: 1,
    padding: 16,
  },
  aiDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  aiSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  generateMealButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateMealButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  generateMealButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContainer: {
    paddingHorizontal: 10,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitleText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionTime: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginRight: 8,
  },
  suggestionDifficulty: {
    fontSize: 13,
    color: '#FFD700', // 金色星星
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  mealRecordsContainer: {
    padding: 16,
  },
  todayMealsSection: {
    marginBottom: 24,
  },
  todayMealsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  mealRecordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  mealRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTimeEmoji: {
    fontSize: 24,
    marginRight: 4,
  },
  mealTimeLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  mealTime: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  mealCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caloriesText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  caloriesUnit: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  mealName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  mealTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  nutritionSummary: {
    marginBottom: 24,
  },
  nutritionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  nutritionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '24%',
    textAlign: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  nutritionProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  addMealButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addMealButtonEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  addMealButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  snackCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  // 照片查看器样式
  photoViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  photoViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  photoViewerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  photoViewerCounter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  photoViewerPlaceholder: {
    width: 40,
    height: 40,
  },
  photoViewerImageContainer: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerImage: {
    width: screenWidth - 40,
    height: '80%',
  },
  photoViewerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 8,
  },
  photoViewerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  photoViewerActiveDot: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  segmentIcon: {
    marginLeft: 4,
  },
     segmentText: {
     fontSize: 16,
     color: '#3C3C43',
     fontWeight: '600',
   },
     segmentTextActive: {
     color: '#1D1D1F',
   },
   segmentTextInactive: {
     color: '#3C3C43',
   },
     segmentActive: {
     backgroundColor: '#FFFFFF',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.12,
     shadowRadius: 2,
     elevation: 2,
   },
   segmentInactive: {
     backgroundColor: 'transparent',
   },
  leftSegment: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rightSegment: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});