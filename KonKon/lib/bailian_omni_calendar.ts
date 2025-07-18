
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
  userInput?: string; // 新增：用户原始输入
}

// 新增：记账数据结构
export interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: Date;
  type: 'income' | 'expense';
  confidence: number;
}

// 新增：记账解析结果接口
export interface ParsedExpenseResult {
  expenses: Expense[];
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
  return new Promise(async (resolve, reject) => {
    try {
      const config = await getOmniConfig();
      
      if (onRealtimeText) {
        onRealtimeText('正在连接 Qwen-Audio...');
      }

      const url = `${config.baseURL}/compatible-mode/v1/chat/completions`;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);

      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${config.apiKey}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');

      let fullTranscript = '';
      let lastProcessedPosition = 0;

      xhr.onprogress = () => {
        const chunk = xhr.responseText.substring(lastProcessedPosition);
        lastProcessedPosition = xhr.responseText.length;
        
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data: ')) continue;
            
            const data = line.slice(6);
            if (data.trim() === '[DONE]') {
                // The stream is done, but we'll let onreadystatechange handle the final state.
                return;
            }

            try {
                const parsed = JSON.parse(data);
                const textChunk = parsed.choices?.[0]?.delta?.content || '';
                if (textChunk) {
                    fullTranscript += textChunk;
                    if (onRealtimeText) {
                        onRealtimeText(fullTranscript);
                    }
                }
            } catch (e) {
                console.warn('解析流数据失败 (onprogress):', data, e);
            }
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            if (onRealtimeText) {
              onRealtimeText('语音识别完成');
            }
            if (!fullTranscript) {
              console.warn('语音识别结果为空');
            }
            resolve(fullTranscript.trim());
          } else {
            console.error('Qwen-Audio 错误:', xhr.status, xhr.responseText);
            reject(new Error(`Qwen-Audio API 错误: ${xhr.status} - ${xhr.responseText}`));
          }
        }
      };
      
      xhr.onerror = () => {
        console.error('Qwen-Audio 请求失败');
        reject(new Error('Qwen-Audio 请求失败: 网络错误'));
      };

      const body = JSON.stringify({
        model: 'qwen2.5-omni-7b',
        stream: true,
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
      });

      xhr.send(body);

    } catch (error) {
      console.error('Qwen-Audio 失败:', error);
      reject(error);
    }
  });
}


// 提取出的通用 Bailian API 调用函数
async function fetchFromBailian(
  requestBody: object,
  onProgress?: (chunk: string) => void
): Promise<string> {
  const config = await getOmniConfig();
  
  // 注意：这里使用的是v1的text-generation接口，可能需要根据模型调整
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
  return data.output?.text || '';
}

// 提取出的通用图片理解函数
async function visionToText(
  base64Image: string,
  prompt: string
): Promise<string> {
  const config = await getOmniConfig();
  const requestBody = {
    model: "qwen-vl-max",
    input: {
      messages: [
        {
          role: "user",
          content: [
            { image: `data:image/jpeg;base64,${base64Image}` },
            { text: prompt }
          ]
        }
      ]
    },
    parameters: {
      "max_tokens": 2000,
      "temperature": 0.1,
      "top_p": 0.8
    }
  };
  
  const response = await fetch(`${config.baseURL}/api/v1/services/aigc/multimodal-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`图片理解API请求失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.output?.choices?.[0]?.message?.content?.[0]?.text || '';
  if (!responseText) {
     throw new Error('从图片解析文本失败: AI未返回有效内容。');
  }
  return responseText;
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
    const result = await processTextToCalendar(transcribedText, onProgress);
    
    // 将用户输入文本附加到最终结果中
    return {
      ...result,
      userInput: transcribedText,
    };
    
  } catch (error) {
    console.error('语音转日程失败:', error);
    throw error;
  }
}

// 新增：语音转记账处理
export async function processVoiceToExpense(
  audioBase64: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedExpenseResult> {
  try {
    const transcribedText = await speechToText(audioBase64, onProgress);
    if (!transcribedText || transcribedText.trim() === '') {
      throw new Error('语音识别结果为空');
    }
    return await processTextToExpense(transcribedText, onProgress);
  } catch (error) {
    console.error('语音转记账失败:', error);
    throw error;
  }
}

// 新增：图片转记账处理
export async function processImageToExpense(
  base64Image: string
): Promise<ParsedExpenseResult> {
  try {
    const textFromImage = await visionToText(base64Image, '请描述图片中的内容，特别是与消费、账单、发票相关的信息。');
    if (!textFromImage || textFromImage.trim() === '') {
      throw new Error('图片识别结果为空');
    }
    return await processTextToExpense(textFromImage);
  } catch (error) {
    console.error('图片转记账失败:', error);
    throw error;
  }
}

// 新增：文本转记账处理
export async function processTextToExpense(
  text: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedExpenseResult> {
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
            
            return `你是一个智能记账助手。请分析用户的文本输入，提取其中的收支信息，并返回JSON格式的结构化数据。

返回格式：
{
  "expenses": [
    {
      "amount": 100.50,
      "category": "餐饮",
      "description": "和朋友吃午饭",
      "date": "YYYY-MM-DD",
      "type": "expense",
      "confidence": 0.95
    }
  ],
  "summary": "解析摘要",
  "confidence": 0.9
}

注意：
1. 'type' 必须是 'income' (收入) 或 'expense' (支出)。
2. 'category' 应该是一个简洁的分类，例如: 餐饮, 交通, 购物, 工资, 投资等。
3. 'date' 格式必须是 YYYY-MM-DD。如果用户没有明确说明日期，就使用今天的日期: ${today}。
4. 'amount' 必须是一个数字。
5. 如果文本中包含多个记账项目，请在 "expenses" 数组中返回所有项目。
6. 如果无法解析出任何记账信息，返回一个空的 "expenses" 数组。`;
          })()
        }, {
          role: "user",
          content: text
        }]
      },
      parameters: {
        result_format: "json_object"
      }
    };
    
    const responseText = await fetchFromBailian(requestBody, onProgress);
    return parseExpenseResult(responseText);
    
  } catch (error) {
    console.error('文本转记账失败:', error);
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
      const url = `${config.baseURL}/compatible-mode/v1/chat/completions`;
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentDate = now.getDate();
      
      const systemPrompt = `你是一个智能日程助手。请分析用户的文本输入，提取其中的日程信息，并返回JSON格式的结构化数据。

返回格式：
{
  "events": [
    {
      "title": "事件标题",
      "description": "详细描述",
      "startTime": "YYYY-MM-DD HH:mm:ss",
      "endTime": "YYYY-MM-DD HH:mm:ss",
      "location": "地点（可选）",
      "confidence": 0.9
    }
  ],
  "summary": "解析摘要",
  "confidence": 0.85
}

注意：
1.  **JSON输出**: 必须返回有效的JSON格式，不要包含其他解释文字。
2.  **多事件**: 如果文本包含多个事件，请在 'events' 数组中返回所有事件。
3.  **时间格式**: 时间格式必须是 'YYYY-MM-DD HH:mm:ss'。
4.  **日期推断**: 当前日期是${now.toLocaleDateString('zh-CN')}。如果用户只说了时间没说日期，默认为今天(${today})。相对时间参考：明天=${tomorrow}。
5.  **结束时间**: 如果没有明确的结束时间，根据事件类型估算（如会议1小时，吃饭1.5小时等）。
6.  **置信度**: 'confidence' 表示你对解析结果的信心（0-1之间）。`;

      const requestBody = {
        model: 'qwen2.5-omni-7b', // 使用更适合对话和快速指令的模型
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
      };

      if (onProgress) onProgress('正在处理...');

      const response = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${config.apiKey}`);
        xhr.setRequestHeader('Accept', 'text/event-stream');

        let fullResponse = '';
        let lastProcessedPosition = 0;
        xhr.onprogress = () => {
          const chunk = xhr.responseText.substring(lastProcessedPosition);
          lastProcessedPosition = xhr.responseText.length;
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data.trim() === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const textChunk = parsed.choices?.[0]?.delta?.content || '';
              if (textChunk) {
                fullResponse += textChunk;
                if (onProgress) onProgress(fullResponse); 
              }
            } catch (e) {
              console.warn('解析流数据失败 (onprogress):', data, e);
            }
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                // 流结束后，完整的JSON应该已经接收完毕
                resolve(fullResponse);
            } else {
              console.error('文本转日历 API 错误:', xhr.status, xhr.responseText);
              reject(new Error(`API 错误: ${xhr.status} - ${xhr.responseText}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('网络错误，无法连接到日程解析服务'));
        };

        xhr.send(JSON.stringify(requestBody));
      });
      
      const finalResult = parseCalendarResult(response);
      return {
        ...finalResult,
        userInput: text,
      };

    } catch (error) {
      console.error('文本处理失败:', error);
      // 降级处理
      const fallbackEvent = extractBasicEventInfo(text);
      return {
          events: fallbackEvent ? [fallbackEvent] : [],
          summary: `处理失败: ${error instanceof Error ? error.message : "未知错误"}`,
          confidence: 0.2,
          rawResponse: '',
          userInput: text,
      };
    }
}

// 图片输入处理
export async function processImageToCalendar(
  base64Image: string
): Promise<ParsedCalendarResult> {
  try {
    const config = await getOmniConfig();

    const requestBody = {
      model: "qwen-vl-max",
      input: {
        messages: [
          {
            role: "user",
            content: [
              {
                image: `data:image/jpeg;base64,${base64Image}`
              },
              {
                text: (() => {
                  const now = new Date();
                  const today = now.toISOString().split('T')[0];
                  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  const currentYear = now.getFullYear();
                  const currentMonth = now.getMonth() + 1;
                  const currentDate = now.getDate();
                  
                  return `你是一个智能日程助手。请分析图片内容，提取所有可能的日程信息，并返回JSON格式的结构化数据。

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
      "recurrenceRule": {
        "frequency": "WEEKLY",
        "interval": 1,
        "byDay": ["TU"],
        "until": "YYYY-MM-DD"
      },
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
7. 相对时间参考：今天=${today}，明天=${tomorrow}
8. 重复事件处理：
   - 如果图片中提到"每天"、"每周"、"每月"等重复词汇，请设置 isRecurring: true
   - recurringPattern 是原始描述，如"每周二"
   - recurrenceRule 是结构化的重复规则：
     * frequency: "DAILY"(每天) | "WEEKLY"(每周) | "MONTHLY"(每月) | "YEARLY"(每年)
     * interval: 间隔数，默认1
     * byDay: 星期几，如["MO","TU","WE","TH","FR","SA","SU"]
     * byMonthDay: 月份中的第几天，如[1,15,31]
     * count: 重复次数
     * until: 结束日期"YYYY-MM-DD"
   - 示例：
     * "每周二" -> {"frequency":"WEEKLY","interval":1,"byDay":["TU"]}
     * "每两周" -> {"frequency":"WEEKLY","interval":2}
     * "每月15号" -> {"frequency":"MONTHLY","interval":1,"byMonthDay":[15]}
     * "工作日" -> {"frequency":"WEEKLY","interval":1,"byDay":["MO","TU","WE","TH","FR"]}`;
                })()
              }
            ]
          }
        ]
      },
      parameters: {
        "max_tokens": 2000,
        "temperature": 0.1,
        "top_p": 0.8
      }
    };
    
    // 使用多模态API endpoint
    const response = await fetch(`${config.baseURL}/api/v1/services/aigc/multimodal-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bailian API Error:', response.status, errorText);
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Bailian Response:", JSON.stringify(data, null, 2));

    const responseText = data.output?.choices?.[0]?.message?.content?.[0]?.text || '';
    if (!responseText) {
       throw new Error('从图片解析日程失败: AI未返回有效内容。');
    }
    
    return parseCalendarResult(responseText);

  } catch (error) {
    console.error('图片处理失败:', error);
    throw new Error(`图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}


function normalizeEventKeys(event: any): any {
    const mapping: { [key: string]: string } = {
        event: 'title',
        event_name: 'title',
        name: 'title',
        summary: 'title', // 将 summary 也映射到 title
        start_time: 'startTime',
        starttime: 'startTime',
        end_time: 'endTime',
        endtime: 'endTime',
        desc: 'description',
        details: 'description',
        place: 'location',
    };

    const normalized: { [key: string]: any } = {};
    for (const key in event) {
        const normalizedKey = mapping[key.toLowerCase()] || key;
        normalized[normalizedKey] = event[key];
    }
    return normalized;
}

function parseTime(timeStr: string, referenceDate: Date): Date | null {
    if (!timeStr) return null;

    // Most reliable: Manually parse the expected format YYYY-MM-DD HH:mm:ss
    const fullDateRegex = /(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/;
    const fullMatch = timeStr.match(fullDateRegex);

    if (fullMatch) {
        const [, year, month, day, hours, minutes, seconds] = fullMatch.map(Number);
        // JS Date month is 0-indexed, so we subtract 1
        return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    // Fallback 1: Try ISO 8601 format
    const compliantTimeStr = timeStr.replace(' ', 'T');
    let date = new Date(compliantTimeStr);
    if (!isNaN(date.getTime())) {
        return date;
    }
    
    // Fallback 2: Try parsing "HH:mm" or "HH:mm AM/PM" relative to a reference date
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
    const timeMatch = timeStr.match(timeRegex);
    if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = timeMatch[3]?.toUpperCase();

        if (period === 'PM' && hours < 12) {
            hours += 12;
        }
        if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        const newDate = new Date(referenceDate);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate;
    }

    console.warn(`Could not parse time string: "${timeStr}"`);
    return null;
}

function parseDuration(durationStr: string): { hours: number, minutes: number } {
    if (!durationStr) return { hours: 1, minutes: 0 }; // 默认1小时

    const hoursMatch = durationStr.match(/(\d+)\s*hour/i);
    const minutesMatch = durationStr.match(/(\d+)\s*minute/i);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    
    if (hours === 0 && minutes === 0) return { hours: 1, minutes: 0 };
    return { hours, minutes };
}


function parseCalendarResult(
  content: string
): ParsedCalendarResult {
  console.log("Raw content for parsing:", content);

  const jsonRegex = /```json\s*([\s\S]*?)\s*```|({[\s\S]*})/;
  const match = content.match(jsonRegex);

  if (!match) {
      console.error("No JSON found in response:", content);
      // 如果没有找到JSON，直接进入后备逻辑
      const fallbackEvent = extractBasicEventInfo(content);
      return {
          events: fallbackEvent ? [fallbackEvent] : [],
          summary: "AI未返回有效JSON，已尝试基本提取。",
          confidence: 0.3,
          rawResponse: content,
      };
  }
  
  // 优先使用 ```json ``` 块的内容，其次是独立的 {}
  const jsonString = match[1] || match[2];

  try {
      let parsedData = JSON.parse(jsonString);

      // 处理整个结果被包裹在一个 "event" key下的情况
      if (parsedData.event && typeof parsedData.event === 'object' && !Array.isArray(parsedData.event)) {
           parsedData = { events: [parsedData.event], ...parsedData };
           delete parsedData.event;
      }

      if (!parsedData.events || !Array.isArray(parsedData.events)) {
        throw new Error("返回的数据中'events'字段不是一个数组或不存在");
      }

      const normalizedEvents = (parsedData.events || []).map((rawEvent: any) => {
           const event = normalizeEventKeys(rawEvent);

           if (!event.title || !event.startTime) {
              throw new Error('事件缺少必要的字段 "title" 或 "startTime"');
           }

           const referenceDate = new Date();
           const startTime = parseTime(event.startTime, referenceDate);
           let endTime = parseTime(event.endTime, referenceDate);
           
           // If only startTime and duration are available
           if (startTime && !endTime && event.duration) {
               const { hours, minutes } = parseDuration(event.duration);
               endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000);
           }

           // If endTime is still invalid, set a default duration
           if (startTime && !endTime) {
               endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
           }

           // Ensure recurrenceRule.until is a Date object if it exists
           if (event.recurrenceRule && event.recurrenceRule.until && typeof event.recurrenceRule.until === 'string') {
              const untilDate = new Date(event.recurrenceRule.until);
              // Check for invalid date
              if (!isNaN(untilDate.getTime())) {
                event.recurrenceRule.until = untilDate;
              } else {
                console.warn(`Could not parse until date string: "${event.recurrenceRule.until}"`);
                delete event.recurrenceRule.until; // Remove invalid date
              }
           }

           return {
               ...event, // Spread original event data first
               id: generateEventId(),
               startTime: startTime, // Overwrite with parsed Date object
               endTime: endTime,     // Overwrite with parsed Date object
               confidence: event.confidence || parsedData.confidence || 0.85,
           };
      });
      
      const finalEvents = normalizedEvents.filter((e: any) => e.title && e.startTime && e.endTime && e.startTime < e.endTime);
      
      // Allow for cases where no events are found, do not throw an error.
      if (finalEvents.length === 0 && parsedData.events && parsedData.events.length > 0) {
         // This case means events were present but failed validation (e.g., bad dates)
         console.warn("解析到的事件缺少必要信息或起止时间不正确。", parsedData.events);
      }

      return {
          events: finalEvents,
          summary: parsedData.summary || '日程已解析',
          confidence: parsedData.confidence || 0.85,
          rawResponse: content,
      };
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    console.error("Original JSON string:", jsonString);
    // 在失败时返回一个包含错误信息的对象
    const fallbackEvent = extractBasicEventInfo(jsonString || content);
    return {
      events: fallbackEvent ? [fallbackEvent] : [],
      summary: `JSON解析失败: ${e instanceof Error ? e.message : "未知错误"}`,
      confidence: 0.3,
      rawResponse: content,
      userInput: jsonString || content,
    };
  }
}

// 新增：解析记账结果
function parseExpenseResult(
  content: string
): ParsedExpenseResult {
  try {
    const parsedData = JSON.parse(content);
    const expenses: Expense[] = (parsedData.expenses || []).map((e: any) => {
      return {
        ...e,
        id: generateEventId(),
        date: e.date ? new Date(e.date) : new Date(),
      };
    });
    
    expenses.forEach(exp => {
      if (typeof exp.confidence !== 'number' || exp.confidence < 0 || exp.confidence > 1) {
        exp.confidence = 0.8;
      }
    });

    return {
      expenses,
      summary: parsedData.summary || '未提供摘要',
      confidence: parsedData.confidence || 0.8,
      rawResponse: content,
    };
  } catch (error) {
    console.error('解析记账结果失败:', error);
    console.log('原始响应:', content);
    throw new Error('无法解析AI模型的响应');
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