import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { Database } from '../lib/database.types';
import { cancelNotificationForEvent, scheduleNotificationForEvent } from '../lib/notifications';
import { generateRecurrenceInstances, parseRecurrenceRule, RecurrenceInstance, RecurrenceRule } from '../lib/recurrenceEngine';
import { supabase } from '../lib/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventShare = Database['public']['Tables']['event_shares']['Row'];

// 创建事件的数据结构
export interface CreateEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  color?: string;
  shareToFamilies?: string[]; // 要分享给的家庭群组ID数组
  type?: string;
  attendees?: string[]; // 参与人用户ID数组
  imageUrls?: string[]; // 照片附件URL数组
  recurrenceRule?: RecurrenceRule; // 使用统一的 RecurrenceRule 类型
}

// 事件分享数据结构使用数据库类型

// 扩展事件数据结构，包含分享信息
export interface EventWithShares extends Event {
  shared_families?: string[];
  is_shared?: boolean;
  attendees?: Array<{
    user_id: string;
    status: string;
    user?: {
      display_name: string;
      email: string;
      avatar_url?: string;
    };
  }>;
}

export const useEvents = () => {
  const { user } = useAuth();
  const { familyMembers } = useFamily();
  const [events, setEvents] = useState<EventWithShares[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExpandKey, setLastExpandKey] = useState<string>(''); // 防重复扩展

  // 使用 useMemo 稳定 userFamilies 引用，避免重复调用
  const userFamilies = useMemo(() => 
    familyMembers.map(m => m.family_id), 
    [familyMembers]
  );
  
  const userFamilyDetails = useMemo(() => 
    familyMembers.map(m => ({
      id: m.family_id,
      name: m.user?.display_name || '未知家庭' 
    })), 
    [familyMembers]
  );

  // 获取事件列表（个人事件 + 分享给用户的事件）
  const fetchEvents = useCallback(async (year?: number, month?: number) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // 策略：总是获取所有重复事件主记录，无论时间范围
      // 1. 获取所有重复事件主记录
      const { data: recurringEvents, error: recurringError } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .is('parent_event_id', null) // 只要主记录
        .not('recurrence_rule', 'is', null); // 有重复规则

      if (recurringError) throw recurringError;

      // 2. 获取普通事件（根据时间过滤）
      let normalEventsQuery = supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .is('recurrence_rule', null); // 无重复规则

      if (year && month) {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);
        const startTimestamp = Math.floor(startOfMonth.getTime() / 1000);
        const endTimestamp = Math.floor(endOfMonth.getTime() / 1000);
        
        normalEventsQuery = normalEventsQuery
          .gte('start_ts', startTimestamp)
          .lte('start_ts', endTimestamp);
      }

      const { data: normalEvents, error: normalError } = await normalEventsQuery;
      
      if (normalError) throw normalError;

      // 3. 获取分享事件（简化处理）
      let sharedEventsQuery = supabase
        .from('event_shares')
        .select(`
          event_id,
          events (
            *
          )
        `)
        .in('family_id', userFamilies);

      const { data: sharedResult, error: sharedError } = await sharedEventsQuery;
      
      if (sharedError) throw sharedError;

      // 合并所有事件
      const allEvents: EventWithShares[] = [
        ...(recurringEvents || []).map(event => ({ ...event, is_shared: false })),
        ...(normalEvents || []).map(event => ({ ...event, is_shared: false })),
        ...(sharedResult || [])
          .filter(share => share.events)
          .map(share => ({ ...share.events, is_shared: true }))
      ];

      // 去重
      const eventMap = new Map<string, EventWithShares>();
      allEvents.forEach(event => {
        const existing = eventMap.get(event.id);
        if (existing) {
          existing.is_shared = true;
        } else {
          eventMap.set(event.id, event);
        }
      });

      const finalEvents = Array.from(eventMap.values()).sort((a, b) => a.start_ts - b.start_ts);

      // 获取所有事件的参与人信息
      if (finalEvents.length > 0) {
        const eventIds = finalEvents.map(e => e.id);
        const { data: attendeesData, error: attendeesError } = await supabase
          .from('event_attendees')
          .select(`
            event_id,
            user_id,
            status,
            users (
              display_name,
              email,
              avatar_url
            )
          `)
          .in('event_id', eventIds);

        if (!attendeesError && attendeesData) {
          // 将参与人数据关联到对应的事件
          const attendeesMap = new Map<string, any[]>();
          attendeesData.forEach(attendee => {
            if (!attendeesMap.has(attendee.event_id)) {
              attendeesMap.set(attendee.event_id, []);
            }
            attendeesMap.get(attendee.event_id)?.push({
              user_id: attendee.user_id,
              status: attendee.status,
              user: attendee.users,
            });
          });

          // 将参与人数据附加到事件
          finalEvents.forEach(event => {
            event.attendees = attendeesMap.get(event.id) || [];
          });
        }
      }

      // 生成重复事件实例
      const expandedEvents = await expandRecurringEvents(finalEvents, year, month);

      setEvents(expandedEvents);

    } catch (err) {
      setError(err instanceof Error ? err.message : '获取事件失败');
    } finally {
      setLoading(false);
    }
  }, [user, userFamilies]);

  // 扩展重复事件实例的辅助函数
  const expandRecurringEvents = async (events: EventWithShares[], year?: number, month?: number) => {
    // 生成唯一键来避免重复扩展相同的数据 - 包含年月信息确保切换月份时重新计算
    const expandKey = `${events.length}_${year || 'all'}_${month || 'all'}`;
    if (expandKey === lastExpandKey) {
      // 相同的数据集，直接返回已扩展的结果
      return events;
    }
    
    const expandedEvents: EventWithShares[] = [];
    
    // 确定时间范围
    let startDate: Date;
    let endDate: Date;
    let viewStartDate: Date;
    let viewEndDate: Date;
    
    if (year && month) {
      // 查看特定月份时
      viewStartDate = new Date(year, month - 1, 1); // 当前月第一天
      viewEndDate = new Date(year, month, 0); // 当前月最后一天
      
      // 为了生成重复事件，需要更宽的时间范围 - 从原始事件开始日期到未来
      startDate = new Date(2025, 0, 1); // 从2025年1月1日开始，确保包含所有重复事件
      endDate = new Date(year, month + 2, 0); // 扩展到未来3个月用于计算重复
    } else {
      // 没有指定月份时，从当前日期开始，扩展1年
      startDate = new Date();
      endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      viewStartDate = startDate;
      viewEndDate = endDate;
    }
    
    const recurringEventsCount = events.filter(e => e.recurrence_rule && !e.parent_event_id).length;
    if (recurringEventsCount > 0) {
    }
    
    for (const event of events) {
      if (event.recurrence_rule && !event.parent_event_id) {
        // 这是一个重复事件的主事件
        try {
          // 获取该重复事件的异常记录
          const { data: exceptions } = await supabase
            .from('event_exceptions')
            .select('*')
            .eq('parent_event_id', event.id);

          // 解析重复规则
          const recurrenceRule = parseRecurrenceRule(event.recurrence_rule);
          
          if (recurrenceRule) {
            // 转换异常记录
            const recurrenceExceptions = (exceptions || []).map(ex => ({
              date: new Date(ex.exception_date),
              type: ex.exception_type as 'cancelled' | 'modified' | 'moved',
              modifiedEventId: ex.modified_event_id || undefined,
            }));

            // 生成重复事件实例 - 使用更大的范围
            const originalStart = new Date(event.start_ts * 1000);
            const originalEnd = new Date(event.end_ts * 1000);
            
            const instances = generateRecurrenceInstances(
              originalStart,
              originalEnd,
              recurrenceRule,
              recurrenceExceptions,
              endDate, // 使用扩展后的结束时间
              200 // 增加最大实例数
            );

            // 过滤当前查看月份的实例
            const filteredInstances = instances
              .filter((instance: RecurrenceInstance) => {
                const inRange = instance.start >= viewStartDate && instance.start <= viewEndDate;
                return inRange;
              })
              .map((instance: RecurrenceInstance) => ({
                ...event,
                id: `${event.id}_${instance.start.getTime()}`, // 生成唯一ID
                start_ts: Math.floor(instance.start.getTime() / 1000),
                end_ts: Math.floor(instance.end.getTime() / 1000),
                parent_event_id: event.id,
                recurrence_rule: null, // 实例本身不是重复事件
              }));

            expandedEvents.push(...filteredInstances);
          }
        } catch (error) {
          console.error('生成重复事件实例失败:', error);
          // 如果生成失败，至少添加原始事件
          if (event.start_ts >= Math.floor(viewStartDate.getTime() / 1000) && 
              event.start_ts <= Math.floor(viewEndDate.getTime() / 1000)) {
            expandedEvents.push(event);
          }
        }
      } else {
        // 普通事件或重复事件的修改实例
        // 如果是查看特定月份，只包含该月份的事件
        if (year && month) {
          if (event.start_ts >= Math.floor(viewStartDate.getTime() / 1000) && 
              event.start_ts <= Math.floor(viewEndDate.getTime() / 1000)) {
            expandedEvents.push(event);
          }
        } else {
          expandedEvents.push(event);
        }
      }
    }
    
    // 更新防重复键
    setLastExpandKey(expandKey);
    
    return expandedEvents.sort((a, b) => a.start_ts - b.start_ts);
  };

  // 创建事件
  const createEvent = async (eventData: CreateEventData): Promise<string | null> => {
    if (!user) {
      setError('用户未登录');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { title, description, startTime, endTime, location, color, shareToFamilies, type, attendees, imageUrls } = eventData;

      const start_ts = Math.floor(startTime.getTime() / 1000);
      const end_ts = endTime ? Math.floor(endTime.getTime() / 1000) : start_ts + 3600; // 默認1小時

      const eventToInsert: Partial<EventInsert> = {
        creator_id: user.id,
        title,
        description,
        start_ts,
        end_ts,
        location,
        color,
        type,
        image_urls: imageUrls || null,
      };

      if (shareToFamilies && shareToFamilies.length > 0) {
        // For now, let's assume we share to the first family. 
        // This logic can be expanded later.
        eventToInsert.family_id = shareToFamilies[0];
      }

      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert(eventToInsert as EventInsert)
        .select()
        .single();

      if (eventError) {
        throw eventError;
      }

      // 处理参与人数据
      if (attendees && attendees.length > 0) {
        const attendeeData = attendees.map(userId => ({
          event_id: newEvent.id,
          user_id: userId,
          status: 'accepted', // 默认状态为已接受
        }));

        const { error: attendeeError } = await supabase
          .from('event_attendees')
          .insert(attendeeData);

        if (attendeeError) {
          console.error('添加参与人失败:', attendeeError);
          // 参与人添加失败不影响事件创建，只记录错误
        }
      }
      
      // 4. 如果是分享事件，更新 family_id 或 event_shares 表
      if (shareToFamilies && shareToFamilies.length > 0) {
        // 假设一次只分享给一个家庭
        const familyId = shareToFamilies[0];
        const { error: shareError } = await supabase
          .from('event_shares')
          .insert({ event_id: newEvent.id, family_id: familyId, shared_by: user.id });
        
        if (shareError) {
          // console.error('分享事件失败:', shareError);
          // 即使分享失败，事件本身已创建，可以考虑回滚或提示
        }
      }

      await fetchEvents();
      
      // Schedule notification
      if (newEvent) {
        await scheduleNotificationForEvent({
          id: newEvent.id,
          title: newEvent.title,
          date: startTime,
          startTime: startTime.toTimeString().substring(0, 5),
        });
      }

      return newEvent.id;

    } catch (err) {
      // console.error('创建事件失败:', err);
      setError(err instanceof Error ? err.message : '创建事件失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 删除事件
  const deleteEvent = async (eventId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // 首先删除相关的分享记录
      await supabase.from('event_shares').delete().eq('event_id', eventId);
      
      // 然后删除事件本身
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;

      await cancelNotificationForEvent(eventId);

      // 从本地状态中移除
      setEvents(prev => prev.filter(e => e.id !== eventId));

      // 重新获取当月事件
      const currentDate = new Date();
      fetchEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
      
      return true;
    } catch (err) {
      // console.error('删除事件失败:', err);
      setError(err instanceof Error ? err.message : '删除事件失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 更新事件
  const updateEvent = async (eventId: string, eventData: CreateEventData): Promise<boolean> => {
    if (!user) {
      setError('用户未登录');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { title, description, startTime, endTime, location, color, shareToFamilies, type, attendees, imageUrls } = eventData;

      const start_ts = Math.floor(startTime.getTime() / 1000);
      const end_ts = endTime ? Math.floor(endTime.getTime() / 1000) : start_ts + 3600; // 默認1小時

      const eventToUpdate: Partial<Event> = {
        title,
        description,
        start_ts,
        end_ts,
        location,
        color,
        type,
        image_urls: imageUrls || null,
        updated_at: new Date().toISOString(),
      };

      // 检查是否有重复规则需要更新
      const recurrenceRule = (eventData as any).recurrenceRule;
      if (recurrenceRule) {
        // 导入重复事件相关函数
        const { generateRecurrenceRule } = await import('../lib/recurrenceEngine');
        
        eventToUpdate.recurrence_rule = generateRecurrenceRule(recurrenceRule);
        eventToUpdate.recurrence_end_date = recurrenceRule.until?.toISOString().split('T')[0] || null;
        eventToUpdate.recurrence_count = recurrenceRule.count || null;
        eventToUpdate.parent_event_id = null; // 确保这是父事件
      } else {
        // 如果没有重复规则，清除相关字段
        eventToUpdate.recurrence_rule = null;
        eventToUpdate.recurrence_end_date = null;
        eventToUpdate.recurrence_count = null;
        eventToUpdate.parent_event_id = null;
      }

      // 首先檢查事件是否存在以及用戶權限
      const { data: existingEvent, error: checkError } = await supabase
        .from('events')
        .select('id, creator_id, title')
        .eq('id', eventId)
        .single();

      if (checkError || !existingEvent) {
        throw new Error('事件不存在或無法訪問');
      }

      // 檢查用戶權限：是創建者或有共享權限
      if (existingEvent.creator_id !== user.id) {
        // 暫時允許更新，後續可以添加更複雜的權限檢查
      }

      const { data: updateData, error } = await supabase
        .from('events')
        .update(eventToUpdate)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!updateData) {
        throw new Error('更新失敗，未返回數據');
      }

      // 更新參與人
      if (attendees && attendees.length > 0) {
        // 先刪除現有參與人
        await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId);

        // 再添加新的參與人
        const attendeeInserts = attendees.map(attendeeId => ({
          event_id: eventId,
          user_id: attendeeId,
          status: 'pending'
        }));

        await supabase
          .from('event_attendees')
          .insert(attendeeInserts);
      }

      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 分享事件给家庭/群组
  const shareEventToFamily = async (eventId: string, familyId: string): Promise<boolean> => {
    if (!user) {
      setError('用户未登录');
      return false;
    }

    try {
      const { error } = await supabase
        .from('event_shares')
        .insert([{
          event_id: eventId,
          family_id: familyId,
          shared_by: user.id
        }]);

      if (error) {
        // console.error('分享事件失败:', error);
        throw error;
      }

      // 更新本地状态
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            is_shared: true,
            shared_families: [...(event.shared_families || []), familyId]
          };
        }
        return event;
      }));

      return true;

    } catch (err) {
      // console.error('分享事件失败:', err);
      setError(err instanceof Error ? err.message : '分享事件失败');
      return false;
    }
  };

  // 取消分享事件
  const unshareEventFromFamily = async (eventId: string, familyId: string): Promise<boolean> => {
    if (!user) {
      setError('用户未登录');
      return false;
    }

    try {
      const { error } = await supabase
        .from('event_shares')
        .delete()
        .eq('event_id', eventId)
        .eq('family_id', familyId)
        .eq('shared_by', user.id);

      if (error) {
        // console.error('取消分享失败:', error);
        throw error;
      }

      // 更新本地状态
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          const newSharedFamilies = (event.shared_families || []).filter(id => id !== familyId);
          return {
            ...event,
            is_shared: newSharedFamilies.length > 0,
            shared_families: newSharedFamilies
          };
        }
        return event;
      }));

      return true;

    } catch (err) {
      // console.error('取消分享失败:', err);
      setError(err instanceof Error ? err.message : '取消分享失败');
      return false;
    }
  };

  // 获取指定日期的事件 - 修复时区问题
  const getEventsByDate = (date: Date): EventWithShares[] => {
    // 使用本地时区的日期范围
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const startTs = Math.floor(startOfDay.getTime() / 1000);
    const endTs = Math.floor(endOfDay.getTime() / 1000);
    const filteredEvents = events.filter(event => 
      event.start_ts >= startTs && event.start_ts <= endTs
    );
    return filteredEvents;
  };

  // 获取指定月份的事件
  const getMonthEvents = (year: number, month: number): EventWithShares[] => {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    const startTs = Math.floor(startOfMonth.getTime() / 1000);
    const endTs = Math.floor(endOfMonth.getTime() / 1000);

    return events.filter(event => 
      event.start_ts >= startTs && event.start_ts <= endTs
    );
  };

  // 清除事件缓存（用于强制重新获取）
  const clearEvents = () => {
    setEvents([]);
    setLastExpandKey(''); // 清除防重复键
  };

  // 初始化时获取用户家庭列表
  useEffect(() => {
    if (user) {
      // fetchUserFamilies(); // This line is removed as per the edit hint
    }
  }, [user]);

  // 当用户信息获取到后，立即获取个人事件
  useEffect(() => {
    if (user) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      fetchEvents(currentYear, currentMonth);
    }
  }, [user, fetchEvents]);

  // 当家庭列表变化时，重新获取所有事件（包括群组事件和个人事件）
  useEffect(() => {
    if (user) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      fetchEvents(currentYear, currentMonth);
    }
  }, [userFamilies, fetchEvents]);

  return {
    events,
    loading,
    error,
    userFamilyDetails,
    createEvent,
    updateEvent,
    deleteEvent,
    shareEventToFamily,
    unshareEventFromFamily,
    getEventsByDate,
    getMonthEvents,
    fetchEvents,
    clearEvents,
  };
}; 