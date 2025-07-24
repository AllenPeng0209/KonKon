import { Database } from './database.types';
import { supabase } from './supabase';

// 类型定义
type Tables = Database['public']['Tables'];
type FamilyNotification = Tables['family_notifications']['Row'];
type NotificationInsert = Tables['family_notifications']['Insert'];
type NotificationPreferences = Tables['notification_preferences']['Row'];
type NotificationPreferencesInsert = Tables['notification_preferences']['Insert'];

export interface CreateNotificationParams {
  familyId: string;
  recipientId: string;
  type: 'event_created' | 'event_updated' | 'event_deleted' | 'event_reminder' | 'family_invite' | 'system';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'event' | 'family' | 'user' | 'system';
  metadata?: Record<string, any>;
}

export interface NotificationWithSender extends FamilyNotification {
  sender?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    email?: string;
  };
}

// 创建通知
export async function createFamilyNotification(params: CreateNotificationParams): Promise<FamilyNotification> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('用户未登录');
  }

  const notificationData: NotificationInsert = {
    family_id: params.familyId,
    sender_id: user.user.id,
    recipient_id: params.recipientId,
    type: params.type,
    title: params.title,
    message: params.message,
    related_id: params.relatedId,
    related_type: params.relatedType,
    metadata: params.metadata || {},
  };

  const { data, error } = await supabase
    .from('family_notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) {
    console.error('创建通知失败:', error);
    throw new Error(`创建通知失败: ${error.message}`);
  }

  // 异步发送推送通知
  sendPushNotification(data).catch(err => 
    console.warn('发送推送通知失败:', err)
  );

  return data;
}

// 批量创建通知（发送给多个家庭成员）
export async function createBatchFamilyNotifications(
  params: Omit<CreateNotificationParams, 'recipientId'>,
  recipientIds: string[]
): Promise<FamilyNotification[]> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('用户未登录');
  }

  const notifications: NotificationInsert[] = recipientIds.map(recipientId => ({
    family_id: params.familyId,
    sender_id: user.user!.id,
    recipient_id: recipientId,
    type: params.type,
    title: params.title,
    message: params.message,
    related_id: params.relatedId,
    related_type: params.relatedType,
    metadata: params.metadata || {},
  }));

  const { data, error } = await supabase
    .from('family_notifications')
    .insert(notifications)
    .select();

  if (error) {
    console.error('批量创建通知失败:', error);
    throw new Error(`批量创建通知失败: ${error.message}`);
  }

  // 异步发送推送通知
  data.forEach(notification => {
    sendPushNotification(notification).catch(err => 
      console.warn('发送推送通知失败:', err)
    );
  });

  return data;
}

// 获取用户的通知列表
export async function getUserNotifications(
  userId: string,
  limit = 50,
  offset = 0,
  unreadOnly = false
): Promise<NotificationWithSender[]> {
  if (!userId) {
    throw new Error('用户ID不能为空');
  }

  let query = supabase
    .from('family_notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error('获取通知失败:', error);
    throw new Error(`获取通知失败: ${error.message}`);
  }

  if (!notifications || notifications.length === 0) {
    return [];
  }

  // 获取所有发送者ID
  const senderIds = [...new Set(notifications.map(n => n.sender_id))];
  
  // 批量获取发送者信息
  const { data: senders, error: senderError } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, email')
    .in('id', senderIds);

  if (senderError) {
    console.error('获取发送者信息失败:', senderError);
  }

  // 合并通知和发送者信息
  const sendersMap = new Map(senders?.map(s => [s.id, s]) || []);
  
  return notifications.map(notification => ({
    ...notification,
    sender: sendersMap.get(notification.sender_id)
  })) as NotificationWithSender[];
}

// 标记通知为已读
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('family_notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId);

  if (error) {
    console.error('标记通知已读失败:', error);
    throw new Error(`标记通知已读失败: ${error.message}`);
  }
}

// 批量标记通知为已读
export async function markAllNotificationsAsRead(familyId?: string): Promise<void> {
  let query = supabase
    .from('family_notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('is_read', false);

  if (familyId) {
    query = query.eq('family_id', familyId);
  }

  const { error } = await query;

  if (error) {
    console.error('批量标记通知已读失败:', error);
    throw new Error(`批量标记通知已读失败: ${error.message}`);
  }
}

// 获取未读通知数量
export async function getUnreadNotificationCount(familyId?: string): Promise<number> {
  let query = supabase
    .from('family_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  if (familyId) {
    query = query.eq('family_id', familyId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('获取未读通知数量失败:', error);
    throw new Error(`获取未读通知数量失败: ${error.message}`);
  }

  return count || 0;
}

// 获取用户的通知偏好设置
export async function getNotificationPreferences(
  familyId?: string
): Promise<NotificationPreferences | null> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('用户未登录');
  }

  let query = supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.user.id);

  if (familyId) {
    query = query.eq('family_id', familyId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('获取通知偏好失败:', error);
    throw new Error(`获取通知偏好失败: ${error.message}`);
  }

  return data;
}

// 更新用户的通知偏好设置
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferencesInsert>,
  familyId?: string
): Promise<NotificationPreferences> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('用户未登录');
  }

  const updateData = {
    ...preferences,
    user_id: user.user.id,
    family_id: familyId,
  };

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(updateData)
    .select()
    .single();

  if (error) {
    console.error('更新通知偏好失败:', error);
    throw new Error(`更新通知偏好失败: ${error.message}`);
  }

  return data;
}

// 发送推送通知
async function sendPushNotification(notification: FamilyNotification): Promise<void> {
  try {
    // 获取接收者的推送token和偏好设置
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('push_enabled, push_token, quiet_hours_enabled, quiet_hours_start, quiet_hours_end')
      .eq('user_id', notification.recipient_id)
      .eq('family_id', notification.family_id)
      .single();

    if (preferencesError) {
      console.log('获取通知偏好失败，跳过推送通知:', preferencesError.message);
      return;
    }

    if (!preferences || !preferences.push_enabled || !preferences.push_token) {
      console.log('用户未启用推送通知或无推送token');
      return;
    }

    // 检查是否在静默时间内
    if (preferences.quiet_hours_enabled && preferences.quiet_hours_start && preferences.quiet_hours_end && isInQuietHours(
      preferences.quiet_hours_start, 
      preferences.quiet_hours_end
    )) {
      console.log('当前在静默时间内，跳过推送通知');
      return;
    }

    // 发送推送通知
    const pushMessage = {
      to: preferences.push_token,
      sound: 'default',
      title: notification.title,
      body: notification.message,
      data: {
        notificationId: notification.id,
        type: notification.type,
        relatedId: notification.related_id,
        relatedType: notification.related_type,
      },
    };

    // 添加超时控制，避免長時間等待
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushMessage),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const result = await response.json();
    
    if (result.errors) {
      console.error('推送通知发送失败:', result.errors);
    } else {
      console.log('推送通知发送成功:', result);
      
      // 更新通知状态
      await supabase
        .from('family_notifications')
        .update({
          push_notification_sent: true,
          push_notification_id: result.data?.id,
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);
    }
  } catch (error) {
    // 優雅地處理網絡連接錯誤，不影響主要功能
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('推送通知請求超時，跳過此次推送');
      } else if (error.message?.includes('Could not connect')) {
        console.warn('無法連接到推送服務器，跳過此次推送');
      } else {
        console.error('发送推送通知时发生错误:', error.message);
      }
    } else {
      console.error('发送推送通知时发生未知错误:', error);
    }
    
    // 即使推送失敗，也標記通知已嘗試發送，避免重複嘗試
    try {
      await supabase
        .from('family_notifications')
        .update({
          push_notification_sent: false, // 標記推送失敗
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);
    } catch (updateError) {
      console.error('更新通知狀態失敗:', updateError);
    }
  }
}

// 检查是否在静默时间内
function isInQuietHours(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  
  if (start < end) {
    // 同一天内的时间段
    return currentTime >= start && currentTime <= end;
  } else {
    // 跨天的时间段
    return currentTime >= start || currentTime <= end;
  }
}

// 实时订阅通知
export async function subscribeToNotifications(
  familyId: string,
  onNotification: (notification: NotificationWithSender) => void,
  onDelete: (notificationId: string) => void
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('用户未登录');
  }

  const channel = supabase
    .channel(`notifications:${familyId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'family_notifications',
        filter: `family_id=eq.${familyId}`
      },
      async (payload) => {
        // 只接收发给当前用户的通知
        if (payload.new.recipient_id !== user.id) {
          return;
        }

        // 获取发送者信息
        const { data: senderInfo } = await supabase
          .from('users')
          .select('id, display_name, avatar_url, email')
          .eq('id', payload.new.sender_id)
          .single();

        const notificationWithSender: NotificationWithSender = {
          ...payload.new as FamilyNotification,
          sender: senderInfo ? {
            id: senderInfo.id,
            display_name: senderInfo.display_name || undefined,
            avatar_url: senderInfo.avatar_url || undefined,
            email: senderInfo.email || undefined,
          } : undefined,
        };

        onNotification(notificationWithSender);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'family_notifications',
        filter: `family_id=eq.${familyId}`
      },
      (payload) => {
        if (payload.old.recipient_id !== user.id) {
          return;
        }
        onDelete(payload.old.id);
      }
    )
    .subscribe();

  return channel;
}

// 为事件相关通知创建便捷方法
export async function notifyEventCreated(
  familyId: string,
  eventTitle: string,
  eventId: string,
  attendeeIds: string[],
  creatorName: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('用户未登录');
  }

  // 排除创建者本人
  const recipients = attendeeIds.filter(id => id !== user.user.id);
  
  if (recipients.length === 0) {
    return;
  }

  await createBatchFamilyNotifications({
    familyId,
    type: 'event_created',
    title: '新日程通知',
    message: `${creatorName} 创建了新日程「${eventTitle}」`,
    relatedId: eventId,
    relatedType: 'event',
    metadata: { eventTitle, creatorName }
  }, recipients);
}

export async function notifyEventUpdated(
  familyId: string,
  eventTitle: string,
  eventId: string,
  attendeeIds: string[],
  updaterName: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('用户未登录');
  }

  // 排除更新者本人
  const recipients = attendeeIds.filter(id => id !== user.user.id);
  
  if (recipients.length === 0) {
    return;
  }

  await createBatchFamilyNotifications({
    familyId,
    type: 'event_updated',
    title: '日程更新通知',
    message: `${updaterName} 更新了日程「${eventTitle}」`,
    relatedId: eventId,
    relatedType: 'event',
    metadata: { eventTitle, updaterName }
  }, recipients);
}

export async function notifyEventDeleted(
  familyId: string,
  eventTitle: string,
  attendeeIds: string[],
  deleterName: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('用户未登录');
  }

  // 排除删除者本人
  const recipients = attendeeIds.filter(id => id !== user.user.id);
  
  if (recipients.length === 0) {
    return;
  }

  await createBatchFamilyNotifications({
    familyId,
    type: 'event_deleted',
    title: '日程删除通知',
    message: `${deleterName} 删除了日程「${eventTitle}」`,
    relatedType: 'event',
    metadata: { eventTitle, deleterName }
  }, recipients);
} 