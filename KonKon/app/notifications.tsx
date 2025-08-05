import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationList from '../components/common/NotificationList';
import EventPreviewModal from '../components/event/EventPreviewModal';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useNotifications } from '../hooks/useNotifications';
import { t } from '../lib/i18n';
import { handleNotificationNavigation } from '../lib/notificationNavigation';
import { NotificationWithSender } from '../lib/notificationService';
import { supabase } from '../lib/supabase';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { activeFamily } = useFamily();
  const [showEventPreview, setShowEventPreview] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);

  // 如果用户未登录，显示登录提示
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.message}>{t('notifications.loginRequired')}</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>{t('notifications.goToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
    loadMoreNotifications,
  } = useNotifications();

  // 獲取事件數據
  const fetchEventData = async (eventId: string) => {
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
        console.error('獲取事件數據失敗:', error);
        return null;
      }

      return event;
    } catch (error) {
      console.error('獲取事件數據失敗:', error);
      return null;
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleNotificationPress = async (notification: NotificationWithSender) => {
    console.log('[通知頁面] 處理通知點擊:', notification.title);
    
    // 檢查是否為事件相關通知
    if (
      (notification.type === 'event_created' || 
       notification.type === 'event_updated' || 
       notification.type === 'event_reminder') &&
      notification.related_id
    ) {
      // 獲取事件數據並顯示預覽模態框
      const eventData = await fetchEventData(notification.related_id);
      if (eventData) {
        setSelectedEvent(eventData);
        setShowEventPreview(true);
      } else {
        // 如果獲取事件失敗，回退到原來的導航邏輯
        try {
          handleNotificationNavigation(notification);
        } catch (error) {
          console.error('[通知頁面] 導航失敗:', error);
          router.push('/(tabs)');
        }
      }
    } else {
      // 非事件通知，使用原來的導航邏輯
      try {
        handleNotificationNavigation(notification);
      } catch (error) {
        console.error('[通知頁面] 導航失敗:', error);
        router.push('/(tabs)');
      }
    }
  };

  const handleSettingsPress = () => {
    router.push('/notification-settings');
  };

  const handleEditEvent = () => {
    // 關閉預覽模態框，然後導航到事件編輯頁面
    setShowEventPreview(false);
    if (selectedEvent) {
      // 這裡可以導航到編輯頁面或打開編輯模態框
      // 暫時先導航到日曆頁面
      router.push('/(tabs)');
    }
  };

  if (!user || !activeFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#C7C7CD" />
          <Text style={styles.emptyText}>{t('notifications.familyRequired')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
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
      
      <EventPreviewModal
        visible={showEventPreview}
        onClose={() => setShowEventPreview(false)}
        onEdit={handleEditEvent}
        event={selectedEvent}
      />
    </SafeAreaView>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#000',
  },
}); 