import { Tables, TablesInsert } from './database.types';
import { t } from './i18n';
import { supabase } from './supabase';

// 类型定义
export type FamilyChatMessage = Tables<'family_chat_messages'>;

// 生成家庭專屬的AI助手ID
export function getFamilyAssistantId(familyId: string): string {
  if (familyId === 'meta-space') {
    return 'assistant_meta'; // 元空間使用特殊ID
  }
  return `assistant_${familyId}`;
}

// 檢查是否為AI助手消息
export function isAssistantMessage(userId: string): boolean {
  return userId.startsWith('assistant_');
}

// 獲取AI助手顯示名稱
export function getAssistantDisplayName(): string {
  return '喵萌助手';
}

export interface UIFamilyChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  isLoading?: boolean; // 用於顯示加載狀態
}

export type ConversationRecord = {
  id: string;
  title: string;
  summary: string;
  content: string;
  participants_count: number;
  created_at: string;
};

export interface CreateFamilyChatMessageData {
  family_id: string;
  content: string;
  user_id?: string; // 允許指定user_id，用於AI消息
}

// 发送家庭群聊消息
export async function sendFamilyChatMessage(
  messageData: CreateFamilyChatMessageData,
  userContext?: any
): Promise<FamilyChatMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // 特殊處理元空間：元空間是虛擬概念，無法發送消息
  if (messageData.family_id === 'meta-space') {
    throw new Error(t('space.cannotShareToMetaSpace'));
  }

  if (!user) {
    throw new Error(t('errors.userNotLoggedIn'));
  }

  try {
    // 判斷是否為 AI 助手消息
    const isAI = messageData.user_id && isAssistantMessage(messageData.user_id);
    
    const newMessage: TablesInsert<'family_chat_messages'> = {
      family_id: messageData.family_id,
      user_id: messageData.user_id || user.id, // 如果指定了user_id則使用，否則使用當前用戶ID
      content: messageData.content,
      message_type: isAI ? 'assistant' : 'user'
    };

    const { data, error } = await supabase
      .from('family_chat_messages')
      .insert(newMessage)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('发送消息失败:', error);
    throw new Error(t('errors.sendMessageFailed', { message: error.message }));
  }
}

// 获取家庭群聊历史消息
export async function getFamilyChatHistory(
  family_id: string,
  limit: number = 50,
  before?: string
): Promise<UIFamilyChatMessage[]> {
  // 特殊處理元空間：元空間是虛擬概念，沒有聊天記錄
  if (family_id === 'meta-space') {
    return [];
  }

  try {
    // 1. 先查詢聊天消息（不包含用戶關聯）
    let query = supabase
      .from('family_chat_messages')
      .select(`
        id,
        user_id,
        content,
        created_at
      `)
      .eq('family_id', family_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 如果有分页参数，添加分页条件
    if (before) {
      const { data: beforeData } = await supabase
        .from('family_chat_messages')
        .select('created_at')
        .eq('id', before)
        .single();

      if (beforeData) {
        query = query.lt('created_at', beforeData.created_at);
      }
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    if (!messages || messages.length === 0) {
      return [];
    }

    // 2. 收集所有真實用戶的 ID（過濾掉 AI 助手）
    const realUserIds = messages
      .filter(msg => !isAssistantMessage(msg.user_id))
      .map(msg => msg.user_id);

    // 3. 批量查詢真實用戶信息
    let usersData: { [key: string]: { display_name: string; avatar_url: string | null } } = {};
    
    if (realUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .in('id', realUserIds);

      if (users) {
        usersData = users.reduce((acc, user) => {
          acc[user.id] = {
            display_name: user.display_name,
            avatar_url: user.avatar_url
          };
          return acc;
        }, {} as { [key: string]: { display_name: string; avatar_url: string | null } });
      }
    }

    // 4. 转换为 UI 消息格式并按时间正序排列
    return messages.reverse().map((msg: any) => {
      const isAI = isAssistantMessage(msg.user_id);
      const userInfo = isAI ? null : usersData[msg.user_id];

      return {
        id: msg.id,
        type: isAI ? 'assistant' as const : 'user' as const,
        content: msg.content,
        timestamp: msg.created_at,
        user_id: msg.user_id,
        user_name: isAI 
          ? getAssistantDisplayName() 
          : (userInfo?.display_name || t('common.unknownUser')),
        user_avatar_url: isAI ? undefined : userInfo?.avatar_url || undefined,
      };
    });

  } catch (error: any) {
    console.error('获取聊天历史失败:', error);
    throw new Error(t('errors.getChatHistoryFailed', { message: error.message }));
  }
}

// 保存当前聊天会话到conversations表（用于AI分析和记录）
export async function saveFamilyChatSession(
  family_id: string,
  messages: UIFamilyChatMessage[],
  title?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error(t('errors.userNotLoggedIn'));

  // 创建对话记录
  const conversationData = {
    title: title || `${new Date().toLocaleDateString()} 聊天记录`,
    summary: `与${messages.length}条消息的聊天会话`,
    content: JSON.stringify(messages),
    participants_count: new Set(messages.map(m => m.user_id)).size,
    created_by: user.id,
  };

  try {
    // 1. 创建 conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (conversationError) throw conversationError;

    // 2. 分享给家庭
    const { error: shareError } = await supabase
      .from('conversation_shares')
      .insert({
        conversation_id: conversation.id,
        family_id: family_id,
        shared_by: user.id
      });

    if (shareError) throw shareError;

    console.log('聊天会话已保存到对话记录');
  } catch (error) {
    console.error('保存聊天会话失败:', error);
    // 不抛出错误，保存失败不应该影响正常聊天
  }
}

// 获取家庭的所有对话记录
export async function getFamilyConversations(family_id: string): Promise<ConversationRecord[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_shares')
      .select('conversation_id, conversations(*)')
      .eq('family_id', family_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || [])
      .filter(item => item.conversations)
      .map(item => {
        const conv = item.conversations as any;
        return {
          id: conv.id,
          title: conv.title || 'Untitled Conversation',
          summary: conv.summary || 'No summary',
          content: conv.content || '{}',
          participants_count: conv.participants_count || 0,
          created_at: conv.created_at
        } as ConversationRecord;
      });

  } catch (error) {
    console.error('获取家庭对话记录失败:', error);
    throw new Error(t('errors.getConversationsFailed'));
  }
}

// 删除消息
export async function deleteFamilyChatMessage(messageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('family_chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  } catch (error: any) {
    console.error('删除消息失败:', error);
    throw new Error(t('errors.deleteMessageFailed', { message: error.message }));
  }
}

// 清空家庭聊天记录（管理员功能）
export async function clearFamilyChatHistory(family_id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('family_chat_messages')
      .delete()
      .eq('family_id', family_id);

    if (error) throw error;
  } catch (error: any) {
    console.error('清空聊天记录失败:', error);
    throw new Error(t('errors.clearChatFailed', { message: error.message }));
  }
}

// 实时订阅家庭聊天消息
export function subscribeToFamilyChat(
  family_id: string,
  onMessage: (message: UIFamilyChatMessage) => void
) {
  // 特殊處理元空間：元空間是虛擬概念，無需實時訂閱
  if (family_id === 'meta-space') {
    // 返回一個虛擬的 channel，提供 unsubscribe 方法但不執行任何操作
    return {
      unsubscribe: () => console.log('[FamilyChat] 元空間不需要取消訂閱')
    };
  }

  console.log('[FamilyChat] 開始訂閱家庭聊天:', family_id);

  const channel = supabase
    .channel(`family_chat:${family_id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'family_chat_messages',
        filter: `family_id=eq.${family_id}`,
      },
      async (payload) => {
        try {
          console.log('[FamilyChat] 收到新消息:', payload.new);
          
          const userId = (payload.new as any).user_id;
          let userInfo = null;
          
          // 特殊處理AI助手，不需要查詢數據庫
          if (!isAssistantMessage(userId)) {
            const { data, error: userError } = await supabase
              .from('users')
              .select('display_name, avatar_url')
              .eq('id', userId)
              .single();

            if (userError) {
              console.warn('[FamilyChat] 獲取用戶信息失敗:', userError);
            } else {
              userInfo = data;
            }
          }

          const message: UIFamilyChatMessage = {
            id: (payload.new as any).id,
            type: isAssistantMessage(userId) ? 'assistant' : 'user',
            content: (payload.new as any).content,
            timestamp: (payload.new as any).created_at,
            user_id: userId,
            user_name: isAssistantMessage(userId) ? getAssistantDisplayName() : (userInfo?.display_name || t('common.unknownUser')),
            user_avatar_url: userInfo?.avatar_url || undefined,
          };

          console.log('[FamilyChat] 處理後的消息:', message);
          onMessage(message);
        } catch (error) {
          console.error('[FamilyChat] 處理實時消息時出錯:', error);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'family_chat_messages',
        filter: `family_id=eq.${family_id}`,
      },
      (payload) => {
        console.log('[FamilyChat] 消息被刪除:', payload.old.id);
        // 可以在这里处理消息删除的逻辑
      }
    )
    .subscribe((status) => {
      console.log('[FamilyChat] 訂閱狀態變更:', status, 'for family:', family_id);
    });

  return channel;
}

// 為了向後兼容，提供別名
export const subscribeFamilyChatMessages = subscribeToFamilyChat; 