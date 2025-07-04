import { useState, useCallback } from 'react';
import { nanoid } from '@/lib/nanoid';
import { sendBailianMessage, BailianMessage } from '@/lib/bailian';

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
      // 准备发送给阿里百炼的消息历史
      const chatHistory: BailianMessage[] = [
        {
          role: 'system',
          content: '你是一个有用的AI助手，专门帮助用户进行记账、消费分析和理财建议。请用中文回答用户的问题。',
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