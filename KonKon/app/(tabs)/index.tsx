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
import RecurringEventManager from '@/components/event/RecurringEventManager';
import { VoiceToCalendar } from '@/components/event/VoiceToCalendar';
import MealViewSelector from '@/components/meal/MealViewSelector';
import type { MealRecord } from '@/components/meal/MealViewTypes';
import SmartButton from '@/components/ui/SmartButton';

import FamilyHealthDashboard from '@/components/health/FamilyHealthDashboard';
import ShoppingViewSelector, {
  FamilyMember,
  ShoppingBudget,
  ShoppingItem,
  Store,
} from '@/components/shopping/ShoppingViewSelector';
import { useFamily } from '@/contexts/FamilyContext';
import { useFeatureSettings } from '@/contexts/FeatureSettingsContext';
import { useChores } from '@/hooks/useChores';
import { useEvents } from '@/hooks/useEvents';
import { useRecurringEvents } from '@/hooks/useRecurringEvents';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import {
  CalendarEvent,
  ParsedCalendarResult,
  processImageToCalendar,
  processTextToCalendar,
  processVoiceToCalendar
} from '@/lib/bailian_omni_calendar';
import CalendarService from '@/lib/calendarService';
import { t } from '@/lib/i18n';
import type { MealPlan } from '@/lib/mealService';
import mealService from '@/lib/mealService';
import { ParsedAlbumResult } from '@/lib/voiceAlbumService';
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
import { DateData } from 'react-native-calendars';
import { useAuth } from '../../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const { userFamilies } = useFamily();
  const { featureSettings, resetAllSettings } = useFeatureSettings();
  const router = useRouter();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 默认值为 'all'
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  // 已移除：记账相关状态
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

  // 已移除：记账相关状态
  
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
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([
    { id: '1', name: '牛乳', category: 'dairy', quantity: 2, unit: '本', estimatedPrice: 250, priority: 'high', completed: false, addedBy: 'user1', addedDate: new Date() },
    { id: '2', name: '卵', category: 'dairy', quantity: 1, unit: 'パック', estimatedPrice: 220, priority: 'high', completed: false, addedBy: 'user1', addedDate: new Date() },
    { id: '3', name: '食パン', category: 'pantry', quantity: 1, unit: '斤', estimatedPrice: 180, priority: 'medium', completed: true, addedBy: 'user2', addedDate: new Date(), completedDate: new Date(), actualPrice: 175 },
    { id: '4', name: 'キャベツ', category: 'produce', quantity: 1, unit: '玉', estimatedPrice: 150, priority: 'medium', completed: false, addedBy: 'user1', addedDate: new Date() },
    { id: '5', name: '鶏もも肉', category: 'meat', quantity: 300, unit: 'g', estimatedPrice: 400, priority: 'low', completed: false, addedBy: 'user2', addedDate: new Date(), assignedTo: 'user2' },
    { id: '6', name: 'トイレットペーパー', category: 'household', quantity: 1, unit: 'パック', estimatedPrice: 450, priority: 'high', completed: true, addedBy: 'user1', addedDate: new Date(), completedDate: new Date(), actualPrice: 430, assignedTo: 'user1' },
    { id: '7', name: 'シャンプー詰替', category: 'household', quantity: 1, unit: '袋', estimatedPrice: 500, priority: 'low', completed: false, addedBy: 'user1', addedDate: new Date(), },
  ]);

  const [shoppingStores, setShoppingStores] = useState<Store[]>([
    { id: 's1', name: 'ライフ スーパー', location: '近所', categories: ['produce', 'meat', 'dairy', 'pantry', 'frozen', 'snacks', 'household'], currentDeals: [
        { id: 'd1', storeName: 'ライフ スーパー', itemName: '卵', originalPrice: 250, discountPrice: 220, discountPercent: 12, validUntil: new Date(), category: 'dairy' },
        { id: 'd2', storeName: 'ライフ スーパー', itemName: '鶏もも肉', originalPrice: 450, discountPrice: 400, discountPercent: 11, validUntil: new Date(), category: 'meat' }
    ], averagePrices: {}, distance: 0.5, isFrequentlyUsed: true },
    { id: 's2', name: 'セブンイレブン', location: '駅前', categories: ['dairy', 'snacks'], currentDeals: [], averagePrices: {}, distance: 1.2, isFrequentlyUsed: false }
  ]);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
      { id: 'user1', name: 'ママ', avatar: '👩', shoppingPreference: ['produce', 'dairy'], assignedItems: ['6'] },
      { id: 'user2', name: 'パパ', avatar: '👨', shoppingPreference: ['meat', 'snacks'], assignedItems: ['5'] },
  ]);

  const [shoppingBudget, setShoppingBudget] = useState<ShoppingBudget>({
    monthly: 50000,
    weekly: 12000,
    spent: 605,
    remaining: 49395,
    categories: { household: 430, pantry: 175 },
  });

  const handleItemToggle = (itemId: string) => {
    setShoppingItems(items => items.map(item => item.id === itemId ? { ...item, completed: !item.completed, completedDate: !item.completed ? new Date() : undefined } : item));
  };
  const handleItemAdd = (item: Omit<ShoppingItem, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(), ...item };
    setShoppingItems(items => [...items, newItem]);
  };
  const handleItemDelete = (itemId: string) => {
    setShoppingItems(items => items.filter(item => item.id !== itemId));
  };
  const handleAssignMember = (itemId: string, memberId: string) => {
    setShoppingItems(items => items.map(item => item.id === itemId ? { ...item, assignedTo: memberId } : item));
  };

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

  // 动态生成过滤选项，基于启用的功能
  const filterOptions = (() => {
    const options = [
      { label: t('home.all'), value: 'all', icon: '📊', color: '#8E8E93', bgColor: '#F2F2F7' },
    ];

    // 始终保持日历功能
    options.push({ label: t('home.calendar'), value: 'calendar', icon: '🔔', color: '#FF9500', bgColor: '#FFF3E0' });

    // 根据启用的功能添加选项
    if (featureSettings.familyAssistant.enabled) {
      options.push({ label: t('home.assistant'), value: 'familyAssistant', icon: '🐱', color: '#007AFF', bgColor: '#E3F2FD' });
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

  // 生成模擬餐食記錄數據
  const generateMockMealRecords = (): MealRecord[] => {
    const today = new Date();
    const records: MealRecord[] = [];
    
    // 生成過去7天的數據
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // 每天的餐食記錄
      const dayMeals = [
        {
          id: `${dateString}-breakfast`,
          date: dateString,
          mealType: 'breakfast' as const,
          title: ['日式玉子燒定食', '牛奶燕麥粥', '三明治套餐'][Math.floor(Math.random() * 3)],
          calories: 280 + Math.floor(Math.random() * 100),
          tags: ['營養均衡', '快手'],
          time: '08:00',
          emoji: '🌅',
          nutrition: {
            protein: 15 + Math.floor(Math.random() * 10),
            carbs: 35 + Math.floor(Math.random() * 15),
            fat: 8 + Math.floor(Math.random() * 8),
          }
        },
        {
          id: `${dateString}-lunch`,
          date: dateString,
          mealType: 'lunch' as const,
          title: ['親子便當', '簡易炒飯', '健康沙拉'][Math.floor(Math.random() * 3)],
          calories: 450 + Math.floor(Math.random() * 150),
          tags: ['便當友善', '15分鐘'],
          time: '12:30',
          emoji: '☀️',
          nutrition: {
            protein: 25 + Math.floor(Math.random() * 15),
            carbs: 55 + Math.floor(Math.random() * 25),
            fat: 12 + Math.floor(Math.random() * 10),
          }
        },
        {
          id: `${dateString}-dinner`,
          date: dateString,
          mealType: 'dinner' as const,
          title: ['家常炒飯', '蒸蛋湯麵', '番茄義大利麵'][Math.floor(Math.random() * 3)],
          calories: 480 + Math.floor(Math.random() * 120),
          tags: ['剩飯活用', '經濟實惠'],
          time: '18:30',
          emoji: '🌆',
          nutrition: {
            protein: 20 + Math.floor(Math.random() * 15),
            carbs: 60 + Math.floor(Math.random() * 20),
            fat: 15 + Math.floor(Math.random() * 12),
          }
        }
      ];
      
      // 隨機添加點心
      if (Math.random() > 0.3) {
        dayMeals.push({
          id: `${dateString}-snack`,
          date: dateString,
                      mealType: 'breakfast' as const,
          title: ['手作布丁', '水果拼盤', '優格杯'][Math.floor(Math.random() * 3)],
          calories: 120 + Math.floor(Math.random() * 80),
          tags: ['低糖', '健康'],
          time: '15:00',
          emoji: '🍰',
          nutrition: {
            protein: 5 + Math.floor(Math.random() * 8),
            carbs: 15 + Math.floor(Math.random() * 15),
            fat: 3 + Math.floor(Math.random() * 6),
          }
        });
      }
      
      records.push(...dayMeals);
    }
    
    return records;
  };

  useEffect(() => {
    // 初始化模擬餐食數據
    setMealRecords(generateMockMealRecords());
  }, []);

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
                    // handleVoiceToExpense(base64Data); // 移除记账相关功能
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

  // 處理拍照功能 - 直接拍照並添加到相簿
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
      // 直接打開 AddMemoryModal 來添加到相簿
      setInitialMemoryImages(pickerResult.assets);
      setShowAddMemoryModal(true);
    }
  };

  // 處理相簿選取功能 - 從相簿選取照片並添加到家庭相簿
  const handleAlbumPress = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('權限錯誤', '需要相簿權限才能選取照片');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true, // 需要base64用於上傳
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      // 打開 AddMemoryModal 來添加到相簿
      setInitialMemoryImages(pickerResult.assets);
      setShowAddMemoryModal(true);
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

  // 新增：处理语音转记账
  // const handleVoiceToExpense = async (base64Data: string) => { // 移除记账相关功能
  //   setLoadingText(t('home.processingVoice'));
  //   try {
  //     const result = await processVoiceToExpense(base64Data);
  //     handleAIExpenseResult(result);
  //   } catch (error) {
  //     Alert.alert(t('home.error'), t('home.expenseVoiceProcessingFailed'));
  //   } finally {
  //     clearRecording();
  //   }
  // };

  // 处理文字输入转日程的结果（兼容原有逻辑）
  const handleTextResult = async (result: string) => {
    console.log('接收到文本输入:', result);
    setLoadingText(t('home.analyzingText'));
    setIsProcessingText(true); // 使用新的状态

    try {
      // 简单的意图识别
      if (result.match(/记账|消费|收入|花了|赚了|买单|付款/)) {
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
      // handleTextError(); // No longer needed, SmartButton will handle it
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
      const result = await createEvent(eventData);
      
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
            
            if (systemEventId) {
              console.log('系统日历事件创建成功:', systemEventId);
            } else {
              console.warn('系统日历事件创建失败，但应用内事件已创建');
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
    events.forEach(event => {
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

  const navigateToProfile = () => {
    router.push('/profile');
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
          <TouchableOpacity 
            style={styles.avatarButton} 
            onPress={navigateToProfile}
            onLongPress={async () => {
              Alert.alert(
                '重置功能設置',
                '確定要重置所有功能設置到默認狀態嗎？',
                [
                  { text: '取消', style: 'cancel' },
                  { 
                    text: '確定', 
                    style: 'destructive',
                    onPress: async () => {
                      await resetAllSettings();
                      Alert.alert('完成', '所有功能設置已重置');
                    }
                  }
                ]
              );
            }}
          >
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

      {/* 相冊功能需要直接渲染避免嵌套問題 */}
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
                  case '每日記錄': return 'daily_records';
                  case '週間概覽': return 'weekly_overview';
                  case '營養圖表': return 'nutrition_chart';
                  default: return 'daily_records';
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
                color: '#34C759',
                textAlign: 'center',
                marginBottom: 16,
              }}>
                ¥3,800
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
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#34C759' }}>
                    ¥5,800
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>支出</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#FF3B30' }}>
                    ¥2,000
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>交易</Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1D1D1F' }}>
                    3 筆
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
              
              {/* 薪水收入 */}
              <TouchableOpacity style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: '#F8F9FA',
              }} activeOpacity={0.7}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#E8F5E9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Text style={{ fontSize: 22 }}>💰</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: '#1D1D1F', marginBottom: 2 }}>
                    薪水
                  </Text>
                  <Text style={{ fontSize: 13, color: '#8E8E93' }}>
                    今天 · 主要帳戶
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#34C759' }}>
                  +¥5,800
                </Text>
              </TouchableOpacity>

              {/* 午餐支出 */}
              <TouchableOpacity style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: '#F8F9FA',
              }} activeOpacity={0.7}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#FFEBEE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Text style={{ fontSize: 22 }}>🍱</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: '#1D1D1F', marginBottom: 2 }}>
                    午餐
                  </Text>
                  <Text style={{ fontSize: 13, color: '#8E8E93' }}>
                    今天 · 現金
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FF3B30' }}>
                  -¥1,200
                </Text>
              </TouchableOpacity>

              {/* 交通支出 */}
              <TouchableOpacity style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 4,
              }} activeOpacity={0.7}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#FFF3E0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Text style={{ fontSize: 22 }}>🚇</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: '#1D1D1F', marginBottom: 2 }}>
                    地鐵車票
                  </Text>
                  <Text style={{ fontSize: 13, color: '#8E8E93' }}>
                    昨天 · IC卡
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FF3B30' }}>
                  -¥800
                </Text>
              </TouchableOpacity>
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
                creator_id: event.creator_id
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
              onEventPress={handleEditEvent}
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
                const filteredEvents = selectedFilter === 'all'
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
            '🎤 說話創建智能相簿 (如：小孩成長視頻)' : 
            t('home.longPressToTalk')
          )
        }
        onTextInputPress={() => {
          // console.log('Text input pressed')
        }}
        onTextResult={handleTextResult}
        {...(selectedFilter !== 'familyAlbum' ? { onParseResult: handleAIResult } : {})}
        onAlbumParseResult={selectedFilter === 'familyAlbum' ? handleAlbumAIResult : undefined}
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
        userFamilies={userFamilies}
        editingEvent={editingEvent}
      />

      {/* <AddExpenseModal // 移除记账相关功能
        isVisible={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        selectedDate={selectedDate}
      /> */}
      
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
});