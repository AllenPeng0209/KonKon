import type { Database } from './database.types';
import { supabase } from './supabase';

type Todo = Database['public']['Tables']['todos']['Row'];
type TodoInsert = Database['public']['Tables']['todos']['Insert'];
type TodoUpdate = Database['public']['Tables']['todos']['Update'];

export interface TodoWithUser extends Todo {
  assigned_user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  creator?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface CreateTodoParams {
  familyId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string; // ISO date string
}

class TodoService {
  // 創建待辦事項
  async createTodo(params: CreateTodoParams): Promise<Todo> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const todoData: TodoInsert = {
      family_id: params.familyId,
      user_id: user.id,
      title: params.title,
      description: params.description,
      priority: params.priority || 'medium',
      assigned_to: params.assignedTo,
      due_date: params.dueDate,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('todos')
      .insert(todoData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 獲取家庭待辦事項
  async getTodosByFamily(familyId: string): Promise<TodoWithUser[]> {
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        assigned_user:assigned_to(id, display_name, avatar_url),
        creator:user_id(id, display_name, avatar_url)
      `)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TodoWithUser[];
  }

  // 獲取用戶的待辦事項
  async getTodosByUser(userId: string): Promise<TodoWithUser[]> {
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        assigned_user:assigned_to(id, display_name, avatar_url),
        creator:user_id(id, display_name, avatar_url)
      `)
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TodoWithUser[];
  }

  // 更新待辦事項
  async updateTodo(todoId: string, updates: TodoUpdate): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', todoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 標記完成
  async completeTodo(todoId: string): Promise<Todo> {
    return this.updateTodo(todoId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  }

  // 標記進行中
  async startTodo(todoId: string): Promise<Todo> {
    return this.updateTodo(todoId, {
      status: 'in_progress',
    });
  }

  // 刪除待辦事項
  async deleteTodo(todoId: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId);

    if (error) throw error;
  }

  // 獲取統計數據
  async getTodoStats(familyId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  }> {
    const { data, error } = await supabase
      .from('todos')
      .select('status, due_date')
      .eq('family_id', familyId);

    if (error) throw error;
    if (!data) return { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 };

    const now = new Date();
    const stats = {
      total: data.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    };

    data.forEach(todo => {
      const status = todo.status as 'pending' | 'in_progress' | 'completed';
      if (status in stats) {
        stats[status]++;
      }
      
      if (todo.due_date && todo.status !== 'completed') {
        const dueDate = new Date(todo.due_date);
        if (dueDate < now) {
          stats.overdue++;
        }
      }
    });

    return stats;
  }

  // 批量操作
  async batchUpdateTodos(todoIds: string[], updates: TodoUpdate): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .in('id', todoIds)
      .select();

    if (error) throw error;
    return data;
  }

  // 獲取今日到期的待辦事項
  async getTodayDueTodos(familyId: string): Promise<TodoWithUser[]> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        assigned_user:assigned_to(id, display_name, avatar_url),
        creator:user_id(id, display_name, avatar_url)
      `)
      .eq('family_id', familyId)
      .eq('due_date', todayStr)
      .neq('status', 'completed')
      .order('priority', { ascending: false });

    if (error) throw error;
    return data as TodoWithUser[];
  }

  // 搜索待辦事項
  async searchTodos(familyId: string, query: string): Promise<TodoWithUser[]> {
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        assigned_user:assigned_to(id, display_name, avatar_url),
        creator:user_id(id, display_name, avatar_url)
      `)
      .eq('family_id', familyId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TodoWithUser[];
  }
}

export default new TodoService(); 