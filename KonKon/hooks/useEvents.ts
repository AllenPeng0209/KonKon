import { t } from '@/lib/i18n';
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
  const { familyMembers, activeFamily } = useFamily();
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
      name: m.user?.display_name || t('common.unknownFamily')
    })), 
    [familyMembers]
  );

  // 获取事件列表（根据模式获取相应的事件）
  const fetchEvents = useCallback(async (year?: number, month?: number) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      let allEvents: EventWithShares[] = [];

      if (!activeFamily) {
        // 无活跃家庭：不获取任何事件（这种情况应该很少见）
        allEvents = [];

      } else if (activeFamily.tag === 'personal') {
        // 個人空間模式：獲取用戶創建的所有事件（不管是否分享）
        
        // 1. 獲取用戶創建的所有事件
        const { data: userCreatedEvents, error: userEventsError } = await supabase
          .from('events')
          .select('*')
          .eq('creator_id', user.id);

        if (userEventsError) {
          console.warn('獲取用戶創建的事件失敗:', userEventsError);
        }

        if (userCreatedEvents && userCreatedEvents.length > 0) {
          // 2. 檢查這些事件是否被分享，用於標記狀態
          const eventIds = userCreatedEvents.map(e => e.id);
          const { data: sharedEvents, error: shareError } = await supabase
            .from('event_shares')
            .select('event_id')
            .in('event_id', eventIds);

          if (shareError) {
            console.warn('檢查事件分享狀態失敗:', shareError);
          }

          // 3. 包含所有用戶創建的事件，並標記是否已分享
          const sharedEventIds = new Set((sharedEvents || []).map(s => s.event_id));
          allEvents = userCreatedEvents.map(event => ({ 
            ...event, 
            is_shared: sharedEventIds.has(event.id) 
          }));
        }

      } else if (activeFamily.id === 'meta-space') {
        // 元空間模式：獲取所有空間的事件

        // 1. 获取用户创建的个人事件（未分享的）
        const { data: userCreatedEvents, error: userEventsError } = await supabase
          .from('events')
          .select('*')
          .eq('creator_id', user.id);

        if (userCreatedEvents && !userEventsError && userCreatedEvents.length > 0) {
          // 檢查哪些事件沒有被分享
          const eventIds = userCreatedEvents.map(e => e.id);
          const { data: sharedEvents, error: shareError } = await supabase
            .from('event_shares')
            .select('event_id')
            .in('event_id', eventIds);

          if (!shareError) {
            const sharedEventIds = new Set((sharedEvents || []).map(s => s.event_id));
            const privateEvents = userCreatedEvents.filter(event => !sharedEventIds.has(event.id));
            allEvents.push(...privateEvents.map(event => ({ ...event, is_shared: false })));
          }
        }

        // 2. 获取用户参与的所有家庭中的直接家庭事件
        const userFamilyIds = userFamilies;
        if (userFamilyIds.length > 0) {
          const { data: directFamilyEvents, error: directFamilyError } = await supabase
            .from('events')
            .select('*')
            .in('family_id', userFamilyIds);

          if (directFamilyEvents && !directFamilyError) {
            allEvents.push(...directFamilyEvents.map(event => ({ ...event, is_shared: true })));
          }
        }

        // 3. 获取通过 event_shares 分享给用户家庭的事件
        if (userFamilyIds.length > 0) {
          const { data: familySharedEvents, error: familyError } = await supabase
            .from('event_shares')
            .select(`
              event_id,
              family_id,
              events (
                *
              )
            `)
            .in('family_id', userFamilyIds);

          if (familySharedEvents && !familyError) {
            const sharedEvents = familySharedEvents
              .filter(share => share.events)
              .map(share => ({ ...share.events, is_shared: true, shared_family_id: share.family_id }));
            allEvents.push(...sharedEvents);
          }
        }

        // 4. 获取用户参与的事件（通过 event_attendees 表）
        const { data: attendeeEvents, error: attendeeError } = await supabase
          .from('event_attendees')
          .select(`
            event_id,
            events (
              *
            )
          `)
          .eq('user_id', user.id);

        if (attendeeEvents && !attendeeError) {
          const attendeeEventsList = attendeeEvents
            .filter(att => att.events)
            .map(att => ({ ...att.events, is_shared: true }));
          allEvents.push(...attendeeEventsList);
        }

      } else {
        // 家庭模式：只获取分享给当前激活家庭的事件

        const { data: sharedResult, error: sharedError } = await supabase
          .from('event_shares')
          .select(`
            event_id,
            events (
              *
            )
          `)
          .eq('family_id', activeFamily.id);
        
        if (sharedError) throw sharedError;

        // 只保留群組共享事件
        allEvents = [
          ...(sharedResult || [])
            .filter(share => share.events)
            .map(share => ({ ...share.events, is_shared: true }))
        ];
      }

      // 去重
      const eventMap = new Map<string, EventWithShares>();
      allEvents.forEach(event => {
        const existing = eventMap.get(event.id);
        if (existing) {
          existing.is_shared = existing.is_shared || event.is_shared;
        } else {
          eventMap.set(event.id, event);
        }
      });

      const finalEvents = Array.from(eventMap.values()).sort((a, b) => a.start_ts - b.start_ts);

      // 获取所有事件的参与人信息
      if (finalEvents.length > 0) {
        const eventIds = finalEvents.map(e => e.id);
        
        // 🐛 DEBUG: 添加調試日誌
        console.log('🔍 [useEvents] 查詢參與者信息:', {
          eventIds,
          user: user?.id,
          userEmail: user?.email,
          eventCount: finalEvents.length
        });
        
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

        // 🐛 DEBUG: 記錄查詢結果
        console.log('📊 [useEvents] 參與者查詢結果:', {
          attendeesData: attendeesData?.length || 0,
          attendeesError,
          sampleData: attendeesData?.slice(0, 3) // 只顯示前3條
        });

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
            
            // 🐛 DEBUG: 記錄每個事件的參與者數量
            if (event.title.includes('按摩')) {
              console.log(`👥 [useEvents] 事件 "${event.title}" (${event.id}) 參與者:`, {
                count: event.attendees.length,
                attendees: event.attendees.map(a => ({ name: a.user?.display_name, status: a.status }))
              });
            }
          });
          
          // 🐛 DEBUG: 記錄總體統計
          const eventsWithAttendees = finalEvents.filter(e => e.attendees && e.attendees.length > 0);
          console.log('📈 [useEvents] 參與者統計:', {
            totalEvents: finalEvents.length,
            eventsWithAttendees: eventsWithAttendees.length,
            attendeesMapSize: attendeesMap.size
          });
        } else if (attendeesError) {
          console.error('❌ [useEvents] 查詢參與者失敗:', attendeesError);
        }
      }

      // 生成重复事件实例
      const expandedEvents = await expandRecurringEvents(finalEvents, year, month);

      setEvents(expandedEvents);

    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadingEventsFailed'));
    } finally {
      setLoading(false);
    }
  }, [user, activeFamily, userFamilies]);

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
      // 查看特定月份时 - 擴展範圍以包含跨月事件
      viewStartDate = new Date(year, month - 1, 1); // 当前月第一天
      viewEndDate = new Date(year, month, 0); // 当前月最后一天
      
      // 🚀 修復：擴展視圖範圍，包含前後各7天以捕獲跨月事件
      const extendedViewStartDate = new Date(viewStartDate);
      extendedViewStartDate.setDate(extendedViewStartDate.getDate() - 7);
      const extendedViewEndDate = new Date(viewEndDate);
      extendedViewEndDate.setDate(extendedViewEndDate.getDate() + 7);
      
      // 为了生成重复事件，需要更宽的时间范围
      startDate = new Date(2025, 0, 1); // 从2025年1月1日开始，确保包含所有重复事件
      endDate = new Date(year, month + 2, 0); // 扩展到未来3个月用于计算重复
      
      // 使用擴展後的範圍進行事件過濾
      viewStartDate = extendedViewStartDate;
      viewEndDate = extendedViewEndDate;
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
      setError(t('errors.userNotLoggedIn'));
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
        // 移除重复的family_id设置，统一使用event_shares表
      };

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
      
      // 🚀 支持真正的多家庭共享机制 - 過濾掉無效的 family_id
      if (shareToFamilies && shareToFamilies.length > 0) {
        // 過濾掉 "meta-space" 和其他無效的 UUID
        const validFamilyIds = shareToFamilies.filter(familyId => {
          // 檢查是否為有效的 UUID 格式
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return familyId && familyId !== 'meta-space' && uuidRegex.test(familyId);
        });

        if (validFamilyIds.length > 0) {
          // 为每个选择的家庭创建共享记录
          const shareData = validFamilyIds.map(familyId => ({
            event_id: newEvent.id,
            family_id: familyId,
            shared_by: user.id
          }));

          const { error: shareError } = await supabase
            .from('event_shares')
            .insert(shareData);
          
          if (shareError) {
            console.error('分享事件失败:', shareError);
            // 即使分享失败，事件本身已创建，可以考虑回滚或提示
          }
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
      // 获取要删除的事件信息（用于通知）
      const { data: eventToDelete, error: fetchError } = await supabase
        .from('events')
        .select(`
          id, title, creator_id,
          event_shares!inner(family_id),
          creator:users(display_name)
        `)
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('获取事件信息失败:', fetchError);
      }

      // 首先删除相关的分享记录
      await supabase.from('event_shares').delete().eq('event_id', eventId);
      
      // 然后删除事件本身
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;

      await cancelNotificationForEvent(eventId);

      // 🚀 发送删除通知给家庭成员
      if (eventToDelete && eventToDelete.event_shares.length > 0) {
        try {
          // 动态导入通知服务以避免循环依赖
          const { notifyEventDeleted } = await import('../lib/notificationService');
          
          const creatorName = eventToDelete.creator?.display_name || '未知用户';
          
          // 为每个共享的家庭发送通知
          for (const share of eventToDelete.event_shares) {
            await notifyEventDeleted(
              share.family_id,
              eventToDelete.title,
              [], // attendeeIds - 删除时不需要具体参与者
              creatorName
            );
          }
        } catch (notifyError) {
          console.error('发送删除通知失败:', notifyError);
          // 不影响删除操作的成功
        }
      }

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
      setError(t('errors.userNotLoggedIn'));
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
        .select('id, creator_id, title, recurrence_rule')
        .eq('id', eventId)
        .single();

      if (checkError || !existingEvent) {
        throw new Error(t('errors.eventNotAccessible'));
      }

      // 檢查用戶權限：是創建者或有共享權限
      if (existingEvent.creator_id !== user.id) {
        // 暫時允許更新，後續可以添加更複雜的權限檢查
      }

      // 🚀 乐观更新：先更新本地状态，提升用户体验
      const wasRecurring = existingEvent.recurrence_rule !== null;
      const willBeRecurring = eventToUpdate.recurrence_rule !== null;
      
      // 如果重复状态发生变化，清除缓存强制重新展开
      if (wasRecurring !== willBeRecurring) {
        setLastExpandKey(''); // 清除缓存
      }

      // 立即更新 UI（乐观更新）
      setEvents(prev => {
        let updated = prev.map(event => {
          if (event.id === eventId || 
              (event.parent_event_id === eventId) || 
              (event.id.startsWith(eventId + '_'))) {
            
            // 🚀 計算新的分享狀態
            let newIsShared = event.is_shared;
            let newSharedFamilies = event.shared_families;
            
            if (Array.isArray(shareToFamilies)) {
              // 如果有分享更新，計算新的分享狀態（包括空數組，表示清除分享）
              const validFamilyIds = shareToFamilies.filter(familyId => {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return familyId && familyId !== 'meta-space' && uuidRegex.test(familyId);
              });
              
              newIsShared = validFamilyIds.length > 0;
              newSharedFamilies = validFamilyIds;
            }
            
            return {
              ...event,
              title: eventToUpdate.title || event.title,
              description: eventToUpdate.description || event.description,
              start_ts: eventToUpdate.start_ts || event.start_ts,
              end_ts: eventToUpdate.end_ts || event.end_ts,
              color: eventToUpdate.color || event.color,
              image_urls: eventToUpdate.image_urls !== undefined ? eventToUpdate.image_urls : event.image_urls,
              recurrence_rule: eventToUpdate.recurrence_rule !== undefined ? eventToUpdate.recurrence_rule : event.recurrence_rule,
              updated_at: eventToUpdate.updated_at || event.updated_at,
              // 🚀 更新分享狀態
              is_shared: newIsShared,
              shared_families: newSharedFamilies,
            };
          }
          return event;
        });

        // 🔥 特殊处理：如果从重复事件改为单次事件，移除所有实例，只保留主事件
        if (wasRecurring && !willBeRecurring) {
          updated = updated.filter(event => {
            // 保留主事件（ID 完全匹配）
            if (event.id === eventId) {
              return true;
            }
            // 移除所有这个重复系列的实例
            if (event.parent_event_id === eventId || event.id.startsWith(eventId + '_')) {
              return false;
            }
            return true;
          });
        }

        return updated;
      });

      // 后台异步更新数据库
      const { data: updateData, error } = await supabase
        .from('events')
        .update(eventToUpdate)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        // 如果数据库更新失败，恢复原始状态
        setEvents(prev => prev.map(event => {
          if (event.id === eventId) {
            return { ...event, ...existingEvent };
          }
          return event;
        }));
        throw error;
      }

      if (!updateData) {
        throw new Error(t('errors.noDataReturned'));
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

      // 🚀 更新分享關係
      if (Array.isArray(shareToFamilies)) {
                // 更新事件分享關係
        
        // 先刪除現有的分享關係（刪除該事件的所有分享記錄）
        const { data: deletedShares, error: deleteError } = await supabase
          .from('event_shares')
          .delete()
          .eq('event_id', eventId)
          .select();
          
        if (deleteError) {
          console.error('❌ 刪除現有分享關係失敗:', deleteError);
          
          // 🔄 如果用戶想設置為私人事件但刪除失敗，嘗試替代方案
          if (!shareToFamilies || shareToFamilies.length === 0) {
                      // 刪除分享關係失敗，可能是權限問題
            
            // 設置錯誤信息給用戶
            setError(t('errors.cannotSetPrivate'));
            return false;
          }
        } else {
          console.log('✅ 已清除事件的所有分享關係:', { 
            deletedCount: deletedShares?.length || 0,
            deletedShares 
          });
        }

        // 如果有新的分享家庭，添加分享記錄 - 過濾無效的 family_id
        if (shareToFamilies && shareToFamilies.length > 0) {
          // 準備添加新的分享記錄
          
          // 過濾掉 "meta-space" 和其他無效的 UUID
          const validFamilyIds = shareToFamilies.filter(familyId => {
            // 檢查是否為有效的 UUID 格式
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const isValid = familyId && familyId !== 'meta-space' && uuidRegex.test(familyId);
            // 驗證家庭ID格式
            return isValid;
          });

          // 過濾後的有效家庭ID

          if (validFamilyIds.length > 0) {
            // 🔍 檢查現有分享記錄，避免重複插入
            const { data: existingShares, error: checkError } = await supabase
              .from('event_shares')
              .select('family_id')
              .eq('event_id', eventId)
              .in('family_id', validFamilyIds);

            if (checkError) {
              console.error('❌ 檢查現有分享記錄失敗:', checkError);
            }

            const existingFamilyIds = new Set((existingShares || []).map(s => s.family_id));
            const newFamilyIds = validFamilyIds.filter(familyId => !existingFamilyIds.has(familyId));

            console.log('🔄 分享記錄狀態檢查:', {
              existing: Array.from(existingFamilyIds),
              new: newFamilyIds,
              needsInsert: newFamilyIds.length > 0
            });

            if (newFamilyIds.length > 0) {
              const shareData = newFamilyIds.map(familyId => ({
                event_id: eventId,
                family_id: familyId,
                shared_by: user.id
              }));

              // 嘗試插入新分享記錄

              const { data: insertedShares, error: shareError } = await supabase
                .from('event_shares')
                .insert(shareData)
                .select();

              if (shareError) {
                console.error('❌ 插入分享關係失敗:', shareError);
                // 不拋出錯誤，只記錄，避免影響主要更新
              } else {
                // 分享關係插入成功
              }
            } else {
              // 所有分享記錄已存在，跳過插入
            }
          } else {
            // 沒有有效的家庭ID，跳過分享記錄插入
          }
        } else {
          // 設置為私人事件，不添加分享記錄
        }
      }

      // 🚀 发送更新通知给家庭成员
      try {
        // 动态导入通知服务以避免循环依赖
        const { notifyEventUpdated } = await import('../lib/notificationService');
        
        // 获取用户信息
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const updaterName = currentUser?.user_metadata?.display_name || 
                           currentUser?.user_metadata?.full_name || 
                           currentUser?.email || 
                           '未知用户';
        
        // 为每个共享的家庭发送通知
        if (Array.isArray(shareToFamilies)) {
          const familiesToNotify = shareToFamilies.filter(id => {
            // 检查是否为有效的 UUID 格式
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return id && id !== 'meta-space' && uuidRegex.test(id);
          });
          for (const familyId of familiesToNotify) {
            await notifyEventUpdated(
              familyId,
              title,
              eventId,
              attendees || [], // 参与者列表
              updaterName
            );
          }
        }
      } catch (notifyError) {
        console.error('发送更新通知失败:', notifyError);
        // 不影响更新操作的成功
      }

      // 🔄 異步重新獲取事件數據以確保數據一致性
      setTimeout(async () => {
        try {
          console.log('🔄 開始後台數據刷新:', { 
            eventId, 
            wasRecurring, 
            willBeRecurring,
            shareToFamiliesUpdated: Array.isArray(shareToFamilies),
            shareToFamiliesValue: shareToFamilies
          });
          
          const currentDate = new Date();
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth() + 1;
          
          // 如果重複狀態發生變化，需要重新獲取並展開事件
          if (wasRecurring !== willBeRecurring) {
            console.log('🔄 重複狀態變化，清除緩存');
            setLastExpandKey(''); // 清除緩存強制重新展開
          }
          
          // 重新获取数据以確保分享狀態準確
          console.log('🔄 重新獲取事件數據...');
          await fetchEvents(year, month);
          console.log('✅ 後台數據刷新完成');
        } catch (error) {
          console.error('❌ 後台數據刷新失敗:', error);
        }
      }, 500); // 延長等待時間確保數據庫操作完成

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
      setError(t('errors.userNotLoggedIn'));
      return false;
    }

    // 避免分享到虛擬的元空間
    if (familyId === 'meta-space') {
              setError(t('space.cannotShareToMetaSpace'));
      return false;
    }

    // 檢查是否為有效的 UUID 格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(familyId)) {
      setError(t('errors.invalidFamilyId'));
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
      setError(t('errors.userNotLoggedIn'));
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

  // 強制刷新事件（解決跨月事件顯示問題）
  const forceRefreshEvents = useCallback(async () => {
    // 清除緩存
    setLastExpandKey('');
    
    // 重新獲取當前月份和下個月的事件
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // 強制刷新事件，清除緩存並重新獲取
    await fetchEvents(currentYear, currentMonth);
  }, [fetchEvents]);

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

  // 当激活家庭变化时，重新获取群组事件
  useEffect(() => {
    if (user && activeFamily) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      fetchEvents(currentYear, currentMonth);
    }
  }, [user, activeFamily, fetchEvents]);

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
    forceRefreshEvents, // 🚀 新增：強制刷新事件
  };
}; 