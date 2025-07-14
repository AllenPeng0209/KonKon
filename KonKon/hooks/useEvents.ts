import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { cancelNotificationForEvent, scheduleNotificationForEvent } from '../lib/notifications';
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
}

// 事件分享数据结构使用数据库类型

// 扩展事件数据结构，包含分享信息
export interface EventWithShares extends Event {
  shared_families?: string[];
  is_shared?: boolean;
}

export const useEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithShares[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userFamilies, setUserFamilies] = useState<string[]>([]);
  const [userFamilyDetails, setUserFamilyDetails] = useState<{ id: string; name: string }[]>([]);

  // 获取用户的家庭/群组列表
  const fetchUserFamilies = async () => {
    if (!user) return;
    
    try {
      // 获取用户所在的所有家庭/群组，包含家庭详情
      const { data: familyMembers, error } = await supabase
        .from('family_members')
        .select(`
          family_id,
          families (
            id,
            name
          )
        `)
        .eq('user_id', user.id);
      
      if (error) {
        // console.error('获取家庭列表失败:', error);
        return;
      }
      
      const familyIds = familyMembers?.map(member => member.family_id) || [];
      const familyDetails = familyMembers?.map(member => ({
        id: member.family_id,
        name: (member.families as any)?.name || '未知家庭'
      })) || [];
      
      setUserFamilies(familyIds);
      setUserFamilyDetails(familyDetails);
    } catch (err) {
      // console.error('获取家庭列表时出错:', err);
    }
  };

  // 获取事件列表（个人事件 + 分享给用户的事件）
  const fetchEvents = async (year?: number, month?: number) => {
    if (!user) return;
    
    // console.log('🔄 开始获取事件...', { userId: user.id, year, month, userFamilies });
    
    try {
      setLoading(true);
      setError(null);

      // 1. 获取个人事件（family_id 为 NULL）
      let personalEventsQuery = supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .is('family_id', null);
      
      // 2. 获取分享给用户所在群组的事件
      let sharedEventsQuery = supabase
        .from('event_shares')
        .select(`
          event_id,
          family_id,
          events!inner (*)
        `)
        .in('family_id', userFamilies);

      // 添加时间过滤
      if (year && month) {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        const startTs = Math.floor(startOfMonth.getTime() / 1000);
        const endTs = Math.floor(endOfMonth.getTime() / 1000);
        
        personalEventsQuery = personalEventsQuery
          .gte('start_ts', startTs)
          .lte('start_ts', endTs);
        
        // 对于分享事件，我们需要在事件表上过滤时间
        // 由于 Supabase 的限制，我们需要在获取数据后再过滤
      }

      const [personalResult, sharedResult] = await Promise.all([
        personalEventsQuery,
        sharedEventsQuery
      ]);

      if (personalResult.error) {
        // console.error('获取个人事件失败:', personalResult.error);
        throw personalResult.error;
      }

      if (sharedResult.error) {
        // console.error('获取分享事件失败:', sharedResult.error);
        throw sharedResult.error;
      }

      // 合并个人事件和分享事件
      const personalEvents: EventWithShares[] = (personalResult.data || []).map(event => ({
        ...event,
        is_shared: false
      }));

      // 处理分享事件数据
      let sharedEvents: EventWithShares[] = [];
      if (sharedResult.data) {
        sharedEvents = (sharedResult.data as any[])
          .filter(share => share.events) // 确保事件存在
          .map(share => ({
            ...(share.events as Event),
            is_shared: true,
            shared_families: [share.family_id]
          }));
        
        // 如果有时间过滤，在这里过滤分享事件
        if (year && month) {
          const startOfMonth = new Date(year, month - 1, 1);
          const endOfMonth = new Date(year, month, 0);
          const startTs = Math.floor(startOfMonth.getTime() / 1000);
          const endTs = Math.floor(endOfMonth.getTime() / 1000);
          
          sharedEvents = sharedEvents.filter(event => 
            event.start_ts >= startTs && event.start_ts <= endTs
          );
        }
      }

      // 去重并合并（如果同一个事件被分享到多个群组）
      const eventMap = new Map<string, EventWithShares>();
      
      personalEvents.forEach(event => {
        eventMap.set(event.id, event);
      });

      sharedEvents.forEach(event => {
        if (eventMap.has(event.id)) {
          // 如果已存在，添加到分享列表
          const existing = eventMap.get(event.id)!;
          existing.shared_families = existing.shared_families || [];
          existing.shared_families.push(...(event.shared_families || []));
          existing.is_shared = true;
        } else {
          // 新事件
          eventMap.set(event.id, event);
        }
      });

      const allEvents = Array.from(eventMap.values()).sort((a, b) => a.start_ts - b.start_ts);
      /*
      console.log('✅ 获取事件成功:', { 
        totalEvents: allEvents.length, 
        personalEvents: personalEvents.length, 
        sharedEvents: sharedEvents.length,
        events: allEvents.map(e => ({ id: e.id, title: e.title, start_ts: e.start_ts }))
      });
      */
      setEvents(allEvents);

    } catch (err) {
      // console.error('获取事件失败:', err);
      setError(err instanceof Error ? err.message : '获取事件失败');
    } finally {
      setLoading(false);
    }
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
      const { title, description, startTime, endTime, location, color, shareToFamilies, type } = eventData;

      const start_ts = Math.floor(startTime.getTime() / 1000);
      const end_ts = endTime ? Math.floor(endTime.getTime() / 1000) : null;

      const eventToInsert: Partial<EventInsert> = {
        creator_id: user.id,
        title,
        description,
        start_ts,
        end_ts,
        location,
        color,
        type,
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
      const { title, description, startTime, endTime, location, color, shareToFamilies, type } = eventData;

      const start_ts = Math.floor(startTime.getTime() / 1000);
      const end_ts = endTime ? Math.floor(endTime.getTime() / 1000) : null;

      const eventToUpdate: Partial<Event> = {
        title,
        description,
        start_ts,
        end_ts,
        location,
        color,
        type,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('events')
        .update(eventToUpdate)
        .eq('id', eventId)
        .eq('creator_id', user.id);

      if (error) {
        throw error;
      }
      
      // 更新通知 (如果需要的话)
      // ...

      // 处理分享逻辑
      if (shareToFamilies) {
        // 先删除旧的分享记录
        await supabase
          .from('event_shares')
          .delete()
          .eq('event_id', eventId);

        if (shareToFamilies.length > 0) {
          // 添加新的分享记录
          const shareData = shareToFamilies.map(familyId => ({
            event_id: eventId,
            family_id: familyId,
            shared_by: user.id,
          }));
          await supabase.from('event_shares').insert(shareData);
        }
      }

      await fetchEvents(); // 刷新事件列表

      console.log('✅ 事件更新成功:', eventId);
      return true;

    } catch (err) {
      console.error('更新事件失败:', err);
      setError(err instanceof Error ? err.message : '更新事件失败');
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
    /*
    console.log('🔍 getEventsByDate调试:', {
      inputDate: date.toISOString(),
      localDate: `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      startTs,
      endTs,
      totalEvents: events.length,
      eventsDetail: events.map(e => ({
        id: e.id,
        title: e.title,
        start_ts: e.start_ts,
        date: new Date(e.start_ts * 1000).toISOString(),
        localDate: new Date(e.start_ts * 1000).toLocaleDateString(),
        isInRange: e.start_ts >= startTs && e.start_ts <= endTs
      }))
    });
    */

    const filteredEvents = events.filter(event => 
      event.start_ts >= startTs && event.start_ts <= endTs
    );
    /*
    console.log('📅 过滤结果:', {
      matchedEvents: filteredEvents.length,
      events: filteredEvents.map(e => ({ id: e.id, title: e.title }))
    });
    */
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

  // 初始化时获取用户家庭列表
  useEffect(() => {
    if (user) {
      fetchUserFamilies();
    }
  }, [user]);

  // 当用户信息获取到后，立即获取个人事件
  useEffect(() => {
    if (user) {
      // console.log('用户登录，开始获取事件...');
      fetchEvents();
    }
  }, [user]);

  // 当家庭列表变化时，重新获取所有事件（包括群组事件和个人事件）
  useEffect(() => {
    if (user) {
      // console.log('家庭列表更新，重新获取事件...', userFamilies);
      fetchEvents();
    }
  }, [userFamilies]);

  return {
    events,
    loading,
    error,
    userFamilies,
    userFamilyDetails,
    createEvent,
    updateEvent,
    deleteEvent,
    shareEventToFamily,
    unshareEventFromFamily,
    getEventsByDate,
    getMonthEvents,
    fetchEvents,
    fetchUserFamilies,
  };
}; 