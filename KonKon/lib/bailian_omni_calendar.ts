
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

// 新增：待辦事項相關類型定義
export interface TodoItem {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string
}

export interface ParsedTodoResult {
  todos: TodoItem[];
  summary: string;
  confidence: number;
  userInput?: string;
}

// 新增：餐食記錄結果接口
export interface ParsedMealResult {
  meals: MealRecord[];
  summary: string;
  confidence: number;
  userInput?: string;
}

// 新增：餐食記錄接口
export interface MealRecord {
  title: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  time: string; // HH:MM 格式
  date: string; // YYYY-MM-DD 格式
  description?: string;
  nutrition?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  tags?: string[];
  confidence: number;
}

// 新增：待辦事項接口
export interface Todo {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // YYYY-MM-DD 格式
  confidence: number;
}

// 新增：文字轉待辦事項處理
export async function processTextToTodo(
  text: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedTodoResult> {
  try {
    if (onProgress) {
      onProgress('正在分析待辦事項...');
    }

    const config = await getOmniConfig();
    
    // 動態生成當前日期範例
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    const response = await fetch(`${config.baseURL}/api/v1/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [{
            role: "system",
            content: `你是一個智能待辦事項助手。請分析用戶的文字輸入，提取待辦事項信息。

返回JSON格式：
{
  "todos": [
    {
      "title": "待辦事項標題",
      "description": "詳細描述（可選）",
      "priority": "low|medium|high",
      "dueDate": "YYYY-MM-DD（可選）"
    }
  ],
  "summary": "解析摘要",
  "confidence": 0.95
}

優先級判斷規則：
- high: 包含"緊急"、"重要"、"急"、"馬上"、"立刻"等詞
- low: 包含"不急"、"有空再"、"慢慢"等詞
- medium: 其他情況

日期解析規則：
- "今天"、"今日" -> ${todayStr}
- "明天"、"明日" -> ${tomorrowStr}
- "後天" -> 後天日期
- "這週"、"本週" -> 本週末
- "下週" -> 下週末
- 具體日期格式：YYYY-MM-DD

範例：
用戶說："買菜，記得買蘋果和牛奶，明天要用"
輸出：{
  "todos": [{
    "title": "買菜",
    "description": "記得買蘋果和牛奶",
    "priority": "medium",
    "dueDate": "${tomorrowStr}"
  }],
  "summary": "創建了1個待辦事項：買菜",
  "confidence": 0.9
}`
          }, {
            role: "user",
            content: text
          }]
        },
        parameters: {
          result_format: "json_object",
          max_tokens: 1000
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`待辦解析API錯誤: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.output?.text || '{}';
    
    try {
      const parsed = JSON.parse(resultText);
      
      // 處理日期格式
      const processedTodos = parsed.todos?.map((todo: any) => ({
        ...todo,
        dueDate: todo.dueDate ? formatDateString(todo.dueDate) : undefined
      })) || [];

      return {
        todos: processedTodos,
        summary: parsed.summary || '成功解析待辦事項',
        confidence: parsed.confidence || 0.8,
        userInput: text
      };
    } catch (parseError) {
      console.error('解析JSON失敗:', parseError, resultText);
      throw new Error('AI返回格式錯誤');
    }

  } catch (error) {
    console.error('文字轉待辦失敗:', error);
    throw error;
  }
}

// 新增：語音轉待辦事項處理
export async function processVoiceToTodo(
  audioBase64: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedTodoResult> {
  try {
    const transcribedText = await speechToText(audioBase64, onProgress);
    if (!transcribedText || transcribedText.trim() === '') {
      throw new Error('语音识别结果为空');
    }
    return await processTextToTodo(transcribedText, onProgress);
  } catch (error) {
    console.error('语音转待办失败:', error);
    throw error;
  }
}

// 新增：文字轉餐食記錄處理
export async function processTextToMeal(
  text: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedMealResult> {
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
            const currentTime = now.toTimeString().slice(0, 5);
            
            return `你是一個智能餐食記錄助手。請分析用戶的文本輸入，提取其中的餐食信息，並返回JSON格式的結構化數據。

返回格式：
{
  "meals": [
    {
      "title": "牛奶燕麥粥",
      "mealType": "breakfast",
      "calories": 320,
      "time": "08:00",
      "date": "YYYY-MM-DD",
      "description": "加了香蕉和蜂蜜",
      "nutrition": {
        "protein": 12,
        "carbs": 45,
        "fat": 8
      },
      "tags": ["健康", "快手"],
      "confidence": 0.95
    }
  ],
  "summary": "解析摘要",
  "confidence": 0.9
}

注意：
1. 'mealType' 必須是 'breakfast', 'lunch', 'dinner', 或 'snack' 之一
2. 'time' 格式必須是 HH:MM (24小時制)
3. 'date' 格式必須是 YYYY-MM-DD。如果用戶沒有明確說明日期，使用今天的日期: ${today}
4. 'calories' 必須是一個數字，表示卡路里
5. 'nutrition' 中的 protein, carbs, fat 都是以克為單位的數字
6. 'tags' 是描述餐食特點的標籤數組
7. 根據用戶描述的內容和當前時間 ${currentTime} 智能推斷餐食類型
8. 如果文本中包含多個餐食記錄，請在 "meals" 數組中返回所有項目
9. 如果無法解析出任何餐食信息，返回一個空的 "meals" 數組`;
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
    return parseMealResult(responseText, text);
    
  } catch (error) {
    console.error('文字轉餐食失敗:', error);
    throw error;
  }
}

// 新增：語音轉餐食記錄處理
export async function processVoiceToMeal(
  audioBase64: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedMealResult> {
  try {
    const transcribedText = await speechToText(audioBase64, onProgress);
    if (!transcribedText || transcribedText.trim() === '') {
      throw new Error('语音识别结果为空');
    }
    return await processTextToMeal(transcribedText, onProgress);
  } catch (error) {
    console.error('语音转餐食失败:', error);
    throw error;
  }
}

// 新增：圖片轉待辦事項處理（OCR + AI解析）
export async function processImageToTodo(
  imageBase64: string,
  onProgress?: (chunk: string) => void
): Promise<ParsedTodoResult> {
  try {
    if (onProgress) {
      onProgress('正在識別圖片中的文字...');
    }

    const config = await getOmniConfig();
    
    // 使用qwen-vl-max進行圖片分析和文字提取
    const response = await fetch(`${config.baseURL}/api/v1/services/aigc/multimodal-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        input: {
          messages: [{
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: "text",
                text: `請分析這張圖片，提取其中的待辦事項信息。可能包含：
1. 手寫或打字的待辦清單
2. 便利貼上的任務
3. 日程表或行事曆
4. 購物清單
5. 工作任務列表

返回JSON格式：
{
  "todos": [
    {
      "title": "待辦事項標題",
      "description": "詳細描述（可選）",
      "priority": "low|medium|high",
      "dueDate": "YYYY-MM-DD（如果圖片中有日期）"
    }
  ],
  "summary": "從圖片中識別到的待辦事項摘要",
  "confidence": 0.95
}

如果圖片中沒有明確的待辦事項，請返回空的todos數組。`
              }
            ]
          }]
        },
        parameters: {
          result_format: "json_object",
          max_tokens: 1500
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`圖片分析API錯誤: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.output?.text || '{}';
    
    try {
      const parsed = JSON.parse(resultText);
      
      // 處理日期格式
      const processedTodos = parsed.todos?.map((todo: any) => ({
        ...todo,
        dueDate: todo.dueDate ? formatDateString(todo.dueDate) : undefined
      })) || [];

      return {
        todos: processedTodos,
        summary: parsed.summary || '成功從圖片中識別待辦事項',
        confidence: parsed.confidence || 0.7,
        userInput: '圖片識別'
      };
    } catch (parseError) {
      console.error('解析JSON失敗:', parseError, resultText);
      throw new Error('AI返回格式錯誤');
    }

  } catch (error) {
    console.error('圖片轉待辦失敗:', error);
    throw error;
  }
}

// 輔助函數：格式化日期字符串
function formatDateString(dateStr: string): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);
  
  // 輔助函數：將Date轉為本地日期字符串 (YYYY-MM-DD)
  const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  switch (dateStr) {
    case '今天':
    case '今日':
      return toLocalDateString(today);
    case '明天':
    case '明日':
      return toLocalDateString(tomorrow);
    case '後天':
      return toLocalDateString(dayAfterTomorrow);
    case '這週':
    case '本週':
      const thisWeekEnd = new Date(today);
      thisWeekEnd.setDate(today.getDate() + (7 - today.getDay()));
      return toLocalDateString(thisWeekEnd);
    case '下週':
      const nextWeekEnd = new Date(today);
      nextWeekEnd.setDate(today.getDate() + (14 - today.getDay()));
      return toLocalDateString(nextWeekEnd);
    default:
      // 如果已經是標準格式或其他格式，直接返回
      return dateStr;
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

// 新增：圖片轉餐食記錄處理（OCR + AI解析）
export async function processImageToMeal(
  base64Image: string
): Promise<ParsedMealResult> {
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
                  const currentTime = now.toTimeString().slice(0, 5);
                  
                  return `你是一個智能餐食記錄助手。請分析圖片內容，提取所有可能的餐食信息，並返回JSON格式的結構化數據。

返回格式：
{
  "meals": [
    {
      "title": "餐食名稱",
      "mealType": "breakfast",
      "calories": 320,
      "time": "08:00",
      "date": "YYYY-MM-DD",
      "description": "詳細描述",
      "nutrition": {
        "protein": 12,
        "carbs": 45,
        "fat": 8
      },
      "tags": ["健康", "快手"],
      "confidence": 0.95
    }
  ],
  "summary": "解析摘要",
  "confidence": 0.9
}

分析重點：
1. 識別圖片中的食物種類和名稱
2. 根據食物外觀估算卡路里含量
3. 分析營養成分（蛋白質、碳水化合物、脂肪）
4. 根據食物類型和當前時間 ${currentTime} 推斷餐食類型
5. 如果是菜單或食譜，提取所有餐食項目
6. 如果是餐廳收據，提取購買的餐食信息
7. 如果是食品包裝，讀取營養標籤信息

注意：
1. 'mealType' 必須是 'breakfast', 'lunch', 'dinner', 或 'snack' 之一
2. 'time' 格式必須是 HH:MM (24小時制)，根據當前時間 ${currentTime} 和餐食類型合理推斷
3. 'date' 格式必須是 YYYY-MM-DD，默認使用今天的日期: ${today}
4. 'calories' 根據食物份量和種類合理估算
5. 'nutrition' 中的 protein, carbs, fat 都是以克為單位的數字
6. 'tags' 描述餐食特點，如：健康、高蛋白、素食、辛辣等
7. 如果圖片中有多個餐食項目，請在 "meals" 數組中返回所有項目
8. 如果無法識別任何餐食信息，返回一個空的 "meals" 數組
9. 必須返回有效的JSON格式，不要包含其他解釋文字`;
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
      throw new Error(`API 請求失敗: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Bailian Response:", JSON.stringify(data, null, 2));

    const responseText = data.output?.choices?.[0]?.message?.content?.[0]?.text || '';
    if (!responseText) {
       throw new Error('從圖片解析餐食失敗: AI未返回有效內容。');
    }
    
    return parseMealResult(responseText, '圖片識別');

  } catch (error) {
    console.error('圖片處理失敗:', error);
    throw new Error(`圖片處理失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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

// 新增：解析餐食记录结果
function parseMealResult(
  content: string,
  userInput: string
): ParsedMealResult {
  try {
    const parsedData = JSON.parse(content);
    const meals: MealRecord[] = (parsedData.meals || []).map((m: any) => {
      return {
        title: m.title || '未知餐食',
        mealType: m.mealType || 'snack',
        calories: m.calories || 0,
        time: m.time || new Date().toTimeString().slice(0, 5),
        date: m.date || new Date().toISOString().split('T')[0],
        description: m.description,
        nutrition: m.nutrition ? {
          protein: m.nutrition.protein || 0,
          carbs: m.nutrition.carbs || 0,
          fat: m.nutrition.fat || 0,
        } : undefined,
        tags: m.tags || [],
        confidence: m.confidence || 0.8,
      };
    });
    
    meals.forEach(meal => {
      if (typeof meal.confidence !== 'number' || meal.confidence < 0 || meal.confidence > 1) {
        meal.confidence = 0.8;
      }
    });

    return {
      meals,
      summary: parsedData.summary || '成功解析餐食記錄',
      confidence: parsedData.confidence || 0.8,
      userInput,
    };
  } catch (error) {
    console.error('解析餐食結果失敗:', error);
    console.log('原始響應:', content);
    throw new Error('無法解析AI模型的響應');
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