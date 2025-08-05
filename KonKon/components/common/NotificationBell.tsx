import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useNotifications } from '../../hooks/useNotifications';
import { t } from '../../lib/i18n';
import { handleNotificationNavigation } from '../../lib/notificationNavigation';
import { NotificationWithSender } from '../../lib/notificationService';
import { supabase } from '../../lib/supabase';
import EventPreviewModal from '../event/EventPreviewModal';
import NotificationList from './NotificationList';

interface NotificationBellProps {
  colorScheme: 'light' | 'dark' | null | undefined;
}

export default function NotificationBell({ colorScheme }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    refresh,
    loadMoreNotifications
  } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showEventPreview, setShowEventPreview] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const styles = getStyles(colorScheme);

  const handlePress = () => {
    setShowNotifications(true);
  };

  // 獲取事件數據
  const fetchEventData = async (eventId: string) => {
    console.log('[通知鈴鐺] 開始獲取事件數據，ID:', eventId);
    setLoadingEvent(true);
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select(`
          *,
          creator:users(id, display_name, avatar_url)
        `)
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('[通知鈴鐺] 獲取事件數據失敗 - 數據庫錯誤:', error);
        return null;
      }

      console.log('[通知鈴鐺] 獲取事件數據成功:', event?.title || '無標題');
      return event;
    } catch (error) {
      console.error('[通知鈴鐺] 獲取事件數據失敗 - 異常:', error);
      return null;
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleNotificationPress = async (notification: NotificationWithSender) => {
    console.log('[通知鈴鐺] 處理通知點擊:', notification.title);
    console.log('[通知鈴鐺] 通知類型:', notification.type);
    console.log('[通知鈴鐺] 相關ID:', notification.related_id);
    console.log('[通知鈴鐺] 相關類型:', notification.related_type);
    
    // 檢查是否為事件相關通知
    const isEventNotification = (
      notification.type === 'event_created' || 
      notification.type === 'event_updated' || 
      notification.type === 'event_reminder'
    );
    
    console.log('[通知鈴鐺] 是否為事件通知:', isEventNotification);
    console.log('[通知鈴鐺] 是否有相關ID:', !!notification.related_id);
    
    if (isEventNotification && notification.related_id) {
      console.log('[通知鈴鐺] 開始獲取事件數據，事件ID:', notification.related_id);
      
      // 獲取事件數據並顯示預覽模態框
      const eventData = await fetchEventData(notification.related_id);
      console.log('[通知鈴鐺] 獲取事件數據結果:', eventData ? '成功' : '失敗');
      
      if (eventData) {
        console.log('[通知鈴鐺] 設置事件數據並顯示預覽');
        setSelectedEvent(eventData);
        // 先隱藏通知列表，然後顯示事件預覽
        setShowNotifications(false);
        setShowEventPreview(true);
        console.log('[通知鈴鐺] 事件預覽模態框狀態已設置為 true');
      } else {
        console.log('[通知鈴鐺] 事件數據獲取失敗，使用原導航邏輯');
        // 如果獲取事件失敗，關閉通知列表並使用原來的導航邏輯
        setShowNotifications(false);
        try {
          handleNotificationNavigation(notification);
        } catch (error) {
          console.error('[通知鈴鐺] 導航失敗:', error);
        }
      }
    } else {
      console.log('[通知鈴鐺] 非事件通知，使用原導航邏輯');
      // 非事件通知，關閉模態框並使用原來的導航邏輯
      setShowNotifications(false);
      try {
        handleNotificationNavigation(notification);
      } catch (error) {
        console.error('[通知鈴鐺] 導航失敗:', error);
      }
    }
  };

  const handleEditEvent = () => {
    // 關閉事件預覽，然後導航到事件編輯頁面（不重新顯示通知列表）
    setShowEventPreview(false);
    // 這裡可以添加導航到編輯頁面的邏輯
    console.log('[通知鈴鐺] 準備編輯事件，關閉所有模態框');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.bellContainer}
        onPress={handlePress}
      >
        <Ionicons 
          name="notifications-outline" 
          size={24} 
          color={styles.bellIcon.color} 
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
          </View>
        )}
      </TouchableOpacity>

      {/* 通知列表模態框 */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('notifications.title')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowNotifications(false)}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            unreadCount={unreadCount}
            onRefresh={refresh}
            onLoadMore={loadMoreNotifications}
            onMarkAsRead={markAsRead}
            onMarkAsUnread={markAsUnread}
            onMarkAllAsRead={markAllAsRead}
            onNotificationPress={handleNotificationPress}
          />
        </SafeAreaView>
      </Modal>

      {/* 事件預覽模態框 */}
      {console.log('[通知鈴鐺] 渲染 EventPreviewModal, visible:', showEventPreview, 'event:', !!selectedEvent)}
      <EventPreviewModal
        visible={showEventPreview}
        onClose={() => {
          console.log('[通知鈴鐺] 關閉事件預覽模態框');
          setShowEventPreview(false);
          // 關閉事件預覽時重新顯示通知列表
          setShowNotifications(true);
        }}
        onEdit={handleEditEvent}
        event={selectedEvent}
      />
    </>
  );
}

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  return StyleSheet.create({
    bellContainer: {
      position: 'relative',
      padding: 8,
    },
    bellIcon: {
      color: colors.icon,
    },
    badge: {
      position: 'absolute',
      top: 6,
      right: 6,
    },
    badgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF3B30',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? '#2c2c2e' : '#e0e0e0',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
  });
}; 