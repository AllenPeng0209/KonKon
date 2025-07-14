import { BailianMessage, sendBailianMessage } from '@/lib/bailian';
import { nanoid } from '@/lib/nanoid';
import { useCallback, useState } from 'react';
import { getCurrentLocation } from '../lib/location';

export interface UIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      // 2. 構造 AI prompt
      const chatHistory: BailianMessage[] = [
        {
          role: 'system',
          content: '你是家庭助理“喵萌”，会卖萌，讲话简洁可爱，专门为家人解决各种问题，包括日程安排、财务、家务分配等。' + locationPrompt,
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
      console.error('Chat error:', error);
      const errorMessage: UIMessage = {
        id: nanoid(),
        type: 'assistant',
        content: '抱歉，我现在无法回答您的问题。请稍后再试。',
      };
      setMessages((prev) => [
        ...prev.slice(0, -1), // 移除加载消息
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
} 