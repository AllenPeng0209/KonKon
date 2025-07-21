import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import {
    RecurrenceException,
    RecurrenceInstance,
    RecurrenceRule,
    generateRecurrenceInstances,
    generateRecurrenceRule,
    parseRecurrenceRule,
    validateRecurrenceRule
} from '../lib/recurrenceEngine';
import { supabase } from '../lib/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventException = Database['public']['Tables']['event_exceptions']['Row'];
type EventExceptionInsert = Database['public']['Tables']['event_exceptions']['Insert'];

export interface RecurringEventData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  color?: string;
  recurrenceRule: RecurrenceRule;
  familyId?: string;
}

export const useRecurringEvents = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 创建重复事件
  const createRecurringEvent = useCallback(async (eventData: RecurringEventData): Promise<string | null> => {
    if (!user) {
      setError('用户未登录');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 验证重复规则
      const validation = validateRecurrenceRule(eventData.recurrenceRule);
      if (!validation.valid) {
        throw new Error(`重复规则验证失败: ${validation.errors.join(', ')}`);
      }

      // 生成 RRULE 字符串
      const rruleString = generateRecurrenceRule(eventData.recurrenceRule);

      // 准备事件数据
      const eventToInsert: EventInsert = {
        creator_id: user.id,
        title: eventData.title,
        description: eventData.description,
        start_ts: Math.floor(eventData.startDate.getTime() / 1000),
        end_ts: Math.floor(eventData.endDate.getTime() / 1000),
        location: eventData.location,
        color: eventData.color || '#007AFF',
        family_id: eventData.familyId || null,
        recurrence_rule: rruleString,
        recurrence_end_date: eventData.recurrenceRule.until?.toISOString().split('T')[0] || null,
        recurrence_count: eventData.recurrenceRule.count || null,
        parent_event_id: null, // 这是父事件
      };

      // 创建主重复事件
      const { data: parentEvent, error: createError } = await supabase
        .from('events')
        .insert(eventToInsert)
        .select('id')
        .single();

      if (createError || !parentEvent) {
        throw new Error(`创建重复事件失败: ${createError?.message || '未返回事件数据'}`);
      }

      return parentEvent.id;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建重复事件失败';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 获取重复事件实例
  const getRecurringEventInstances = useCallback(async (
    parentEventId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ instances: RecurrenceInstance[]; rule: RecurrenceRule | null }> => {
    try {
      // 获取父事件
      const { data: parentEvent, error: parentError } = await supabase
        .from('events')
        .select('*')
        .eq('id', parentEventId)
        .single();

      if (parentError || !parentEvent) {
        throw new Error('无法找到父事件');
      }

      // 解析重复规则
      const recurrenceRule = parseRecurrenceRule(parentEvent.recurrence_rule || '');
      if (!recurrenceRule) {
        return { instances: [], rule: null };
      }

      // 获取异常记录
      const { data: exceptions, error: exceptionsError } = await supabase
        .from('event_exceptions')
        .select('*')
        .eq('parent_event_id', parentEventId);

      if (exceptionsError) {
        console.warn('获取异常记录失败:', exceptionsError);
      }

      // 转换异常记录格式
      const recurrenceExceptions: RecurrenceException[] = (exceptions || []).map(ex => ({
        date: new Date(ex.exception_date),
        type: ex.exception_type as 'cancelled' | 'modified' | 'moved',
        modifiedEventId: ex.modified_event_id || undefined,
      }));

      // 生成重复事件实例
      const instances = generateRecurrenceInstances(
        new Date(parentEvent.start_ts * 1000),
        new Date(parentEvent.end_ts * 1000),
        recurrenceRule,
        recurrenceExceptions,
        endDate,
        200 // 最多生成200个实例
      );

      // 过滤指定日期范围内的实例
      const filteredInstances = instances.filter(instance => 
        instance.start >= startDate && instance.start <= endDate
      );

      return { instances: filteredInstances, rule: recurrenceRule };

    } catch (err) {
      console.error('获取重复事件实例失败:', err);
      setError(err instanceof Error ? err.message : '获取重复事件实例失败');
      return { instances: [], rule: null };
    }
  }, []);

  // 修改单个重复事件实例
  const modifyRecurringEventInstance = useCallback(async (
    parentEventId: string,
    instanceDate: Date,
    eventData: Partial<RecurringEventData>
  ): Promise<boolean> => {
    if (!user) {
      setError('用户未登录');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 创建修改后的事件
      const modifiedEventData: EventInsert = {
        creator_id: user.id,
        title: eventData.title || '',
        description: eventData.description,
        start_ts: eventData.startDate ? Math.floor(eventData.startDate.getTime() / 1000) : 0,
        end_ts: eventData.endDate ? Math.floor(eventData.endDate.getTime() / 1000) : 0,
        location: eventData.location,
        color: eventData.color,
        family_id: eventData.familyId || null,
        parent_event_id: parentEventId,
        recurrence_rule: null, // 单个实例不需要重复规则
      };

      const { data: modifiedEvent, error: createError } = await supabase
        .from('events')
        .insert(modifiedEventData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // 创建异常记录
      const exceptionData: EventExceptionInsert = {
        parent_event_id: parentEventId,
        exception_date: instanceDate.toISOString().split('T')[0],
        exception_type: 'modified',
        modified_event_id: modifiedEvent.id,
      };

      const { error: exceptionError } = await supabase
        .from('event_exceptions')
        .insert(exceptionData);

      if (exceptionError) {
        // 如果异常记录创建失败，删除已创建的修改事件
        await supabase.from('events').delete().eq('id', modifiedEvent.id);
        throw exceptionError;
      }

      return true;

    } catch (err) {
      console.error('修改重复事件实例失败:', err);
      setError(err instanceof Error ? err.message : '修改重复事件实例失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 取消单个重复事件实例
  const cancelRecurringEventInstance = useCallback(async (
    parentEventId: string,
    instanceDate: Date
  ): Promise<boolean> => {
    if (!user) {
      setError('用户未登录');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 创建取消异常记录
      const exceptionData: EventExceptionInsert = {
        parent_event_id: parentEventId,
        exception_date: instanceDate.toISOString().split('T')[0],
        exception_type: 'cancelled',
      };

      const { error: exceptionError } = await supabase
        .from('event_exceptions')
        .insert(exceptionData);

      if (exceptionError) {
        throw exceptionError;
      }

      return true;

    } catch (err) {
      console.error('取消重复事件实例失败:', err);
      setError(err instanceof Error ? err.message : '取消重复事件实例失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 删除整个重复事件系列
  const deleteRecurringSeries = useCallback(async (parentEventId: string): Promise<boolean> => {
    if (!user) {
      setError('用户未登录');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 删除所有相关的异常记录
      await supabase
        .from('event_exceptions')
        .delete()
        .eq('parent_event_id', parentEventId);

      // 删除所有子事件（修改实例）
      await supabase
        .from('events')
        .delete()
        .eq('parent_event_id', parentEventId);

      // 删除父事件
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', parentEventId)
        .eq('creator_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      return true;

    } catch (err) {
      console.error('删除重复事件系列失败:', err);
      setError(err instanceof Error ? err.message : '删除重复事件系列失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 批量操作：修改从某个日期开始的所有实例
  const modifyRecurringSeriesFromDate = useCallback(async (
    parentEventId: string,
    fromDate: Date,
    eventData: Partial<RecurringEventData>
  ): Promise<boolean> => {
    if (!user) {
      setError('用户未登录');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 获取原始父事件
      const { data: parentEvent, error: parentError } = await supabase
        .from('events')
        .select('*')
        .eq('id', parentEventId)
        .single();

      if (parentError || !parentEvent) {
        throw new Error('无法找到父事件');
      }

      // 更新父事件的结束日期为 fromDate 的前一天
      const endDate = new Date(fromDate);
      endDate.setDate(endDate.getDate() - 1);

      await supabase
        .from('events')
        .update({
          recurrence_end_date: endDate.toISOString().split('T')[0]
        })
        .eq('id', parentEventId);

      // 创建新的重复事件系列（从 fromDate 开始）
      if (eventData.recurrenceRule) {
        const newSeriesData: RecurringEventData = {
          title: eventData.title || parentEvent.title,
          description: eventData.description || parentEvent.description || undefined,
          startDate: eventData.startDate || new Date(parentEvent.start_ts * 1000),
          endDate: eventData.endDate || new Date(parentEvent.end_ts * 1000),
          location: eventData.location || parentEvent.location || undefined,
          color: eventData.color || parentEvent.color || undefined,
          recurrenceRule: eventData.recurrenceRule,
          familyId: eventData.familyId || parentEvent.family_id || undefined,
        };

        await createRecurringEvent(newSeriesData);
      }

      return true;

    } catch (err) {
      console.error('批量修改重复事件系列失败:', err);
      setError(err instanceof Error ? err.message : '批量修改重复事件系列失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, createRecurringEvent]);

  return {
    loading,
    error,
    createRecurringEvent,
    getRecurringEventInstances,
    modifyRecurringEventInstance,
    cancelRecurringEventInstance,
    deleteRecurringSeries,
    modifyRecurringSeriesFromDate,
  };
};