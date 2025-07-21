import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useEvents } from '@/hooks/useEvents';
import { useRecurringEvents } from '@/hooks/useRecurringEvents';
import { CalendarEvent, ParsedCalendarResult, processTextToCalendar } from '@/lib/bailian_omni_calendar';
import CalendarService from '@/lib/calendarService';
import { t } from '@/lib/i18n';
import { useState } from 'react';
import { Alert } from 'react-native';

export const useEventManagement = () => {
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // 新增：获取用户和家庭信息
  const { user } = useAuth();
  const { activeFamily } = useFamily();
  
  // 確認彈窗狀態
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<CalendarEvent[]>([]);
  const [pendingUserInput, setPendingUserInput] = useState<string | null>(null);
  const [pendingSummary, setPendingSummary] = useState<string | null>(null);

  // 成功彈窗狀態
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 事件管理相關狀態
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventListModal, setShowEventListModal] = useState(false);
  const [showRecurringEventManager, setShowRecurringEventManager] = useState(false);
  const [selectedParentEventId, setSelectedParentEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);

  const {
    events,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEvents,
  } = useEvents();

  const {
    createRecurringEvent,
  } = useRecurringEvents();

  // 處理文字輸入轉日程
  const handleTextResult = async (result: string) => {
    console.log('接收到文本輸入:', result);
    setLoadingText(t('home.analyzingText'));
    setIsProcessingText(true);

    try {
      console.log('判斷為日程意圖');
      const calendarResult = await processTextToCalendar(result);
      handleAIResult(calendarResult);
    } catch (error) {
      console.error('文本處理失敗:', error);
      Alert.alert(t('home.error'), '文本處理失敗，請重試');
    } finally {
      setIsProcessingText(false);
      setLoadingText('');
    }
  };

  // 處理 AI 結果
  const handleAIResult = (result: ParsedCalendarResult) => {
    console.log('Got AI result:', result);
    if (result.events && result.events.length > 0) {
      setPendingEvent(result.events);
      setPendingUserInput(result.userInput || null);
      setPendingSummary(result.summary);
      setIsConfirmationModalVisible(true);
    } else {
      Alert.alert(t('home.parsingFailed'), t('home.noValidInfo'));
    }
  };

  // 確認創建事件
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

  // 取消創建事件
  const handleCancelCreateEvent = () => {
    setIsConfirmationModalVisible(false);
    setPendingEvent([]);
    setPendingUserInput(null);
    setPendingSummary(null);
  };

  // 創建從 AI 解析出的事件
  const handleCreateAIEvent = async (event: CalendarEvent) => {
    try {
      const eventData = {
        title: event.title,
        description: event.description,
        startTime: new Date(event.startTime),
        endTime: event.endTime ? new Date(event.endTime) : undefined,
        location: event.location,
        // 🚀 新增：默认共享给当前激活的家庭群组
        shareToFamilies: activeFamily?.id ? [activeFamily.id] : undefined,
        // 🚀 新增：默认添加当前用户作为参与者
        attendees: user?.id ? [user.id] : undefined,
      };
      
      const createdId = await createEvent(eventData);

      if (createdId) {
        // 🚀 发送事件创建通知给家庭成员
        if (activeFamily?.id && user?.id) {
          try {
            const currentUserName = user?.user_metadata?.display_name || user?.email || '用户';
            const { notifyEventCreated } = await import('../lib/notificationService');
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

  // 創建多個 AI 事件
  const handleCreateMultipleAIEvents = async (events: CalendarEvent[]) => {
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
          // 🚀 新增：默认共享给当前激活的家庭群组
          shareToFamilies: activeFamily?.id ? [activeFamily.id] : undefined,
          // 🚀 新增：默认添加当前用户作为参与者
          attendees: user?.id ? [user.id] : undefined,
        };
        const createdId = await createEvent(eventData);
        if (createdId) {
          successCount++;
          
          // 🚀 发送事件创建通知给家庭成员
          if (activeFamily?.id && user?.id) {
            try {
              const { notifyEventCreated } = await import('../lib/notificationService');
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

  // 處理事件創建
  const handleCreateEvent = async (eventData: any) => {
    try {
      const result = await createEvent(eventData);
      
      if (result) {
        // 如果有日曆權限，同步到系統日曆
        if (hasCalendarPermission) {
          try {
            const startDate = new Date(eventData.startTime);
            let endDate = eventData.endTime ? new Date(eventData.endTime) : new Date(eventData.startTime);
            
            if (!eventData.endTime) {
              endDate.setTime(startDate.getTime() + 60 * 60 * 1000);
            }
            
            const systemEventId = await CalendarService.createSystemEvent({
              title: eventData.title,
              description: eventData.description,
              startDate,
              endDate,
              location: eventData.location,
              allDay: eventData.type === 'todo' ? false : false,
            });
            
            if (systemEventId) {
              console.log('系統日曆事件創建成功:', systemEventId);
            }
          } catch (calendarError) {
            console.error('系統日曆同步失敗:', calendarError);
          }
        }
        
        Alert.alert(t('home.success'), t('home.eventCreationSuccess'));
        const currentDate = new Date();
        fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
      } else {
        Alert.alert(t('home.error'), t('home.eventCreationFailed'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('home.eventCreationFailed');
      Alert.alert(t('home.error'), errorMessage);
    }
  };

  // 處理事件更新
  const handleUpdateEvent = async (eventId: string, eventData: any) => {
    try {
      const result = await updateEvent(eventId, eventData);
      
      if (result) {
        Alert.alert(t('home.success'), t('home.eventUpdateSuccess'));
        const currentDate = new Date();
        fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
      } else {
        Alert.alert(t('home.error'), t('home.eventUpdateFailed'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('home.eventUpdateFailed');
      Alert.alert(t('home.error'), errorMessage);
    }
  };

  // 處理編輯事件
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

  // 關閉編輯事件
  const handleCloseEditEvent = () => {
    setEditingEvent(null);
    setShowAddEventModal(false);
  };

  return {
    // 狀態
    isProcessingText,
    loadingText,
    isConfirmationModalVisible,
    pendingEvent,
    pendingUserInput,
    pendingSummary,
    showSuccessModal,
    successTitle,
    successMessage,
    showAddEventModal,
    showEventListModal,
    showRecurringEventManager,
    selectedParentEventId,
    editingEvent,
    selectedDate,
    hasCalendarPermission,
    events,

    // 操作函數
    handleTextResult,
    handleAIResult,
    handleConfirmCreateEvent,
    handleCancelCreateEvent,
    handleCreateEvent,
    handleUpdateEvent,
    handleEditEvent,
    handleCloseEditEvent,
    
    // 狀態設置函數
    setSelectedDate,
    setShowAddEventModal,
    setShowEventListModal,
    setShowSuccessModal,
    setHasCalendarPermission,
    setEditingEvent,
  };
}; 