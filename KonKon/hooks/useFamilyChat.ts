import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { BailianMessage, sendBailianMessage } from '@/lib/bailian';
import {
  UIFamilyChatMessage,
  getAssistantDisplayName,
  getFamilyAssistantId,
  getFamilyChatHistory,
  isAssistantMessage,
  saveFamilyChatSession,
  sendFamilyChatMessage,
  subscribeFamilyChatMessages
} from '@/lib/familyChat';
import {
  FamilyChatCache,
  addMessageToCache,
  clearFamilyChatCache,
  getCacheConfig,
  isCacheExpired,
  loadFamilyChatCache,
  mergeHistoryToCache,
  saveFamilyChatCache
} from '@/lib/familyChatCache';
import { getCurrentLocation } from '@/lib/location';
import { nanoid } from '@/lib/nanoid';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useEvents } from './useEvents';

// 全局發送鎖，防止開發環境重複發送
const globalSendLock = new Map<string, number>();
const SEND_DEBOUNCE_TIME = 2000; // 增加到2秒，特別針對模擬器

// 全局消息追蹤，防止相同消息被處理多次
const processedMessages = new Set<string>();

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

  // 添加訂閱狀態追蹤
  const subscriptionRef = useRef<any>(null);
  const currentFamilyIdRef = useRef<string | null>(null);
  const isSubscribingRef = useRef<boolean>(false);

  // 防抖計時器
  const subscriptionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentMessageRef = useRef<{ content: string; timestamp: number } | null>(null);

  // 開發環境檢測
  const isDevelopment = __DEV__;
  const isSimulator = Platform.OS === 'ios' && !Platform.isTV;

  console.log(`[useFamilyChat] 環境檢測: 開發模式=${isDevelopment}, 模擬器=${isSimulator}`);

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
      
      // 檢查緩存是否包含錯誤的消息類型數據（臨時修復）
      const hasIncorrectData = cache && cache.messages.some(msg => 
        msg.user_id === 'assistant' && msg.type === 'user'
      );
      
      if (hasIncorrectData) {
        console.log('[FamilyChat] 檢測到錯誤的緩存數據，清除並重新加載');
        await clearFamilyChatCache(activeFamily.id);
        // 強制從服務器重新加載
        const history = await getFamilyChatHistory(
          activeFamily.id,
          config.minCacheMessages
        );
        
        setMessages(history);
        setHasMoreMessages(history.length >= config.minCacheMessages);
        
        // 保存正確的數據到緩存
        const newCache: FamilyChatCache = {
          familyId: activeFamily.id,
          messages: history,
          lastUpdated: Date.now(),
          hasMoreMessages: history.length >= config.minCacheMessages,
          oldestMessageId: history.length > 0 ? history[0].id : undefined,
        };
        
        setCurrentCache(newCache);
        await saveFamilyChatCache(activeFamily.id, history, newCache.hasMoreMessages);
        return;
      }
      
      if (cache && !isCacheExpired(cache)) {
        // 使用緩存數據，立即顯示
        console.log('[FamilyChat] 使用緩存數據');
        setMessages(cache.messages);
        setCurrentCache(cache);
        setHasMoreMessages(cache.hasMoreMessages);
        setIsLoadingHistory(false);
        
        // 在背景更新最新消息
        try {
          const latestMessages = await getFamilyChatHistory(
            activeFamily.id,
            config.minCacheMessages
          );
          
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
      const history = await getFamilyChatHistory(
        activeFamily.id,
        config.minCacheMessages
      );
      
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
      const olderMessages = await getFamilyChatHistory(
        activeFamily.id,
        config.paginationSize,
        currentCache.oldestMessageId
      );
      
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

  // 发送消息 - 添加防重複發送機制
  const sendMessage = useCallback(async (content: string) => {
    if (!activeFamily || !user || isLoading) return;

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // 生成唯一的消息處理ID
    const messageProcessId = `${activeFamily.id}_${user.id}_${trimmedContent}_${Date.now()}`;
    
    // 檢查是否已經在處理這條消息
    if (processedMessages.has(messageProcessId)) {
      console.log(`[useFamilyChat] 🚫 消息正在處理中，跳過: ${trimmedContent}`);
      return;
    }
    
    // 添加到處理中列表
    processedMessages.add(messageProcessId);
    console.log(`[useFamilyChat] 🔄 開始處理消息: ${messageProcessId}`);

    // 為開發環境和模擬器添加額外的全局鎖
    const globalKey = `${activeFamily.id}_${user.id}_${trimmedContent}`;
    const now = Date.now();
    
    if (isDevelopment || isSimulator) {
      const lastSendTime = globalSendLock.get(globalKey) || 0;
      if (now - lastSendTime < SEND_DEBOUNCE_TIME) {
        console.log(`[useFamilyChat] 🚫 開發環境防重複發送: ${trimmedContent} (距上次發送${now - lastSendTime}ms)`);
        processedMessages.delete(messageProcessId); // 清理追蹤
        return;
      }
      globalSendLock.set(globalKey, now);
      
      // 清理過期的鎖
      if (globalSendLock.size > 100) {
        for (const [key, timestamp] of globalSendLock.entries()) {
          if (now - timestamp > SEND_DEBOUNCE_TIME * 2) {
            globalSendLock.delete(key);
          }
        }
      }
    }

    // 防止重複發送相同內容的消息（1秒內）
    if (lastSentMessageRef.current && 
        lastSentMessageRef.current.content === trimmedContent && 
        now - lastSentMessageRef.current.timestamp < 1000) {
      console.log('[useFamilyChat] 防止重複發送相同消息:', trimmedContent);
      processedMessages.delete(messageProcessId); // 清理追蹤
      return;
    }

    // 清除之前的發送計時器
    if (sendMessageTimeoutRef.current) {
      clearTimeout(sendMessageTimeoutRef.current);
    }

    // 記錄本次發送
    lastSentMessageRef.current = { content: trimmedContent, timestamp: now };

    console.log(`[useFamilyChat] 🚀 發送消息: "${trimmedContent}" (開發模式: ${isDevelopment}, 模擬器: ${isSimulator})`);
    
    // 生成唯一的消息ID
    const userMessageId = nanoid();
    const loadingMessageId = nanoid();
    
    setIsLoading(true);

    try {

      // 立即在UI中显示用户消息，使用缓存的用户信息
      const userMessage: UIFamilyChatMessage = {
        id: userMessageId,
        type: 'user',
        content: trimmedContent,
        user_id: user.id,
        user_name: currentUserDetails?.display_name || user.email?.split('@')[0] || '我',
        user_avatar_url: currentUserDetails?.avatar_url || undefined,
        timestamp: new Date().toISOString(),
      };

      const loadingMessage: UIFamilyChatMessage = {
        id: loadingMessageId,
        type: 'assistant',
        content: '正在思考中...',
        user_id: getFamilyAssistantId(activeFamily.id),
        user_name: getAssistantDisplayName(),
        timestamp: new Date().toISOString(),
      };

      console.log(`[useFamilyChat] 📝 創建消息: 用戶消息ID=${userMessageId}, 加載消息ID=${loadingMessageId}`);

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

      // 1. 對於真實家庭才異步保存用户消息到数据库
      if (activeFamily.id !== 'meta-space') {
        sendFamilyChatMessage({
          family_id: activeFamily.id,
          content: trimmedContent
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
          content: trimmedContent,
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

      // 4. 立即更新UI中的AI響應
      const finalAssistantMessage: UIFamilyChatMessage = {
        id: loadingMessageId, // 使用相同ID替換加載消息
        type: 'assistant',
        content: assistantResponse,
        user_id: getFamilyAssistantId(activeFamily.id),
        user_name: getAssistantDisplayName(),
        timestamp: new Date().toISOString(),
      };

      console.log(`[useFamilyChat] ✅ AI響應完成: "${assistantResponse.substring(0, 50)}..."`);

      // 立即更新UI和緩存
      setMessages(prev => 
        prev.map(msg => msg.id === loadingMessageId ? finalAssistantMessage : msg)
      );

      // 更新緩存
      if (currentCache) {
        const updatedCacheForAI = addMessageToCache(currentCache, finalAssistantMessage);
        setCurrentCache(updatedCacheForAI);
      }

      // 5. 對於真實家庭才保存AI響應到數據庫
      if (activeFamily.id !== 'meta-space') {
        console.log('[useFamilyChat] 保存AI響應到數據庫 for family:', activeFamily.name);
        
        try {
          await sendFamilyChatMessage({
            family_id: activeFamily.id,
            content: assistantResponse,
            user_id: getFamilyAssistantId(activeFamily.id) // 使用群組專屬的AI助手ID
          });
        } catch (error) {
          console.error('[useFamilyChat] 保存AI響應失敗:', error);
        }
      }

    } catch (error) {
      console.error('[useFamilyChat] 發送消息時出錯:', error);
      
      // 移除加載消息
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      
      // 對於真實家庭，保存錯誤消息供調試
      if (activeFamily.id !== 'meta-space') {
        sendFamilyChatMessage({
          family_id: activeFamily.id,
          content: '抱歉，我遇到了一些问题，请稍后再试。',
          user_id: getFamilyAssistantId(activeFamily.id) // 錯誤消息也使用群組專屬的AI助手ID
        }).catch(err => console.error('保存错误消息失败:', err));
      }
    } finally {
      setIsLoading(false);
      // 清理處理標記
      processedMessages.delete(messageProcessId);
      console.log(`[useFamilyChat] 🏁 消息處理完成: ${messageProcessId}`);
    }
  }, [activeFamily, user, isLoading, currentUserDetails, currentCache, messages, events, familyMembers]);

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

  // 实时订阅消息更新 - 修復重複訂閱問題
  useEffect(() => {
    if (!activeFamily) {
      // 清理現有訂閱
      if (subscriptionRef.current) {
        console.log('[useFamilyChat] 清理現有訂閱（無家庭）');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      currentFamilyIdRef.current = null;
      return;
    }

    // 如果是同一個家庭，不需要重新訂閱
    if (currentFamilyIdRef.current === activeFamily.id && subscriptionRef.current) {
      console.log('[useFamilyChat] 家庭ID未變化，跳過訂閱:', activeFamily.id);
      return;
    }

    // 防止重複訂閱
    if (isSubscribingRef.current) {
      console.log('[useFamilyChat] 正在訂閱中，跳過:', activeFamily.id);
      return;
    }

    // 清除之前的防抖計時器
    if (subscriptionTimeoutRef.current) {
      clearTimeout(subscriptionTimeoutRef.current);
    }

    // 使用防抖機制，避免快速切換時的重複訂閱
    subscriptionTimeoutRef.current = setTimeout(() => {
      setupSubscription();
    }, 200);

    const setupSubscription = () => {
      // 清理現有訂閱
      if (subscriptionRef.current) {
        console.log('[useFamilyChat] 清理現有訂閱 for family:', currentFamilyIdRef.current);
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      // 設置訂閱狀態
      isSubscribingRef.current = true;
      currentFamilyIdRef.current = activeFamily.id;

      console.log('[useFamilyChat] 設置新的實時訂閱 for family:', activeFamily.name, activeFamily.id);

      try {
        const channel = subscribeFamilyChatMessages(
          activeFamily.id,
          (newMessage) => {
            console.log('[useFamilyChat] 📥 收到實時消息:', {
              id: newMessage.id,
              type: newMessage.type,
              user_id: newMessage.user_id,
              content: newMessage.content.substring(0, 50) + '...',
              timestamp: newMessage.timestamp
            });
            
            setMessages(prev => {
              // 簡化的重複檢查邏輯：只檢查ID是否已存在
              const isDuplicate = prev.some(msg => msg.id === newMessage.id);
              
              if (isDuplicate) {
                console.log('[useFamilyChat] 🚫 發現重複消息，跳過:', newMessage.id);
                return prev;
              }
              
              // 額外檢查：防止相同內容和用戶的消息在短時間內重複
              const now = new Date(newMessage.timestamp).getTime();
              const duplicateContent = prev.find(msg => 
                msg.content === newMessage.content && 
                msg.user_id === newMessage.user_id &&
                msg.type === newMessage.type &&
                Math.abs(now - new Date(msg.timestamp).getTime()) < 5000 // 5秒內
              );
              
              if (duplicateContent) {
                console.log('[useFamilyChat] 🚫 發現重複內容消息，跳過:', {
                  content: newMessage.content.substring(0, 30),
                  user_id: newMessage.user_id,
                  isAssistant: isAssistantMessage(newMessage.user_id),
                  timeDiff: Math.abs(now - new Date(duplicateContent.timestamp).getTime())
                });
                return prev;
              }
              
              console.log('[useFamilyChat] ✅ 添加新消息:', {
                id: newMessage.id,
                type: newMessage.type,
                user_name: newMessage.user_name
              });
              
              return [...prev, newMessage];
            });
          }
        );

        subscriptionRef.current = channel;
        console.log('[useFamilyChat] 訂閱設置完成 for family:', activeFamily.name);
      } catch (error) {
        console.error('[useFamilyChat] 設置訂閱失敗:', error);
      } finally {
        isSubscribingRef.current = false;
      }
    };

    // 清理函數
    return () => {
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
      }
      if (sendMessageTimeoutRef.current) {
        clearTimeout(sendMessageTimeoutRef.current);
      }
      if (subscriptionRef.current) {
        console.log('[useFamilyChat] useEffect cleanup - 清理實時訂閱 for family:', activeFamily.name);
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      currentFamilyIdRef.current = null;
      isSubscribingRef.current = false;
    };
  }, [activeFamily?.id]); // 只依賴於家庭ID，避免不必要的重訂閱

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