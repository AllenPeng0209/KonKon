import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { BailianMessage, sendBailianMessage } from '@/lib/bailian';
import {
    UIFamilyChatMessage,
    getFamilyChatHistory,
    saveFamilyChatSession,
    sendFamilyChatMessage,
    subscribeFamilyChatMessages
} from '@/lib/familyChat';
import {
    FamilyChatCache,
    addMessageToCache,
    getCacheConfig,
    isCacheExpired,
    loadFamilyChatCache,
    mergeHistoryToCache,
    saveFamilyChatCache
} from '@/lib/familyChatCache';
import { getCurrentLocation } from '@/lib/location';
import { nanoid } from '@/lib/nanoid';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';
import { useEvents } from './useEvents';

export function useFamilyChat() {
  const { user } = useAuth();
  const { activeFamily, familyMembers } = useFamily();
  const { events } = useEvents();
  
  const [messages, setMessages] = useState<UIFamilyChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentCache, setCurrentCache] = useState<FamilyChatCache | null>(null);
  const [currentUserDetails, setCurrentUserDetails] = useState<{display_name: string; avatar_url: string | null} | null>(null);

  // 获取当前用户详情（缓存）
  useEffect(() => {
    const fetchCurrentUserDetails = async () => {
      if (!user) {
        setCurrentUserDetails(null);
        return;
      }

      try {
        const { data: userDetails } = await supabase
          .from('users')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (userDetails) {
          setCurrentUserDetails(userDetails);
        }
      } catch (error) {
        console.warn('获取用户详情失败:', error);
        // 从家庭成员信息中查找当前用户
        const currentMember = familyMembers.find(m => m.user_id === user.id);
        if (currentMember?.user) {
          setCurrentUserDetails({
            display_name: currentMember.user.display_name,
            avatar_url: currentMember.user.avatar_url || null
          });
        }
      }
    };

    fetchCurrentUserDetails();
  }, [user, familyMembers]);

  // 加载聊天历史（優先使用緩存）
  const loadChatHistory = useCallback(async () => {
    if (!activeFamily) return;

    try {
      setIsLoadingHistory(true);
      const config = getCacheConfig();
      
      // 1. 先嘗試加載緩存
      const cache = await loadFamilyChatCache(activeFamily.id);
      
      if (cache && !isCacheExpired(cache)) {
        // 使用緩存數據，立即顯示
        console.log('[FamilyChat] 使用緩存數據');
        setMessages(cache.messages);
        setCurrentCache(cache);
        setHasMoreMessages(cache.hasMoreMessages);
        setIsLoadingHistory(false);
        
        // 在背景更新最新消息
        try {
          const latestMessages = await getFamilyChatHistory({
            family_id: activeFamily.id,
            limit: config.minCacheMessages
          });
          
          // 檢查是否有新消息
          const cacheLatestId = cache.messages.length > 0 ? cache.messages[cache.messages.length - 1].id : null;
          const serverLatestId = latestMessages.length > 0 ? latestMessages[latestMessages.length - 1].id : null;
          
          if (cacheLatestId !== serverLatestId) {
            console.log('[FamilyChat] 檢測到新消息，更新緩存');
            setMessages(latestMessages);
            const updatedCache = { ...cache, messages: latestMessages, lastUpdated: Date.now() };
            setCurrentCache(updatedCache);
            await saveFamilyChatCache(activeFamily.id, latestMessages, cache.hasMoreMessages);
          }
        } catch (error) {
          console.warn('[FamilyChat] 背景更新失敗:', error);
        }
        
        return;
      }
      
      // 2. 沒有有效緩存，從服務器加載
      console.log('[FamilyChat] 從服務器加載聊天歷史');
      const history = await getFamilyChatHistory({
        family_id: activeFamily.id,
        limit: config.minCacheMessages
      });
      
      setMessages(history);
      setHasMoreMessages(history.length >= config.minCacheMessages);
      
      // 保存到緩存
      const newCache: FamilyChatCache = {
        familyId: activeFamily.id,
        messages: history,
        lastUpdated: Date.now(),
        hasMoreMessages: history.length >= config.minCacheMessages,
        oldestMessageId: history.length > 0 ? history[0].id : undefined,
      };
      
      setCurrentCache(newCache);
      await saveFamilyChatCache(activeFamily.id, history, newCache.hasMoreMessages);
      
    } catch (error) {
      console.error('[FamilyChat] 加载聊天历史失败:', error);
      setMessages([]);
      setHasMoreMessages(false);
      setCurrentCache(null);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeFamily]);

  // 加載更多歷史消息（分頁）
  const loadMoreMessages = useCallback(async () => {
    if (!activeFamily || !currentCache || !hasMoreMessages || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const config = getCacheConfig();
      
      console.log('[FamilyChat] 加載更多歷史消息');
      
      // 使用最舊消息的ID作為分頁參數
      const olderMessages = await getFamilyChatHistory({
        family_id: activeFamily.id,
        limit: config.paginationSize,
        before: currentCache.oldestMessageId
      });
      
      if (olderMessages.length === 0) {
        // 沒有更多消息了
        setHasMoreMessages(false);
        const updatedCache = { ...currentCache, hasMoreMessages: false };
        setCurrentCache(updatedCache);
        await saveFamilyChatCache(activeFamily.id, updatedCache.messages, false);
        return;
      }
      
      // 合併到現有消息中
      const updatedCache = mergeHistoryToCache(currentCache, olderMessages, olderMessages.length >= config.paginationSize);
      
      setMessages(updatedCache.messages);
      setCurrentCache(updatedCache);
      setHasMoreMessages(updatedCache.hasMoreMessages);
      
      // 異步保存緩存
      saveFamilyChatCache(activeFamily.id, updatedCache.messages, updatedCache.hasMoreMessages)
        .catch(err => console.warn('[FamilyChat] 保存緩存失敗:', err));
      
      console.log(`[FamilyChat] 加載了 ${olderMessages.length} 條更多消息`);
      
    } catch (error) {
      console.error('[FamilyChat] 加載更多消息失敗:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeFamily, currentCache, hasMoreMessages, isLoadingMore]);

  // 格式化事件数据为可读文本
  const formatEventsForAI = useCallback(() => {
    // 特殊處理元空間：元空間是純粹的個人AI對話空間，不包含任何日程信息
    if (activeFamily?.id === 'meta-space') {
      return "";
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // 获取今天到下周的事件
    const recentEvents = events.filter(event => {
      const eventDate = new Date(event.start_ts * 1000);
      return eventDate >= today && eventDate <= nextWeek;
    });

    if (recentEvents.length === 0) {
      return "目前家庭日历中近期没有安排的事件。";
    }

    let eventsText = "【家庭日历近期安排】\n";
    
    recentEvents.forEach(event => {
      const eventDate = new Date(event.start_ts * 1000);
      const dateStr = eventDate.toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
      const timeStr = eventDate.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      eventsText += `• ${dateStr} ${timeStr} - ${event.title}`;
      if (event.description) {
        eventsText += ` (${event.description})`;
      }
      if (event.location) {
        eventsText += ` @${event.location}`;
      }
      if (event.family_id) {
        eventsText += ` [家庭共享]`;
      }
      eventsText += "\n";
    });

    return eventsText;
  }, [events, activeFamily]);

  // 格式化家庭信息
  const formatFamilyInfoForAI = useCallback(() => {
    if (!activeFamily) {
      return "用户暂未加入任何家庭群组。";
    }

    // 特殊處理元空間：元空間是純粹的個人AI對話空間，不包含家庭信息
    if (activeFamily.id === 'meta-space') {
      return "这是你的个人AI助手对话空间。";
    }

    let familyText = `【家庭信息】\n`;
    familyText += `家庭名称：${activeFamily.name}\n`;
    familyText += `家庭成员：${familyMembers.length}人\n`;
    
    if (familyMembers.length > 0) {
      familyText += "成员列表：";
      familyMembers.forEach((member, index) => {
        const memberName = member.user?.display_name || member.user?.email || '未知成员';
        familyText += index === 0 ? memberName : `、${memberName}`;
      });
      familyText += "\n";
    }

    return familyText;
  }, [activeFamily, familyMembers]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!activeFamily || !user || isLoading) return;

    // 立即在UI中显示用户消息，使用缓存的用户信息
    const userMessage: UIFamilyChatMessage = {
      id: nanoid(),
      type: 'user',
      content,
      user_id: user.id,
      user_name: currentUserDetails?.display_name || user.email?.split('@')[0] || '我',
      user_avatar: currentUserDetails?.avatar_url,
      created_at: new Date().toISOString(),
    };

    const loadingMessage: UIFamilyChatMessage = {
      id: nanoid(),
      type: 'assistant',
      content: '正在思考中...',
      user_id: 'assistant',
      user_name: '喵萌助手',
      created_at: new Date().toISOString(),
      isLoading: true,
    };

    // 立即更新UI和緩存
    setMessages(prev => {
      const updatedMessages = [...prev, userMessage, loadingMessage];
      
      // 更新緩存
      if (currentCache) {
        let tempCache = addMessageToCache(currentCache, userMessage);
        tempCache = addMessageToCache(tempCache, loadingMessage);
        setCurrentCache(tempCache);
      }
      
      return updatedMessages;
    });
    setIsLoading(true);

    try {
      // 1. 异步保存用户消息到数据库（元空間不保存到資料庫）
      if (activeFamily.id !== 'meta-space') {
        sendFamilyChatMessage({
          family_id: activeFamily.id,
          content,
          message_type: 'user'
        }).catch(err => console.error('保存用户消息失败:', err));
      }

      // 2. 并行准备AI响应数据（无需等待定位完成）
      const locationPromise = getCurrentLocation().catch(() => null);
      
      // 预构建基本信息（快速执行）
      const eventsInfo = formatEventsForAI();
      const familyInfo = formatFamilyInfoForAI();
      
      // 简化聊天历史构建（只取最近10条消息，减少处理时间）
      const recentMessages = messages.slice(-10);
      
      // 根據空間類型設定不同的系統提示詞
      const systemPrompt = activeFamily.id === 'meta-space' 
        ? `你是個人AI助手"喵萌"，專門為個人用戶提供貼心服務。你是用戶的私人助手，可以協助解答各種問題、提供建議和進行日常對話。

特點：友善親切，樂於助人，擅長傾聽和理解用戶需求。這是你與用戶的私人對話空間。`
        : `你是家庭智能助理"喵萌"，专门为家庭群组提供贴心服务。你能看到家庭的日历安排和成员信息，请基于这些数据给出智能建议。

${familyInfo}

${eventsInfo}

特点：卖萌可爱，讲话简洁温馨，擅长分析家庭日程，关注家庭成员的协调。这是家庭群聊，可能有多个成员参与对话。`;
      
      const baseHistory: BailianMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...recentMessages
          .filter(msg => msg.content.trim() !== '' && !msg.isLoading)
          .map((msg) => ({
            role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content,
          })),
        {
          role: 'user',
          content,
        },
      ];

      // 3. 并行处理：获取AI响应的同时等待定位
      const [assistantResponse, location] = await Promise.all([
        sendBailianMessage(baseHistory),
        locationPromise
      ]);

      // 如果有定位信息，可以在后续对话中使用（不阻塞当前响应）
      if (location) {
        console.log('用户定位已获取，下次对话将包含位置信息');
      }

      // 4. 立即更新UI中的AI响应
      const finalAssistantMessage: UIFamilyChatMessage = {
        id: loadingMessage.id, // 使用相同ID替换加载消息
        type: 'assistant',
        content: assistantResponse,
        user_id: 'assistant',
        user_name: '喵萌助手',
        created_at: new Date().toISOString(),
      };

      // 立即更新UI和緩存
      setMessages(prev => 
        prev.map(msg => msg.id === loadingMessage.id ? finalAssistantMessage : msg)
      );

      // 更新緩存
      if (currentCache) {
        const updatedCache = {
          ...currentCache,
          messages: currentCache.messages.map(msg => 
            msg.id === loadingMessage.id ? finalAssistantMessage : msg
          ),
          lastUpdated: Date.now()
        };
        setCurrentCache(updatedCache);
        
        // 異步保存緩存
        saveFamilyChatCache(activeFamily.id, updatedCache.messages, updatedCache.hasMoreMessages)
          .catch(err => console.warn('[FamilyChat] 保存緩存失敗:', err));
      }

      // 5. 异步保存AI响应到数据库（不阻塞UI，元空間不保存到資料庫）
      if (activeFamily.id !== 'meta-space') {
        sendFamilyChatMessage({
          family_id: activeFamily.id,
          content: assistantResponse,
          message_type: 'assistant'
        }).catch(err => console.error('保存AI响应失败:', err));
      }

    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 立即更新UI显示错误
      const errorMessage: UIFamilyChatMessage = {
        id: loadingMessage.id,
        type: 'assistant',
        content: '抱歉，我遇到了一些问题，请稍后再试。',
        user_id: 'assistant',
        user_name: '喵萌助手',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => 
        prev.map(msg => msg.id === loadingMessage.id ? errorMessage : msg)
      );

      // 更新緩存
      if (currentCache) {
        const updatedCache = {
          ...currentCache,
          messages: currentCache.messages.map(msg => 
            msg.id === loadingMessage.id ? errorMessage : msg
          ),
          lastUpdated: Date.now()
        };
        setCurrentCache(updatedCache);
      }

      // 异步保存错误信息（元空間不保存到資料庫）
      if (activeFamily.id !== 'meta-space') {
        sendFamilyChatMessage({
          family_id: activeFamily.id,
          content: '抱歉，我遇到了一些问题，请稍后再试。',
          message_type: 'assistant',
          metadata: { error: true }
        }).catch(err => console.error('保存错误消息失败:', err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeFamily, user, isLoading, formatEventsForAI, formatFamilyInfoForAI, currentUserDetails]);

  // 保存聊天会话
  const saveChatSession = useCallback(async () => {
    if (!activeFamily || messages.length === 0 || activeFamily.id === 'meta-space') return;

    try {
      await saveFamilyChatSession(activeFamily.id, messages);
    } catch (error) {
      console.error('保存聊天会话失败:', error);
    }
  }, [activeFamily, messages]);

  // 清空聊天记录
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // 切换家庭时重新加载历史记录
  useEffect(() => {
    if (activeFamily) {
      loadChatHistory();
    } else {
      setMessages([]);
    }
  }, [activeFamily, loadChatHistory]);

  // 实时订阅消息更新
  useEffect(() => {
    if (!activeFamily) return;

    const channel = subscribeFamilyChatMessages(
      activeFamily.id,
      (newMessage) => {
        setMessages(prev => {
          // 避免重复添加消息
          if (prev.find(msg => msg.id === newMessage.id)) {
            return prev;
          }
          
          const updatedMessages = [...prev, newMessage];
          
          // 更新緩存
          if (currentCache) {
            const updatedCache = addMessageToCache(currentCache, newMessage);
            setCurrentCache(updatedCache);
            
            // 異步保存緩存
            saveFamilyChatCache(activeFamily.id, updatedCache.messages, updatedCache.hasMoreMessages)
              .catch(err => console.warn('[FamilyChat] 實時更新緩存失敗:', err));
          }
          
          return updatedMessages;
        });
      },
      (messageId) => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        // 同時從緩存中移除
        if (currentCache) {
          const updatedCache = {
            ...currentCache,
            messages: currentCache.messages.filter(msg => msg.id !== messageId),
            lastUpdated: Date.now()
          };
          setCurrentCache(updatedCache);
        }
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [activeFamily]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    isLoadingMore,
    hasMoreMessages,
    sendMessage,
    loadMoreMessages,
    clearChat,
    saveChatSession,
    hasFamily: !!activeFamily,
    familyName: activeFamily?.name,
    memberCount: familyMembers.length,
  };
} 