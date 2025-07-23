import { Tables, TablesInsert } from './database.types';
import { supabase } from './supabase';

// 类型定义
export type FamilyChatMessage = Tables<'family_chat_messages'>;

export interface UIFamilyChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  user_id?: string;
  user_name?: string;
  user_avatar?: string | null;
  created_at: string;
  reply_to_id?: string;
  isLoading?: boolean;
}

export interface SendFamilyMessageParams {
  family_id: string;
  content: string;
  message_type?: 'user' | 'assistant';
  reply_to_id?: string;
  metadata?: Record<string, any>;
}

export interface FamilyChatHistoryParams {
  family_id: string;
  limit?: number;
  before?: string; // message id for pagination
}

// 发送家庭群聊消息
export async function sendFamilyChatMessage({
  family_id,
  content,
  message_type = 'user',
  reply_to_id,
  metadata = {}
}: SendFamilyMessageParams): Promise<FamilyChatMessage> {
  // 特殊處理元空間：元空間是虛擬概念，無法發送消息
  if (family_id === 'meta-space') {
    throw new Error('無法向元空間發送消息');
  }

  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('用户未登录');
  }

  const messageData: TablesInsert<'family_chat_messages'> = {
    family_id,
    user_id: user.user.id,
    message_type,
    content,
    reply_to_id,
    metadata
  };

  const { data, error } = await supabase
    .from('family_chat_messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error('发送消息失败:', error);
    throw new Error(`发送消息失败: ${error.message}`);
  }

  return data as FamilyChatMessage;
}

// 获取家庭群聊历史消息
export async function getFamilyChatHistory({
  family_id,
  limit = 50,
  before
}: FamilyChatHistoryParams): Promise<UIFamilyChatMessage[]> {
  // 特殊處理元空間：元空間是虛擬概念，沒有聊天記錄
  if (family_id === 'meta-space') {
    return [];
  }

  let query = supabase
    .from('family_chat_messages')
    .select(`
      *,
      users (
        display_name,
        avatar_url
      )
    `)
    .eq('family_id', family_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  // 如果有分页参数，添加分页条件
  if (before) {
    const { data: beforeMessage } = await supabase
      .from('family_chat_messages')
      .select('created_at')
      .eq('id', before)
      .single();
    
    if (beforeMessage) {
      query = query.lt('created_at', beforeMessage.created_at);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('获取聊天历史失败:', error);
    throw new Error(`获取聊天历史失败: ${error.message}`);
  }

  // 转换为 UI 消息格式并按时间正序排列
  const messages: UIFamilyChatMessage[] = (data || [])
    .reverse()
    .map((msg: any) => ({
      id: msg.id,
      type: msg.message_type,
      content: msg.content,
      user_id: msg.user_id,
                user_name: msg.users?.display_name || '未知用户',
          user_avatar: msg.users?.avatar_url,
      created_at: msg.created_at,
      reply_to_id: msg.reply_to_id,
    }));

  return messages;
}

// 保存当前聊天会话到conversations表（用于AI分析和记录）
export async function saveFamilyChatSession(
  family_id: string,
  messages: UIFamilyChatMessage[]
): Promise<void> {
  if (messages.length === 0) return;

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('用户未登录');

  // 创建对话记录
  const conversationContent = messages.map(msg => ({
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: msg.content,
    timestamp: msg.created_at,
    user_id: msg.user_id,
    user_name: msg.user_name
  }));

  try {
    // 1. 创建 conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        content: conversationContent,
        created_by: user.user.id
      } as TablesInsert<'conversations'>)
      .select()
      .single();

    if (convError) throw convError;

    // 2. 分享给家庭
    const { error: shareError } = await supabase
      .from('conversation_shares')
      .insert({
        conversation_id: conv.id,
        family_id,
        shared_by: user.user.id
      } as TablesInsert<'conversation_shares'>);

    if (shareError) throw shareError;

    console.log('聊天会话已保存到对话记录');
  } catch (error) {
    console.error('保存聊天会话失败:', error);
    // 不抛出错误，保存失败不应该影响正常聊天
  }
}

// 获取家庭的所有对话记录
export async function getFamilyConversations(family_id: string) {
  const { data: shares, error } = await supabase
    .from('conversation_shares')
    .select(`
      *,
      conversations (
        *,
        users (
          display_name,
          avatar_url
        )
      )
    `)
    .eq('family_id', family_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取家庭对话记录失败:', error);
    throw error;
  }

  return shares || [];
}

// 删除消息
export async function deleteFamilyChatMessage(message_id: string): Promise<void> {
  const { error } = await supabase
    .from('family_chat_messages')
    .delete()
    .eq('id', message_id);

  if (error) {
    console.error('删除消息失败:', error);
    throw new Error(`删除消息失败: ${error.message}`);
  }
}

// 清空家庭聊天记录（管理员功能）
export async function clearFamilyChat(family_id: string): Promise<void> {
  const { error } = await supabase
    .from('family_chat_messages')
    .delete()
    .eq('family_id', family_id);

  if (error) {
    console.error('清空聊天记录失败:', error);
    throw new Error(`清空聊天记录失败: ${error.message}`);
  }
}

// 实时订阅家庭聊天消息
export function subscribeFamilyChatMessages(
  family_id: string,
  onMessage: (message: UIFamilyChatMessage) => void,
  onDelete: (messageId: string) => void
) {
  // 特殊處理元空間：元空間是虛擬概念，無需實時訂閱
  if (family_id === 'meta-space') {
    // 返回一個虛擬的 channel，提供 unsubscribe 方法但不執行任何操作
    return {
      unsubscribe: () => {}
    };
  }

  const channel = supabase
    .channel(`family_chat:${family_id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'family_chat_messages',
        filter: `family_id=eq.${family_id}`
      },
      async (payload) => {
        // 获取用户信息
        const { data: userInfo } = await supabase
          .from('users')
          .select('display_name, avatar_url')
          .eq('id', payload.new.user_id)
          .single();

        const message: UIFamilyChatMessage = {
          id: payload.new.id,
          type: payload.new.message_type,
          content: payload.new.content,
          user_id: payload.new.user_id,
          user_name: userInfo?.display_name || '未知用户',
          user_avatar: userInfo?.avatar_url,
          created_at: payload.new.created_at,
          reply_to_id: payload.new.reply_to_id,
        };

        onMessage(message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'family_chat_messages',
        filter: `family_id=eq.${family_id}`
      },
      (payload) => {
        onDelete(payload.old.id);
      }
    )
    .subscribe();

  return channel;
} 