import { Database } from './database.types';
import { supabase } from './supabase';

// 类型定义
type Tables = Database['public']['Tables'];
type FamilyNotification = Tables['family_notifications']['Row'];
type NotificationInsert = Tables['family_notifications']['Insert'];
type NotificationPreferences = Tables['notification_preferences']['Row'];
type NotificationPreferencesInsert = Tables['notification_preferences']['Insert'];

// UUID 驗證正則表達式
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 檢查是否為有效的 UUID
const isValidUUID = (id?: string): boolean => {
  return !!(id && UUID_REGEX.test(id));
};

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

  // 驗證 familyId 是否為有效 UUID
  if (!isValidUUID(params.familyId)) {
    throw new Error('無效的家庭ID格式');
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

  // 驗證 familyId 是否為有效 UUID
  if (!isValidUUID(params.familyId)) {
    throw new Error('無效的家庭ID格式');
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
  // 檢查用戶認證
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('用戶未認證:', authError);
    throw new Error('用戶未認證，無法標記通知');
  }

  console.log(`用戶 ${user.id} 嘗試標記通知 ${notificationId} 為已讀`);

  // 首先驗證這個通知是否屬於當前用戶
  const { data: notification, error: fetchError } = await supabase
    .from('family_notifications')
    .select('recipient_id, is_read')
    .eq('id', notificationId)
    .eq('recipient_id', user.id)
    .single();

  if (fetchError) {
    console.error('獲取通知失敗:', fetchError);
    throw new Error(`獲取通知失敗: ${fetchError.message}`);
  }

  if (!notification) {
    throw new Error('通知不存在或您沒有權限修改此通知');
  }

  const { error } = await supabase
    .from('family_notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId);

  if (error) {
    console.error('标记通知已读失败:', error);
    console.error('錯誤詳情:', JSON.stringify(error, null, 2));
    throw new Error(`标记通知已读失败: ${error.message}`);
  }

  console.log(`通知 ${notificationId} 已成功標記為已讀`);
}

// 标记通知为未读
export async function markNotificationAsUnread(notificationId: string): Promise<void> {
  // 檢查用戶認證
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('用戶未認證:', authError);
    throw new Error('用戶未認證，無法標記通知');
  }

  console.log(`用戶 ${user.id} 嘗試標記通知 ${notificationId} 為未讀`);

  // 首先驗證這個通知是否屬於當前用戶
  const { data: notification, error: fetchError } = await supabase
    .from('family_notifications')
    .select('recipient_id, is_read')
    .eq('id', notificationId)
    .eq('recipient_id', user.id)
    .single();

  if (fetchError) {
    console.error('獲取通知失敗:', fetchError);
    throw new Error(`獲取通知失敗: ${fetchError.message}`);
  }

  if (!notification) {
    throw new Error('通知不存在或您沒有權限修改此通知');
  }

  const { error } = await supabase
    .from('family_notifications')
    .update({ 
      is_read: false,
      read_at: null
    })
    .eq('id', notificationId);

  if (error) {
    console.error('标记通知未读失败:', error);
    console.error('錯誤詳情:', JSON.stringify(error, null, 2));
    throw new Error(`标记通知未读失败: ${error.message}`);
  }

  console.log(`通知 ${notificationId} 已成功標記為未讀`);
}

// 批量标记通知为已读
export async function markAllNotificationsAsRead(familyId?: string): Promise<void> {
  // 如果 familyId 無效，直接返回
  if (familyId && !isValidUUID(familyId)) {
    return;
  }

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
  // 如果 familyId 無效，返回 0
  if (familyId && !isValidUUID(familyId)) {
    return 0;
  }

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

  // 如果 familyId 無效，返回 null
  if (familyId && !isValidUUID(familyId)) {
    return null;
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

  // 如果 familyId 無效，拋出錯誤
  if (familyId && !isValidUUID(familyId)) {
    throw new Error('無效的家庭ID格式');
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
    const { data: preferencesArray, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('push_enabled, push_token, quiet_hours_enabled, quiet_hours_start, quiet_hours_end')
      .eq('user_id', notification.recipient_id)
      .eq('family_id', notification.family_id)
      .limit(1);

    const preferences = preferencesArray?.[0] || null;

    if (preferencesError) {
      console.log(`獲取用戶 ${notification.recipient_id} 通知偏好時發生錯誤:`, preferencesError.message);
      return;
    }

    if (!preferences) {
      // 用戶沒有通知偏好設置，需要在客戶端創建
      return;
    }

    if (!preferences.push_enabled) {
      console.log(`用戶 ${notification.recipient_id} 未啟用推送通知`);
      return;
    }

    if (!preferences.push_token) {
      console.log(`用戶 ${notification.recipient_id} 沒有推送token，可能需要在應用中授權推送通知`);
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

    console.log(`準備發送推送通知給用戶 ${notification.recipient_id}，標題: ${notification.title}`);

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
        familyId: notification.family_id,
      },
    };

    // 添加超时控制，避免長時間等待
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 增加到15秒

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
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.errors && result.errors.length > 0) {
      console.error('推送通知发送失败:', result.errors);
      // 更新通知状态為失敗
      await supabase
        .from('family_notifications')
        .update({
          push_notification_sent: false,
          sent_at: new Date().toISOString(),
          metadata: Object.assign(
            notification.metadata || {}, 
            { push_error: result.errors[0]?.message || '推送失敗' }
          )
        })
        .eq('id', notification.id);
    } else if (result.data) {
      console.log(`推送通知发送成功！通知ID: ${notification.id}, Expo推送ID: ${result.data.id}`);
      
      // 更新通知状态為成功
      await supabase
        .from('family_notifications')
        .update({
          push_notification_sent: true,
          push_notification_id: result.data.id,
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);
    } else {
      console.warn('推送通知响应格式异常:', result);
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
  onUpdate: (notification: NotificationWithSender) => void,
  onDelete: (notificationId: string) => void
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('用户未登录');
  }

  // 如果 familyId 無效，拋出錯誤
  if (!isValidUUID(familyId)) {
    throw new Error('無效的家庭ID格式');
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
        event: 'UPDATE',
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

        onUpdate(notificationWithSender);
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

  // 驗證 familyId 是否為有效 UUID
  if (!isValidUUID(familyId)) {
    console.log('無效的家庭ID，跳過通知發送');
    return;
  }

  try {
    // 獲取家庭中的所有成員，而不是只依賴參與者列表
    const { data: familyMembers, error: memberError } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('family_id', familyId);

    if (memberError) {
      console.error('獲取家庭成員失敗:', memberError);
      return;
    }

    if (!familyMembers || familyMembers.length === 0) {
      console.log('家庭中沒有成員，跳過通知發送');
      return;
    }

    // 排除創建者本人，發送給其他所有家庭成員
    const recipients = familyMembers
      .map(member => member.user_id)
      .filter(id => id !== user.user.id);
    
    if (recipients.length === 0) {
      // 除了創建者外沒有其他家庭成員，跳過通知發送
      return;
    }

    await createBatchFamilyNotifications({
      familyId,
      type: 'event_created',
      title: '📅 新日程通知',
      message: `${creatorName} 新建了日程「${eventTitle}」，点击查看详情`,
      relatedId: eventId,
      relatedType: 'event',
      metadata: { eventTitle, creatorName, action: 'created' }
    }, recipients);

    // 已向家庭成員發送事件創建通知
  } catch (error) {
    console.error('發送事件創建通知時出錯:', error);
    // 不拋出錯誤，避免影響事件創建的主要流程
  }
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

  // 驗證 familyId 是否為有效 UUID
  if (!isValidUUID(familyId)) {
    console.log('無效的家庭ID，跳過通知發送');
    return;
  }

  try {
    // 獲取家庭中的所有成員，而不是只依賴參與者列表
    const { data: familyMembers, error: memberError } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('family_id', familyId);

    if (memberError) {
      console.error('獲取家庭成員失敗:', memberError);
      return;
    }

    if (!familyMembers || familyMembers.length === 0) {
      console.log('家庭中沒有成員，跳過通知發送');
      return;
    }

    // 排除更新者本人，發送給其他所有家庭成員
    const recipients = familyMembers
      .map(member => member.user_id)
      .filter(id => id !== user.user.id);
    
    if (recipients.length === 0) {
      console.log('除了更新者外沒有其他家庭成員，跳過通知發送');
      return;
    }

    await createBatchFamilyNotifications({
      familyId,
      type: 'event_updated',
      title: '✏️ 日程更新通知',
      message: `${updaterName} 修改了日程「${eventTitle}」，点击查看最新内容`,
      relatedId: eventId,
      relatedType: 'event',
      metadata: { eventTitle, updaterName, action: 'updated' }
    }, recipients);

    // 已向家庭成員發送事件更新通知
  } catch (error) {
    console.error('發送事件更新通知時出錯:', error);
    // 不拋出錯誤，避免影響事件更新的主要流程
  }
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

  // 驗證 familyId 是否為有效 UUID
  if (!isValidUUID(familyId)) {
    console.log('無效的家庭ID，跳過通知發送');
    return;
  }

  try {
    // 獲取家庭中的所有成員，而不是只依賴參與者列表
    const { data: familyMembers, error: memberError } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('family_id', familyId);

    if (memberError) {
      console.error('獲取家庭成員失敗:', memberError);
      return;
    }

    if (!familyMembers || familyMembers.length === 0) {
      console.log('家庭中沒有成員，跳過通知發送');
      return;
    }

    // 排除刪除者本人，發送給其他所有家庭成員
    const recipients = familyMembers
      .map(member => member.user_id)
      .filter(id => id !== user.user.id);
    
    if (recipients.length === 0) {
      console.log('除了刪除者外沒有其他家庭成員，跳過通知發送');
      return;
    }

    await createBatchFamilyNotifications({
      familyId,
      type: 'event_deleted',
      title: '🗑️ 日程删除通知',
      message: `${deleterName} 删除了日程「${eventTitle}」`,
      relatedType: 'event',
      metadata: { eventTitle, deleterName, action: 'deleted' }
    }, recipients);

    console.log(`已向 ${recipients.length} 個家庭成員發送事件刪除通知`);
  } catch (error) {
    console.error('發送事件刪除通知時出錯:', error);
    // 不拋出錯誤，避免影響事件刪除的主要流程
  }
} 