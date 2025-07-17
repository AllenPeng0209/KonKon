import { BailianMessage, sendBailianMessage } from '@/lib/bailian';
import { nanoid } from '@/lib/nanoid';
import { useCallback, useState } from 'react';
import { getCurrentLocation } from '../lib/location';
import { useEvents } from './useEvents';
import { useFamily } from '../contexts/FamilyContext';

export interface UIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export function useEnhancedChat() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 獲取事件和家庭數據
  const { events, getEventsByDate } = useEvents();
  const { activeFamily, familyMembers } = useFamily();

  // 格式化事件數據為可讀文本
  const formatEventsForAI = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // 獲取今天到下週的事件
    const recentEvents = events.filter(event => {
      const eventDate = new Date(event.start_ts * 1000);
      return eventDate >= today && eventDate <= nextWeek;
    });

    if (recentEvents.length === 0) {
      return "目前家庭日曆中近期沒有安排的事件。";
    }

    let eventsText = "【家庭日曆近期安排】\n";
    
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
      if (event.is_shared) {
        eventsText += ` [家庭共享]`;
      }
      eventsText += "\n";
    });

    return eventsText;
  }, [events]);

  // 格式化家庭信息
  const formatFamilyInfoForAI = useCallback(() => {
    if (!activeFamily) {
      return "用戶暫未加入任何家庭群組。";
    }

    let familyText = `【家庭信息】\n`;
    familyText += `家庭名稱：${activeFamily.name}\n`;
    familyText += `家庭成員：${familyMembers.length}人\n`;
    
    if (familyMembers.length > 0) {
      familyText += "成員列表：";
      familyMembers.forEach((member, index) => {
        const memberName = member.user?.display_name || member.user?.email || '未知成員';
        familyText += index === 0 ? memberName : `、${memberName}`;
      });
      familyText += "\n";
    }

    return familyText;
  }, [activeFamily, familyMembers]);

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading) return;

    const userMessage: UIMessage = {
      id: nanoid(),
      type: 'user',
      content,
    };

    const loadingMessage: UIMessage = {
      id: nanoid(),
      type: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      // 1. 自動獲取定位
      const location = await getCurrentLocation();
      let locationPrompt = '';
      if (location) {
        locationPrompt = `\n\n【用戶當前定位】經度：${location.longitude}，緯度：${location.latitude}。請根據這個位置推薦本地化的活動或答案。`;
      }

      // 2. 獲取家庭日曆和成員信息
      const eventsInfo = formatEventsForAI();
      const familyInfo = formatFamilyInfoForAI();
      
      // 3. 構造增強的 AI prompt
      const contextPrompt = `
你是家庭智能助理"喵萌"，專門為家庭提供貼心服務。你能看到家庭的日曆安排和成員信息，請基於這些數據給出智能建議。

${familyInfo}

${eventsInfo}

你的特點：
- 卖萌可爱，讲话简洁温馨
- 擅长分析家庭日程，提供時間管理建議
- 能根據已有安排推薦活動
- 關注家庭成員的協調和溝通
- 提供實用的生活建議

當用戶問及家庭安排時，請參考上述日曆信息給出建議。如果沒有特定問題，可以主動分析當前日程並給出優化建議。${locationPrompt}`;

      const chatHistory: BailianMessage[] = [
        {
          role: 'system',
          content: contextPrompt,
        },
        ...messages.filter(msg => msg.content.trim() !== '').map((msg) => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
        })),
        {
          role: 'user',
          content,
        },
      ];

      const assistantResponse = await sendBailianMessage(chatHistory);

      const assistantMessage: UIMessage = {
        id: nanoid(),
        type: 'assistant',
        content: assistantResponse,
      };

      setMessages((prev) => [
        ...prev.slice(0, -1), // 移除加载消息
        assistantMessage,
      ]);
    } catch (error) {
      console.error('Enhanced chat error:', error);
      const errorMessage: UIMessage = {
        id: nanoid(),
        type: 'assistant',
        content: '抱歉喵～我現在無法查看家庭日曆，請稍後再試呢！',
      };
      setMessages((prev) => [
        ...prev.slice(0, -1), // 移除加载消息
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, formatEventsForAI, formatFamilyInfoForAI]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    // 額外提供一些有用的信息
    hasEvents: events.length > 0,
    hasFamily: !!activeFamily,
    eventsCount: events.length,
  };
} 