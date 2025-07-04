// 阿里百炼 API 配置
export const BAILIAN_API_KEY = process.env.EXPO_PUBLIC_BAILIAN_API_KEY || '';
export const BAILIAN_ENDPOINT = process.env.EXPO_PUBLIC_BAILIAN_ENDPOINT || '';
export const BAILIAN_WORKSPACE_ID = process.env.EXPO_PUBLIC_BAILIAN_WORKSPACE_ID || '';

export interface BailianMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BailianResponse {
  output: {
    text: string;
    finish_reason: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

export interface BailianStreamResponse {
  output: {
    text: string;
    finish_reason?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

// 生成签名的辅助函数
function generateSignature(method: string, uri: string, params: Record<string, any>, accessKeySecret: string): string {
  // 这里应该实现阿里云的签名算法
  // 实际项目中需要根据阿里云SDK的签名规范实现
  return '';
}

export async function sendBailianMessage(messages: BailianMessage[]): Promise<string> {
  if (!BAILIAN_API_KEY || !BAILIAN_ENDPOINT) {
    throw new Error('Bailian API key or endpoint not configured');
  }

  try {
    const response = await fetch(`${BAILIAN_ENDPOINT}/api/v1/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAILIAN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        },
        parameters: {
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.8,
          repetition_penalty: 1.1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bailian API error: ${response.status} - ${errorText}`);
    }

    const data: BailianResponse = await response.json();
    return data.output.text || '';
  } catch (error) {
    console.error('Bailian API error:', error);
    throw error;
  }
}

// 流式请求（可选）
export async function sendBailianMessageStream(
  messages: BailianMessage[],
  onMessage: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  if (!BAILIAN_API_KEY || !BAILIAN_ENDPOINT) {
    throw new Error('Bailian API key or endpoint not configured');
  }

  try {
    const response = await fetch(`${BAILIAN_ENDPOINT}/api/v1/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAILIAN_API_KEY}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        },
        parameters: {
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.8,
          repetition_penalty: 1.1,
          incremental_output: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bailian API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          
          try {
            const parsed: BailianStreamResponse = JSON.parse(data);
            if (parsed.output.text) {
              onMessage(parsed.output.text);
            }
          } catch (e) {
            console.warn('Failed to parse stream data:', e);
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    console.error('Bailian stream error:', error);
    onError(error as Error);
  }
} 