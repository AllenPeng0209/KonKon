import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import {
  UIFamilyChatMessage,
  sendFamilyChatMessage,
  getFamilyChatHistory,
  subscribeFamilyChatMessages,
  saveFamilyChatSession
} from '@/lib/familyChat';
import { sendBailianMessage, BailianMessage } from '@/lib/bailian';
import { getCurrentLocation } from '@/lib/location';
import { useEvents } from './useEvents';
import { nanoid } from '@/lib/nanoid';

export function useFamilyChat() {
  const { user } = useAuth();
  const { activeFamily, familyMembers } = useFamily();
  const { events } = useEvents();
  
  const [messages, setMessages] = useState<UIFamilyChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 加载聊天历史
  const loadChatHistory = useCallback(async () => {
    if (!activeFamily) return;

    try {
      setIsLoadingHistory(true);
      const history = await getFamilyChatHistory({
        family_id: activeFamily.id,
        limit: 50
      });
      setMessages(history);
    } catch (error) {
      console.error('加载聊天历史失败:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeFamily]);

  // 格式化事件数据为可读文本
  const formatEventsForAI = useCallback(() => {
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
  }, [events]);

  // 格式化家庭信息
  const formatFamilyInfoForAI = useCallback(() => {
    if (!activeFamily) {
      return "用户暂未加入任何家庭群组。";
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

    // 立即在UI中显示用户消息，提升响应速度
    const userMessage: UIFamilyChatMessage = {
      id: nanoid(),
      type: 'user',
      content,
      user_id: user.id,
      user_name: (user as any).display_name || user.email,
      user_avatar: (user as any).avatar_url,
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

    // 立即更新UI
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      // 1. 异步保存用户消息到数据库
      sendFamilyChatMessage({
        family_id: activeFamily.id,
        content,
        message_type: 'user'
      }).catch(err => console.error('保存用户消息失败:', err));

      // 2. 并行准备AI响应数据（无需等待定位完成）
      const locationPromise = getCurrentLocation().catch(() => null);
      
      // 预构建基本信息（快速执行）
      const eventsInfo = formatEventsForAI();
      const familyInfo = formatFamilyInfoForAI();
      
      // 简化聊天历史构建（只取最近10条消息，减少处理时间）
      const recentMessages = messages.slice(-10);
      const baseHistory: BailianMessage[] = [
        {
          role: 'system',
          content: `你是家庭智能助理"喵萌"，专门为家庭群组提供贴心服务。你能看到家庭的日历安排和成员信息，请基于这些数据给出智能建议。

${familyInfo}

${eventsInfo}

特点：卖萌可爱，讲话简洁温馨，擅长分析家庭日程，关注家庭成员的协调。这是家庭群聊，可能有多个成员参与对话。`,
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

      // 立即更新UI
      setMessages(prev => 
        prev.map(msg => msg.id === loadingMessage.id ? finalAssistantMessage : msg)
      );

      // 5. 异步保存AI响应到数据库（不阻塞UI）
      sendFamilyChatMessage({
        family_id: activeFamily.id,
        content: assistantResponse,
        message_type: 'assistant'
      }).catch(err => console.error('保存AI响应失败:', err));

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

      // 异步保存错误信息
      sendFamilyChatMessage({
        family_id: activeFamily.id,
        content: '抱歉，我遇到了一些问题，请稍后再试。',
        message_type: 'assistant',
        metadata: { error: true }
      }).catch(err => console.error('保存错误消息失败:', err));
    } finally {
      setIsLoading(false);
    }
  }, [activeFamily, user, isLoading, formatEventsForAI, formatFamilyInfoForAI]);

  // 保存聊天会话
  const saveChatSession = useCallback(async () => {
    if (!activeFamily || messages.length === 0) return;

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
          return [...prev, newMessage];
        });
      },
      (messageId) => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
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
    sendMessage,
    clearChat,
    saveChatSession,
    hasFamily: !!activeFamily,
    familyName: activeFamily?.name,
    memberCount: familyMembers.length,
  };
} 