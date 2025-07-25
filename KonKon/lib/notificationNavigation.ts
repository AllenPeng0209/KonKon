import { router } from 'expo-router';
import { NotificationWithSender } from './notificationService';

/**
 * 處理通知點擊後的導航邏輯
 */
export function handleNotificationNavigation(notification: NotificationWithSender) {
  console.log(`[導航] 處理通知導航 - 類型: ${notification.type}, 相關ID: ${notification.related_id}, 相關類型: ${notification.related_type}`);

  switch (notification.type) {
    case 'event_created':
    case 'event_updated':
    case 'event_deleted':
    case 'event_reminder':
      handleEventNotification(notification);
      break;
    
    case 'family_invite':
      handleFamilyInviteNotification(notification);
      break;
    
    case 'system':
      handleSystemNotification(notification);
      break;
    
    default:
      console.log(`[導航] 未知通知類型: ${notification.type}，導航到首頁`);
      router.push('/(tabs)');
      break;
  }
}

/**
 * 處理事件相關通知的導航
 */
function handleEventNotification(notification: NotificationWithSender) {
  const eventId = notification.related_id;
  
  if (!eventId) {
    console.log('[導航] 事件通知缺少事件ID，導航到日曆首頁');
    router.push('/(tabs)');
    return;
  }

  // 對於已刪除的事件，只導航到日曆頁面
  if (notification.type === 'event_deleted') {
    console.log('[導航] 事件已刪除，導航到日曆首頁');
    router.push('/(tabs)');
    return;
  }

  // 導航到日曆並嘗試定位到特定事件
  // 注意：這裡我們需要將事件ID作為參數傳遞
  console.log(`[導航] 導航到事件: ${eventId}`);
  
  // 如果有特定的事件詳情頁面，可以這樣導航：
  // router.push(`/event/${eventId}`);
  
  // 或者導航到日曆並通過 query 參數傳遞事件ID
  router.push({
    pathname: '/(tabs)',
    params: { eventId, from: 'notification' }
  });
}

/**
 * 處理家庭邀請通知的導航
 */
function handleFamilyInviteNotification(notification: NotificationWithSender) {
  const familyId = notification.related_id;
  
  if (!familyId) {
    console.log('[導航] 家庭邀請通知缺少家庭ID，導航到家庭管理');
    router.push('/family-management');
    return;
  }

  console.log(`[導航] 導航到家庭邀請: ${familyId}`);
  router.push('/family-management');
}

/**
 * 處理系統通知的導航
 */
function handleSystemNotification(notification: NotificationWithSender) {
  // 根據通知內容或metadata決定導航目標
  const metadata = notification.metadata as any;
  
  if (metadata?.redirectTo) {
    console.log(`[導航] 系統通知指定導航到: ${metadata.redirectTo}`);
    router.push(metadata.redirectTo);
  } else {
    console.log('[導航] 系統通知無特定導航，導航到設置頁面');
    router.push('/settings');
  }
}

/**
 * 獲取通知的顯示用事件標題
 */
export function getNotificationEventTitle(notification: NotificationWithSender): string | null {
  const metadata = notification.metadata as any;
  return metadata?.eventTitle || null;
}

/**
 * 獲取通知的操作者名稱
 */
export function getNotificationActorName(notification: NotificationWithSender): string | null {
  const metadata = notification.metadata as any;
  return metadata?.creatorName || metadata?.updaterName || notification.sender?.display_name || null;
} 