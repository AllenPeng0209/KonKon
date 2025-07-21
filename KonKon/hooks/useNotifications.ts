import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import {
  NotificationWithSender,
  getNotificationPreferences,
  getUnreadNotificationCount,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
  updateNotificationPreferences
} from '../lib/notificationService';
import { registerForPushNotificationsAsync } from '../lib/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const { activeFamily } = useFamily();
  
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [notificationPreferences, setNotificationPreferences] = useState<any>(null);

  // 加载通知列表
  const loadNotifications = useCallback(async (refresh = false) => {
    if (!user || !activeFamily) return;

    try {
      if (refresh) {
        setIsLoading(true);
        setNotifications([]);
      }

      const newNotifications = await getUserNotifications(user.id, 20, 0, false);
      
      if (refresh) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
          return [...uniqueNew, ...prev];
        });
      }
      
      setHasMore(newNotifications.length === 20);
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeFamily]);

  // 加载更多通知
  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore || isLoadingMore || !user || !activeFamily) return;

    try {
      setIsLoadingMore(true);
      const moreNotifications = await getUserNotifications(user.id, 20, notifications.length, false);
      
      if (moreNotifications.length > 0) {
        setNotifications(prev => [...prev, ...moreNotifications]);
      }
      
      setHasMore(moreNotifications.length === 20);
    } catch (error) {
      console.error('加载更多通知失败:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, notifications.length, user, activeFamily]);

  // 加载未读通知数量
  const loadUnreadCount = useCallback(async () => {
    if (!user || !activeFamily) return;

    try {
      const count = await getUnreadNotificationCount(activeFamily.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
    }
  }, [user, activeFamily]);

  // 标记通知为已读
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记通知已读失败:', error);
    }
  }, []);

  // 标记所有通知为已读
  const markAllAsRead = useCallback(async () => {
    if (!activeFamily) return;

    try {
      await markAllNotificationsAsRead(activeFamily.id);
      
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('标记所有通知已读失败:', error);
    }
  }, [activeFamily]);

  // 加载通知偏好设置
  const loadPreferences = useCallback(async () => {
    if (!user || !activeFamily) return;

    try {
      const preferences = await getNotificationPreferences(activeFamily.id);
      setNotificationPreferences(preferences);
    } catch (error) {
      console.error('获取通知偏好失败:', error);
    }
  }, [user, activeFamily]);

  // 更新通知偏好设置
  const updatePreferences = useCallback(async (newPreferences: any) => {
    if (!activeFamily) return;

    try {
      const updated = await updateNotificationPreferences(newPreferences, activeFamily.id);
      setNotificationPreferences(updated);
      
      // 如果启用了推送通知，注册推送token
      if (newPreferences.push_enabled) {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken && pushToken !== notificationPreferences?.push_token) {
          await updateNotificationPreferences({ 
            ...newPreferences, 
            push_token: pushToken 
          }, activeFamily.id);
        }
      }
    } catch (error) {
      console.error('更新通知偏好失败:', error);
      throw error;
    }
  }, [activeFamily, notificationPreferences]);

  // 初始化
  useEffect(() => {
    if (activeFamily) {
      loadNotifications(true);
      loadUnreadCount();
      loadPreferences();
    }
  }, [activeFamily]);

  // 实时订阅通知
  useEffect(() => {
    if (!activeFamily) return;

    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = await subscribeToNotifications(
          activeFamily.id,
          (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          },
          (deletedNotificationId) => {
            setNotifications(prev => 
              prev.filter(notification => notification.id !== deletedNotificationId)
            );
          }
        );
      } catch (error) {
        console.error('设置通知订阅失败:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [activeFamily]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    notificationPreferences,
    loadNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    refresh: () => loadNotifications(true),
  };
} 