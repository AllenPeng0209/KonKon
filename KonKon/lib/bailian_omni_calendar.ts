import AsyncStorage from '@react-native-async-storage/async-storage';

// 事件数据结构
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  confidence: number;
}

// 解析结果接口
export interface ParsedCalendarResult {
  events: CalendarEvent[];
  summary: string;
  confidence: number;
  rawResponse: string;
}

// 配置接口
interface OmniConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

// 获取配置 - 使用与洞察页面相同的配置
async function getOmniConfig(): Promise<OmniConfig> {
  const apiKey = process.env.EXPO_PUBLIC_BAILIAN_API_KEY;
  const baseURL = process.env.EXPO_PUBLIC_BAILIAN_ENDPOINT || 'https://dashscope.aliyuncs.com';
  
  if (!apiKey || !baseURL) {
    throw new Error('请先配置百炼API密钥:\n1. 环境变量: EXPO_PUBLIC_BAILIAN_API_KEY\n2. 环境变量: EXPO_PUBLIC_BAILIAN_ENDPOINT');
  }
  
  return {
    apiKey,
    baseURL,
    model: 'qwen-turbo' // 使用与洞察页面相同的模型
  };
}

// 语音输入处理（暂时简化）
export async function processVoiceToCalendar(
  audioData: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedCalendarResult> {
  // 暂时返回提示信息，建议用户使用文字输入
  return {
    events: [],
    summary: "语音功能正在开发中，请使用文字输入功能",
    confidence: 0.1,
    rawResponse: "语音功能暂不可用"
  };
}

// 文本输入处理 - 使用与洞察页面相同的API调用方式
export async function processTextToCalendar(
  text: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedCalendarResult> {
  try {
    const config = await getOmniConfig();
    
    const requestBody = {
      model: config.model,
      input: {
        messages: [{
          role: "system",
          content: (() => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const tomorrow = new Date(now.getTime() + 24*60*60*1000).toISOString().split('T')[0];
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const currentDate = now.getDate();
            
            return `你是一个智能日程助手。请分析用户的文本输入，提取其中的日程信息，并返回JSON格式的结构化数据。

返回格式：
{
  "events": [
    {
      "title": "事件标题",
      "description": "详细描述",
      "startTime": "YYYY-MM-DD HH:mm:ss",
      "endTime": "YYYY-MM-DD HH:mm:ss",
      "location": "地点（可选）",
      "isRecurring": false,
      "recurringPattern": "重复模式（可选）",
      "confidence": 0.9
    }
  ],
  "summary": "解析摘要",
  "confidence": 0.85
}

注意：
1. 时间格式必须是YYYY-MM-DD HH:mm:ss，年份必须是${currentYear}年
2. 当前日期是${now.toLocaleDateString('zh-CN')}，今天是${currentYear}年${currentMonth}月${currentDate}日
3. 如果用户只说了时间没说日期，默认为今天或明天，年份必须是${currentYear}年
4. 如果没有明确的结束时间，根据事件类型估算（如会议1小时，吃饭1小时等）
5. confidence表示解析的置信度（0-1之间）
6. 必须返回有效的JSON格式，不要包含其他解释文字
7. 相对时间参考：今天=${today}，明天=${tomorrow}`;
          })()
        }, {
          role: "user",
          content: text
        }]
      },
      parameters: {
        max_tokens: 1000,
        temperature: 0.1,
        top_p: 0.8,
        repetition_penalty: 1.1,
      },
    };

    // 使用与洞察页面相同的API endpoint
    const response = await fetch(`${config.baseURL}/api/v1/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API请求失败: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const responseText = data.output?.text || '';
    
    return parseCalendarResponse(responseText);

  } catch (error) {
    console.error('文本处理失败:', error);
    throw new Error(`文本处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 解析响应为日程结构
function parseCalendarResponse(responseText: string): ParsedCalendarResult {
  try {
    console.log('原始响应:', responseText);
    
    // 尝试提取JSON部分
    let jsonStr = responseText;
    
    // 查找JSON开始和结束标记
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonStr = responseText.substring(jsonStart, jsonEnd + 1);
    }
    
    console.log('提取的JSON:', jsonStr);
    
    const parsed = JSON.parse(jsonStr);
    
    // 验证和转换数据
    const events: CalendarEvent[] = [];
    
    if (parsed.events && Array.isArray(parsed.events)) {
      for (const event of parsed.events) {
        try {
          // 处理日期时间
          let startTime: Date;
          let endTime: Date;
          
          if (typeof event.startTime === 'string') {
            startTime = new Date(event.startTime);
          } else {
            startTime = new Date();
          }
          
          if (typeof event.endTime === 'string') {
            endTime = new Date(event.endTime);
          } else {
            // 默认结束时间为开始时间后1小时
            endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
          }
          
          events.push({
            id: generateEventId(),
            title: event.title || '未命名事件',
            description: event.description || '',
            startTime,
            endTime,
            location: event.location || '',
            isRecurring: event.isRecurring || false,
            recurringPattern: event.recurringPattern || '',
            confidence: event.confidence || 0.8,
          });
        } catch (eventError) {
          console.warn('解析单个事件失败:', eventError, event);
        }
      }
    }
    
    return {
      events,
      summary: parsed.summary || '日程解析完成',
      confidence: parsed.confidence || 0.8,
      rawResponse: responseText,
    };
    
  } catch (error) {
    console.error('响应解析失败:', error);
    console.error('原始响应:', responseText);
    
    // 降级处理：尝试从文本中提取基本信息
    const fallbackEvent = extractBasicEventInfo(responseText);
    if (fallbackEvent) {
      return {
        events: [fallbackEvent],
        summary: '使用基础解析方式提取事件信息',
        confidence: 0.6,
        rawResponse: responseText,
      };
    }
    
    // 最终降级：返回基本结构
    return {
      events: [],
      summary: `解析失败: ${error instanceof Error ? error.message : '格式错误'}`,
      confidence: 0.1,
      rawResponse: responseText,
    };
  }
}

// 降级解析：从文本中提取基本事件信息
function extractBasicEventInfo(text: string): CalendarEvent | null {
  try {
    // 简单的关键词提取
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      id: generateEventId(),
      title: text.length > 50 ? text.substring(0, 50) + '...' : text,
      description: text,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1小时后
      location: '',
      isRecurring: false,
      recurringPattern: '',
      confidence: 0.5,
    };
  } catch {
    return null;
  }
}

// 生成事件ID
function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 测试连接
export async function testOmniConnection(): Promise<boolean> {
  try {
    const config = await getOmniConfig();
    
    const response = await fetch(`${config.baseURL}/api/v1/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: {
          messages: [{
            role: "user",
            content: "你好"
          }]
        },
        parameters: {
          max_tokens: 10
        }
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('连接测试失败:', error);
    return false;
  }
}

// 获取支持的音频格式
export function getSupportedAudioFormats(): string[] {
  return ['wav', 'mp3', 'aac', 'flac'];
}