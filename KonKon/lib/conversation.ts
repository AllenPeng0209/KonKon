import { supabase } from './supabase';
import { Tables, TablesInsert } from './database.types';

export type Conversation = Tables<'conversations'>;

// 創建對話並自動分享給家庭
type CreateConversationParams = {
  content: any;
  family_id: string;
  user_id: string;
};

export async function createAndShareConversation({ content, family_id, user_id }: CreateConversationParams) {
  // 1. 創建 conversation
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({ content, created_by: user_id } as TablesInsert<'conversations'>)
    .select()
    .single();
  if (convError) throw convError;

  // 2. 分享給家庭
  const { error: shareError } = await supabase
    .from('conversation_shares')
    .insert({ conversation_id: conv.id, family_id, shared_by: user_id } as TablesInsert<'conversation_shares'>);
  if (shareError) throw shareError;

  return conv as Conversation;
}

// 查詢家庭所有對話（按時間排序）
export async function fetchFamilyConversations(family_id: string): Promise<Conversation[]> {
  // 先查 conversation_shares
  const { data: shares, error } = await supabase
    .from('conversation_shares')
    .select('conversation_id, conversations(*)')
    .eq('family_id', family_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (shares || []).map((s: any) => s.conversations).filter(Boolean);
}

// 查詢單條對話
export async function fetchConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Conversation;
} 