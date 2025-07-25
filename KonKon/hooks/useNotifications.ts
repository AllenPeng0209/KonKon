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
  markNotificationAsUnread,
  subscribeToNotifications,
  updateNotificationPreferences
} from '../lib/notificationService';
import { registerForPushNotificationsAsync } from '../lib/notifications';

// 檢查是否為有效的家庭ID（排除特殊的 meta-space）
const isValidFamilyId = (familyId?: string): boolean => {
  return !!(familyId && familyId !== 'meta-space');
};

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
    if (!user || !activeFamily || !isValidFamilyId(activeFamily.id)) {
      console.log('[通知] 跳過加載 - 用戶未登錄或家庭ID無效');
      if (refresh) {
        setNotifications([]);
        setIsLoading(false);
      }
      return;
    }

    try {
      console.log(`[通知] 開始加載通知 - 用戶: ${user.id}, 家庭: ${activeFamily.id}, 刷新: ${refresh}`);
      
      if (refresh) {
        setIsLoading(true);
        setNotifications([]);
      }

      const newNotifications = await getUserNotifications(user.id, 20, 0, false);
      console.log(`[通知] 獲取到 ${newNotifications.length} 條通知`);
      
      // 打印通知狀態統計
      const readCount = newNotifications.filter(n => n.is_read).length;
      const unreadCountLocal = newNotifications.filter(n => !n.is_read).length;
      console.log(`[通知] 狀態統計 - 已讀: ${readCount}, 未讀: ${unreadCountLocal}`);
      
      if (refresh) {
        // 即使是刷新，也要確保新數據本身沒有重複
        const uniqueNotifications = newNotifications.filter((notification, index, array) => 
          array.findIndex(n => n.id === notification.id) === index
        );
        console.log(`[通知] 設置 ${uniqueNotifications.length} 條去重後的通知`);
        setNotifications(uniqueNotifications);
      } else {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
          console.log(`[通知] 添加 ${uniqueNew.length} 條新通知到現有的 ${prev.length} 條通知`);
          return [...uniqueNew, ...prev];
        });
      }
      
      setHasMore(newNotifications.length === 20);
    } catch (error) {
      console.error('[通知] 加载通知失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeFamily]);

  // 加载更多通知
  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore || isLoadingMore || !user || !activeFamily || !isValidFamilyId(activeFamily.id)) return;

    try {
      setIsLoadingMore(true);
      const moreNotifications = await getUserNotifications(user.id, 20, notifications.length, false);
      
      if (moreNotifications.length > 0) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNew = moreNotifications.filter(n => !existingIds.has(n.id));
          return [...prev, ...uniqueNew];
        });
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
    if (!user || !activeFamily || !isValidFamilyId(activeFamily.id)) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadNotificationCount(activeFamily.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      setUnreadCount(0);
    }
  }, [user, activeFamily]);

  // 标记通知为已读
  const markAsRead = useCallback(async (notificationId: string) => {
    // 先檢查當前狀態
    const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
    console.log(`[通知] 標記為已讀 - ID: ${notificationId}, 之前是未讀: ${!!wasUnread}`);
    
    try {
      // 樂觀更新本地狀態
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      if (wasUnread) {
        setUnreadCount(prev => {
          const newCount = Math.max(0, prev - 1);
          console.log(`[通知] 未讀計數更新: ${prev} -> ${newCount}`);
          return newCount;
        });
      }

      // 然後更新數據庫（實時訂閱會處理同步，但我們不依賴它）
      await markNotificationAsRead(notificationId);
      console.log(`[通知] 數據庫更新成功 - 標記 ${notificationId} 為已讀`);
    } catch (error) {
      console.error('[通知] 标记通知已读失败:', error);
      // 發生錯誤時回滾狀態
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: false, read_at: null }
            : notification
        )
      );
      if (wasUnread) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [notifications]);

  // 标记通知为未读
  const markAsUnread = useCallback(async (notificationId: string) => {
    // 先檢查當前狀態
    const wasRead = notifications.find(n => n.id === notificationId && n.is_read);
    console.log(`[通知] 標記為未讀 - ID: ${notificationId}, 之前是已讀: ${!!wasRead}`);
    
    try {
      // 樂觀更新本地狀態
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: false, read_at: null }
            : notification
        )
      );
      
      if (wasRead) {
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log(`[通知] 未讀計數更新: ${prev} -> ${newCount}`);
          return newCount;
        });
      }

      // 然後更新數據庫
      await markNotificationAsUnread(notificationId);
      console.log(`[通知] 數據庫更新成功 - 標記 ${notificationId} 為未讀`);
    } catch (error) {
      console.error('[通知] 标记通知未读失败:', error);
      // 發生錯誤時回滾狀態
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      if (wasRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  }, [notifications]);

  // 标记所有通知为已读
  const markAllAsRead = useCallback(async () => {
    if (!activeFamily || !isValidFamilyId(activeFamily.id)) return;

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
    if (!user || !activeFamily || !isValidFamilyId(activeFamily.id)) {
      setNotificationPreferences(null);
      return;
    }

    try {
      const preferences = await getNotificationPreferences(activeFamily.id);
      
      // 如果沒有找到通知偏好設置，自動創建默認設置
      if (!preferences) {
        try {
          // 用戶沒有通知偏好設置，創建默認設置
          await updateNotificationPreferences({
            push_enabled: true,
            event_created_enabled: true,
            event_updated_enabled: true,
            event_deleted_enabled: true,
            event_reminder_enabled: true,
            family_invite_enabled: true,
            quiet_hours_enabled: false,
          }, activeFamily.id);
          
          // 重新載入偏好設置
          const newPrefs = await getNotificationPreferences(activeFamily.id);
          setNotificationPreferences(newPrefs);
                      // 默認通知偏好設置創建成功
        } catch (createError) {
          console.error('❌ 創建默認通知偏好失敗:', createError);
          setNotificationPreferences(null);
        }
      } else {
        setNotificationPreferences(preferences);
      }
    } catch (error) {
      console.error('获取通知偏好失败:', error);
      setNotificationPreferences(null);
    }
  }, [user, activeFamily]);

  // 更新通知偏好设置
  const updatePreferences = useCallback(async (newPreferences: any) => {
    if (!activeFamily || !isValidFamilyId(activeFamily.id)) return;

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
    if (activeFamily && isValidFamilyId(activeFamily.id)) {
      loadNotifications(true);
      loadUnreadCount();
      loadPreferences();
    } else {
      // 清空通知相關狀態，當切換到 meta-space 時
      setNotifications([]);
      setUnreadCount(0);
      setNotificationPreferences(null);
      setIsLoading(false);
    }
  }, [activeFamily]);

  // 实时订阅通知
  useEffect(() => {
    if (!activeFamily || !isValidFamilyId(activeFamily.id)) return;

    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = await subscribeToNotifications(
          activeFamily.id,
          (newNotification) => {
            let shouldIncrementCount = false;
            setNotifications(prev => {
              // 檢查通知是否已經存在，避免重複
              const existingIndex = prev.findIndex(n => n.id === newNotification.id);
              if (existingIndex !== -1) {
                // 如果已存在，更新該通知
                const updated = [...prev];
                updated[existingIndex] = newNotification;
                return updated;
              }
              // 如果不存在，添加到開頭
              shouldIncrementCount = true;
              return [newNotification, ...prev];
            });
            // 只有當通知是新添加的時候才增加未讀計數
            if (shouldIncrementCount && !newNotification.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          },
          (updatedNotification) => {
            // 處理通知更新（如標記已讀/未讀）
            setNotifications(prev => {
              const existingIndex = prev.findIndex(n => n.id === updatedNotification.id);
              if (existingIndex !== -1) {
                const updated = [...prev];
                const oldNotification = updated[existingIndex];
                updated[existingIndex] = updatedNotification;
                
                // 更新未讀計數
                if (oldNotification.is_read !== updatedNotification.is_read) {
                  setUnreadCount(prevCount => {
                    if (updatedNotification.is_read) {
                      // 標記為已讀，減少計數
                      return Math.max(0, prevCount - 1);
                    } else {
                      // 標記為未讀，增加計數
                      return prevCount + 1;
                    }
                  });
                }
                
                return updated;
              }
              return prev;
            });
          },
          (deletedNotificationId) => {
            setNotifications(prev => {
              const deletedNotification = prev.find(n => n.id === deletedNotificationId);
              if (deletedNotification && !deletedNotification.is_read) {
                setUnreadCount(prevCount => Math.max(0, prevCount - 1));
              }
              return prev.filter(notification => notification.id !== deletedNotificationId);
            });
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
    markAsUnread,
    markAllAsRead,
    updatePreferences,
    refresh: () => loadNotifications(true),
  };
} 