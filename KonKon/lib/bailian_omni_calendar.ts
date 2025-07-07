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

// DashScope 语音识别功能
export async function speechToText(
  audioBase64: string,
  onRealtimeText?: (text: string) => void
): Promise<string> {
  try {
    console.log('录音文件大小:', audioBase64.length, 'bytes (base64)');
    
    if (onRealtimeText) {
      onRealtimeText('正在处理语音识别...');
    }
    
    // 使用 DashScope ASR API 进行语音识别
    const result = await performDashScopeASR(audioBase64, onRealtimeText);
    
    console.log('DashScope 语音识别结果:', result);
    return result;
    
  } catch (error) {
    console.error('语音识别失败:', error);
    throw new Error(`语音识别失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// DashScope Qwen-Audio 语音识别实现
async function performDashScopeASR(
  audioBase64: string,
  onRealtimeText?: (text: string) => void
): Promise<string> {
  try {
    const config = await getOmniConfig();
    
    if (onRealtimeText) {
      onRealtimeText('正在连接 Qwen-Audio...');
    }
    
    // 使用 DashScope OpenAI 兼容的 Qwen-Audio API
    const response = await fetch(`${config.baseURL}/compatible-mode/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen2.5-omni-7b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: {
                  data: `data:audio/wav;base64,${audioBase64}`
                }
              },
              {
                type: 'text',
                text: '请将这段语音转录成文字，只输出转录的文字内容，不要其他解释。'
              }
            ]
          }
        ],
        modalities: ['text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen-Audio 错误:', response.status, errorText);
      throw new Error(`Qwen-Audio API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Qwen-Audio 响应:', data);
    
    if (onRealtimeText) {
      onRealtimeText('语音识别完成');
    }
    
    // 解析响应获取识别结果
    const transcript = data.choices?.[0]?.message?.content || '';
    
    if (!transcript) {
      throw new Error('语音识别结果为空');
    }
    
    return transcript.trim();
    
  } catch (error) {
    console.error('Qwen-Audio 失败:', error);
    throw error;
  }
}


// 语音输入处理 - 完整流程
export async function processVoiceToCalendar(
  audioBase64: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedCalendarResult> {
  try {
    // 第一步：语音转文字
    const transcribedText = await speechToText(audioBase64, onProgress);
    
    if (!transcribedText || transcribedText.trim() === '') {
      throw new Error('语音识别结果为空');
    }
    
    // 第二步：文字转日程
    return await processTextToCalendar(transcribedText, onProgress);
    
  } catch (error) {
    console.error('语音转日程失败:', error);
    throw error;
  }
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

// 图片输入处理
export async function processImageToCalendar(
  base64Image: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedCalendarResult> {
  try {
    const config = await getOmniConfig();
    const mimeType = base64Image.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

    // Using the native Bailian API format as per documentation
    // This avoids the streaming issues encountered with the OpenAI compatible endpoint.
    const requestBody = {
      model: "qwen-vl-max", // Using the dedicated Vision-Language model
      input: {
        messages: [
          {
            role: "user",
            content: [
              {
                "image": `data:${mimeType};base64,${base64Image}`
              },
              {
                "text": `你是一个智能日程助手。请分析这张图片，提取或推断出图片中的日程信息。如果图片中没有明确的事件，可以根据图片内容创造一个相关的事件。请以JSON格式返回。当前时间是 ${new Date().toISOString()}`
              }
            ]
          }
        ]
      },
      parameters: {
        result_format: "message" // Required parameter for this endpoint
      }
    };
    
    if (onProgress) onProgress('正在分析图片...');

    // Using the native Bailian v2 chat completion endpoint
    const response = await fetch(`${config.baseURL}/v2/completion/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bailian Image API Error:', response.status, errorText);
      throw new Error(`图片分析接口调用失败: ${response.status} - ${errorText}`);
    }

    // This is now a non-streaming response.
    const data = await response.json();
    
    if (onProgress) onProgress('图片分析完成，正在解析结果...');
    
    console.log('Bailian Image API Full Response:', JSON.stringify(data, null, 2));

    if (data.output && data.output.choices && data.output.choices.length > 0) {
      const messageContent = data.output.choices[0].message.content;
      return parseCalendarResult(messageContent, onProgress);
    } else {
      console.error('Invalid response structure from Bailian Image API:', data);
      throw new Error('从图片分析服务返回了无效的结果格式。');
    }

  } catch (error) {
    console.error('图片转日程失败:', error);
    throw error;
  }
}

// Helper function to parse the AI's string response into a JSON object.
function parseCalendarResult(
  content: string,
  onProgress?: (chunk: string) => void
): ParsedCalendarResult {
  if (onProgress) onProgress('正在解析结果...');
  console.log("Raw content from AI for parsing: ", content);

  try {
    // Clean the content: remove markdown code block fences and trim whitespace.
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedContent);

    // Basic validation to ensure the parsed object has the necessary properties.
    if (!parsed.title || !parsed.startTime || !parsed.endTime) {
      throw new Error('解析后的JSON缺少必要的字段 (title, startTime, endTime)。');
    }
    
    const event: CalendarEvent = {
      id: generateEventId(), // Generate a unique ID for the new event
      title: parsed.title,
      description: parsed.description || '',
      startTime: new Date(parsed.startTime),
      endTime: new Date(parsed.endTime),
      location: parsed.location || '',
      confidence: parsed.confidence || 0.9, // Use confidence from AI or default
    };

    console.log("Parsed calendar event: ", event);

    return {
      events: [event],
      summary: event.title,
      confidence: event.confidence,
      rawResponse: content,
    };
  } catch (error) {
    console.error('无法将AI响应解析为日历事件JSON:', error, "Raw content was:", content);
    // Re-throw the error to be caught by the calling function's try-catch block.
    throw new Error(`无法解析AI响应: ${content}`);
  }
}

// 解析大模型返回的日历事件字符串
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

// 测试语音识别连接 (Qwen-Audio)
export async function testSpeechConnection(): Promise<boolean> {
  try {
    const config = await getOmniConfig();
    
    // 测试 Qwen-Audio OpenAI 兼容 API 连接
    const response = await fetch(`${config.baseURL}/compatible-mode/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen2.5-omni-7b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '你好'
              }
            ]
          }
        ]
      }),
    });
    
    // 即使返回错误，只要不是认证错误，就说明连接正常
    const isConnected = response.status !== 401 && response.status !== 403;
    
    console.log('语音识别功能测试:', isConnected ? '✅ Qwen-Audio 连接正常' : '❌ Qwen-Audio 连接失败');
    return isConnected;
  } catch (error) {
    console.error('语音识别连接测试失败:', error);
    return false;
  }
}