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
import { handleNotificationNavigation } from '../../lib/notificationNavigation';
import { NotificationWithSender } from '../../lib/notificationService';
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
  const styles = getStyles(colorScheme);

  const handlePress = () => {
    setShowNotifications(true);
  };

  const handleNotificationPress = (notification: NotificationWithSender) => {
    console.log('[通知鈴鐺] 處理通知點擊:', notification.title);
    
    // 先關閉模態框
    setShowNotifications(false);
    
    // 然後進行導航
    try {
      handleNotificationNavigation(notification);
    } catch (error) {
      console.error('[通知鈴鐺] 導航失敗:', error);
    }
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
            <Text style={styles.modalTitle}>通知</Text>
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