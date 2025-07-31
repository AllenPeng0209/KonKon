import { supabase } from './supabase';

// 輔助函數：檢查是否為有效的UUID格式
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export interface Todo {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  due_date?: string | null;
  family_id: string;
  user_id: string;
  assigned_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
  sort_order?: number | null;
}

export interface TodoWithUser extends Todo {
  assigned_user?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
  creator?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
  is_shared?: boolean;
}

export interface CreateTodoParams {
  familyId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo?: string;
  shareToFamilies?: string[];
}

export interface Family {
  id: string;
  name: string;
  tag?: string | null;
}

class TodoService {
  async getTodos(familyId: string): Promise<TodoWithUser[]> {
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        creator:users!todos_user_id_fkey(id, display_name, avatar_url),
        assigned_user:users!todos_assigned_to_fkey(id, display_name, avatar_url)
      `)
      .eq('family_id', familyId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // 根據空間獲取待辦事項方法
  async getTodosBySpace(activeFamily: Family, userFamilies: string[], filter: 'all' | 'pending' | 'completed'): Promise<TodoWithUser[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      let query;

      if (activeFamily.id === 'meta-space') {
        // 元空間：獲取用戶所有家庭的待辦事項
        if (userFamilies.length === 0) return [];
        const validFamilyIds = userFamilies.filter(id => isValidUUID(id));
        if (validFamilyIds.length === 0) return [];

        query = supabase
          .from('todos')
          .select(`
            *,
            creator:users!todos_user_id_fkey(id, display_name, avatar_url),
            assigned_user:users!todos_assigned_to_fkey(id, display_name, avatar_url)
          `)
          .in('family_id', validFamilyIds);

      } else if (isValidUUID(activeFamily.id)) {
        // 正常的家庭空間（包括個人空間）：使用有效的UUID查詢
        query = supabase
          .from('todos')
          .select(`
            *,
            creator:users!todos_user_id_fkey(id, display_name, avatar_url),
            assigned_user:users!todos_assigned_to_fkey(id, display_name, avatar_url)
          `)
          .eq('family_id', activeFamily.id);

      } else {
        // 無效的家庭ID，返回空陣列
        console.warn('Invalid family ID format:', activeFamily.id);
        return [];
      }

      // 將過濾條件應用到查詢中
      if (filter === 'pending') {
        query = query.neq('status', 'completed');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data: todos, error } = await query.order('sort_order', { ascending: true });

      if (error) throw error;

      return (todos || []).map(todo => ({
        ...todo,
        is_shared: activeFamily.id === 'meta-space'
      })) as TodoWithUser[];

    } catch (err) {
      console.error('獲取待辦事項失敗:', err);
      throw err;
    }
  }

  async createTodo(params: CreateTodoParams): Promise<TodoWithUser> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 檢查familyId是否為有效UUID
    if (!isValidUUID(params.familyId)) {
      throw new Error(`Invalid family ID format: ${params.familyId}. Cannot create todo in virtual space.`);
    }

    // 獲取當前最大的sort_order
    const { data: maxOrder } = await supabase
      .from('todos')
      .select('sort_order')
      .eq('family_id', params.familyId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = (maxOrder?.[0]?.sort_order || 0) + 1;

    const todoData = {
      title: params.title,
      description: params.description,
      priority: params.priority || 'medium',
      status: 'pending' as const,
      due_date: params.dueDate,
      family_id: params.familyId,
      user_id: user.id,
      assigned_to: params.assignedTo || user.id,
      sort_order: nextOrder,
    };

    const { data, error } = await supabase
      .from('todos')
      .insert(todoData)
      .select(`
        *,
        creator:users!todos_user_id_fkey(id, display_name, avatar_url),
        assigned_user:users!todos_assigned_to_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // 處理分享邏輯
    if (params.shareToFamilies && params.shareToFamilies.length > 0) {
      const validFamilyIds = params.shareToFamilies.filter(id => isValidUUID(id));
      if (validFamilyIds.length > 0) {
        await this.shareTodoToFamilies(data.id, validFamilyIds);
      }
    }

    return data as TodoWithUser;
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<TodoWithUser> {
    const { data, error } = await supabase
      .from('todos')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        creator:users!todos_user_id_fkey(id, display_name, avatar_url),
        assigned_user:users!todos_assigned_to_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data as TodoWithUser;
  }

  async deleteTodo(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async completeTodo(id: string): Promise<TodoWithUser> {
    return this.updateTodo(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  }

  // 分享待辦事項到指定家庭
  async shareTodoToFamilies(todoId: string, familyIds: string[]): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // 過濾出有效的UUID
      const validFamilyIds = familyIds.filter(id => isValidUUID(id));
      
      if (validFamilyIds.length === 0) {
        console.warn('No valid family IDs provided for sharing');
        return false;
      }

      const shareData = validFamilyIds.map(familyId => ({
        todo_id: todoId,
        family_id: familyId,
        shared_by: user.id,
      }));

      const { error } = await supabase
        .from('todo_shares')
        .insert(shareData);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('分享待辦事項失敗:', err);
      throw err;
    }
  }

  // 取消分享待辦事項
  async unshareTodoFromFamily(todoId: string, familyId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('todo_shares')
        .delete()
        .eq('todo_id', todoId)
        .eq('family_id', familyId)
        .eq('shared_by', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('取消分享失敗:', err);
      throw err;
    }
  }

  // 批量更新待辦事項排序順序
  async updateTodoOrder(orderUpdates: { id: string; sort_order: number }[]): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    if (orderUpdates.length === 0) {
      return true;
    }

    try {
      // 使用Promise.all並發更新，提高性能
      const updatePromises = orderUpdates.map(update => 
        supabase
          .from('todos')
          .update({ 
            sort_order: update.sort_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
          .eq('user_id', user.id) // 額外的安全檢查
      );

      const results = await Promise.all(updatePromises);
      
      // 檢查是否有任何更新失敗
      for (const result of results) {
        if (result.error) {
          throw result.error;
        }
      }

      return true;
    } catch (err) {
      console.error('更新排序失敗:', err);
      throw err;
    }
  }
}

export default new TodoService(); 