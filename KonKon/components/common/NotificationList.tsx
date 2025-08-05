import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getCurrentLocale, t } from '../../lib/i18n';
import { getNotificationEventTitle } from '../../lib/notificationNavigation';
import { NotificationWithSender } from '../../lib/notificationService';

interface NotificationListProps {
  notifications: NotificationWithSender[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  unreadCount: number;
  onRefresh: () => void;
  onLoadMore: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAsUnread: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationPress?: (notification: NotificationWithSender) => void;
}

export default function NotificationList({
  notifications,
  isLoading,
  isLoadingMore,
  hasMore,
  unreadCount,
  onRefresh,
  onLoadMore,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllAsRead,
  onNotificationPress,
}: NotificationListProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;
    
    Alert.alert(
      t('notifications.markAllAsReadConfirm'),
      t('notifications.markAllAsReadMessage', { count: unreadCount }),
      [
        { text: t('notifications.cancel'), style: 'cancel' },
        { text: t('notifications.confirm'), onPress: onMarkAllAsRead },
      ]
    );
  }, [unreadCount, onMarkAllAsRead]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_created':
        return 'calendar-outline';
      case 'event_updated':
        return 'pencil-outline';
      case 'event_deleted':
        return 'trash-outline';
      case 'event_reminder':
        return 'alarm-outline';
      case 'family_invite':
        return 'people-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'event_created':
        return '#34C759';
      case 'event_updated':
        return '#007AFF';
      case 'event_deleted':
        return '#FF3B30';
      case 'event_reminder':
        return '#FF9500';
      case 'family_invite':
        return '#5856D6';
      case 'system':
        return '#8E8E93';
      default:
        return '#007AFF';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return t('notifications.justNow');
    if (minutes < 60) return t('notifications.minutesAgo', { minutes });
    if (hours < 24) return t('notifications.hoursAgo', { hours });
    if (days < 7) return t('notifications.daysAgo', { days });
    
    // 使用當前語言的本地化日期格式
    const locale = getCurrentLocale();
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 動態翻譯舊通知的標題
  const getTranslatedTitle = (notification: NotificationWithSender): string => {
    const { type, title } = notification;
    
    // 如果標題已經是翻譯鍵的結果（不包含中文硬編碼），直接返回
    if (!title.includes('日程通知') && !title.includes('通知')) {
      return title;
    }
    
    // 根據通知類型返回對應的翻譯
    switch (type) {
      case 'event_created':
        return t('notifications.eventCreatedTitle');
      case 'event_updated':
        return t('notifications.eventUpdatedTitle');
      case 'event_deleted':
        return t('notifications.eventDeletedTitle');
      case 'event_reminder':
        return t('notificationSettings.eventReminderTitle');
      case 'family_invite':
        return t('notificationSettings.familyInviteTitle');
      default:
        return title; // 如果無法識別類型，返回原標題
    }
  };

  // 動態翻譯舊通知的消息內容
  const getTranslatedMessage = (notification: NotificationWithSender): string => {
    const { type, message, metadata } = notification;
    
    // 如果消息不包含中文硬編碼，直接返回
    if (!message.includes('新建了日程') && !message.includes('修改了日程') && !message.includes('删除了日程')) {
      return message;
    }
    
    // 安全地檢查 metadata 並提取信息
    const metadataObj = metadata && typeof metadata === 'object' ? metadata : {};
    const creatorName = (metadataObj as any)?.creatorName || 
                       (metadataObj as any)?.updaterName || 
                       (metadataObj as any)?.deleterName || 
                       message.match(/^(\S+)\s/)?.[1] || 'Unknown';
    const eventTitle = (metadataObj as any)?.eventTitle || 
                      message.match(/「([^」]+)」/)?.[1] || 'Unknown Event';
    
    // 根據通知類型返回對應的翻譯
    switch (type) {
      case 'event_created':
        return t('notifications.eventCreatedMessage', { creatorName, eventTitle });
      case 'event_updated':
        return t('notifications.eventUpdatedMessage', { updaterName: creatorName, eventTitle });
      case 'event_deleted':
        return t('notifications.eventDeletedMessage', { deleterName: creatorName, eventTitle });
      default:
        return message; // 如果無法識別類型，返回原消息
    }
  };

  // 將通知分組為已讀和未讀
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  const sections = [];
  
  if (unreadNotifications.length > 0) {
    sections.push({
      title: t('notifications.unreadNotifications'),
      data: unreadNotifications,
      isUnread: true,
    });
  }
  
  if (readNotifications.length > 0) {
    sections.push({
      title: t('notifications.readNotifications'),
      data: readNotifications,
      isUnread: false,
    });
  }

  const renderNotification = ({ item: notification }: { item: NotificationWithSender }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.is_read && styles.unreadNotification,
      ]}
      onPress={() => {
        // 如果是未讀通知，點擊時標記為已讀（但不切換已讀的通知狀態）
        if (!notification.is_read) {
          onMarkAsRead(notification.id);
        }
        // 導航到相應頁面
        onNotificationPress?.(notification);
      }}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationLeft}>
          <View
            style={[
              styles.notificationIcon,
              { backgroundColor: getNotificationColor(notification.type) },
            ]}
          >
            <Ionicons
              name={getNotificationIcon(notification.type) as any}
              size={16}
              color="white"
            />
          </View>
          
          <View style={styles.notificationContent}>
            <View style={styles.notificationTitleRow}>
              <Text style={[
                styles.notificationTitle,
                !notification.is_read && styles.unreadTitle
              ]}>
                {getTranslatedTitle(notification)}
              </Text>
              {!notification.is_read && (
                <View style={styles.unreadDot} />
              )}
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {getTranslatedMessage(notification)}
              {/* 如果是事件通知，顯示事件標題 */}
              {getNotificationEventTitle(notification) && (
                <Text style={styles.eventTitle}>
                  {' '}「{getNotificationEventTitle(notification)}」
                </Text>
              )}
            </Text>
            
            <View style={styles.notificationMeta}>
              <View style={styles.senderInfo}>
                {notification.sender?.avatar_url ? (
                  <Image
                    source={{ uri: notification.sender.avatar_url }}
                    style={styles.senderAvatar}
                  />
                ) : (
                  <View style={styles.senderAvatarPlaceholder}>
                    <Ionicons name="person" size={12} color="#666" />
                  </View>
                )}
                <Text style={styles.senderName}>
                  {notification.sender?.display_name || t('notifications.system')}
                </Text>
              </View>
              
              <Text style={styles.notificationTime}>
                {formatTime(notification.created_at!)}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.markReadButton}
          onPress={(e) => {
            // 阻止事件冒泡，避免觸發父級的 onPress
            e.stopPropagation();
            if (notification.is_read) {
              onMarkAsUnread(notification.id);
            } else {
              onMarkAsRead(notification.id);
            }
          }}
        >
          <Ionicons
            name={notification.is_read ? "checkmark-circle" : "ellipse-outline"}
            size={20}
            color={notification.is_read ? "#34C759" : "#C7C7CD"}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.isUnread && unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllButtonText}>{t('notifications.markAllAsRead')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => {
    // 移除頭部，因為標題現在在外部固定頭部
    return null;
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>{t('notifications.loadingMore')}</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('notifications.loading')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={60} color="#C7C7CD" />
        <Text style={styles.emptyTitle}>{t('notifications.noNotifications')}</Text>
        <Text style={styles.emptyMessage}>{t('notifications.noNotificationsMessage')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        renderItem={renderNotification}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={hasMore ? onLoadMore : undefined}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContent : undefined}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f3f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  markAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationItem: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
  },
  notificationHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  notificationLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
    color: '#000',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  senderAvatarPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  markReadButton: {
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContent: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
      emptyMessage: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      paddingHorizontal: 40,
      lineHeight: 20,
    },
    eventTitle: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '500',
    },
  }); 