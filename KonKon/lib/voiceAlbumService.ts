import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export interface AlbumCreationRequest {
  albumName: string;
  theme?: string;
  timeRange?: string;
  style?: string;
  keywords?: string[];
}

export interface ParsedAlbumResult {
  albumName: string;
  theme: string;
  keywords: string[];
  timeRange?: string;
  success: boolean;
  error?: string;
}

export interface SmartAlbum {
  id: string;
  name: string;
  theme: string;
  photos: ImagePicker.ImagePickerAsset[];
  story: string;
  coverPhoto?: ImagePicker.ImagePickerAsset;
  createdAt: Date;
}

export interface PhotoAnalysis {
  tags: string[];
  confidence: number;
  description: string;
  hasChildren: boolean;
  isGrowthMoment: boolean;
  scenery: string[];
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

// 獲取AI配置
async function getOmniConfig() {
  // 從環境變量或配置文件獲取API密鑰和端點
  return {
    apiKey: process.env.EXPO_PUBLIC_DASHSCOPE_API_KEY || 'sk-6c4c69d9b7394adaafee2af2b5f5b35c',
    baseURL: 'https://dashscope.aliyuncs.com',
    model: 'qwen2.5-omni-7b'
  };
}

// 語音識別和AI解析服務
export class VoiceAlbumService {
  private static instance: VoiceAlbumService;
  
  static getInstance(): VoiceAlbumService {
    if (!VoiceAlbumService.instance) {
      VoiceAlbumService.instance = new VoiceAlbumService();
    }
    return VoiceAlbumService.instance;
  }

  // 處理語音輸入，解析相簿創建指令
  async processVoiceToAlbum(audioBase64: string): Promise<ParsedAlbumResult> {
    try {
      console.log('開始處理語音相簿指令...');
      
      // 1. 語音轉文字
      const transcribedText = await this.speechToText(audioBase64);
      console.log('語音轉錄結果:', transcribedText);
      
      if (!transcribedText.trim()) {
        throw new Error('語音識別結果為空');
      }
      
      // 2. 使用AI解析相簿創建指令
      const albumRequest = await this.parseAlbumCommandWithAI(transcribedText);
      console.log('AI解析結果:', albumRequest);
      
      return {
        albumName: albumRequest.albumName,
        theme: albumRequest.theme || '日常生活',
        keywords: albumRequest.keywords || [],
        timeRange: albumRequest.timeRange,
        success: true
      };
    } catch (error: any) {
      console.error('語音處理失敗:', error);
      return {
        albumName: '',
        theme: '',
        keywords: [],
        success: false,
        error: error.message
      };
    }
  }

  // 真實的語音轉文字功能（使用百煉API）
  private async speechToText(audioBase64: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const config = await getOmniConfig();
        console.log('開始語音識別...');
        
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
            if (data.trim() === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const textChunk = parsed.choices?.[0]?.delta?.content || '';
              if (textChunk) {
                fullTranscript += textChunk;
              }
            } catch (e) {
              console.warn('解析流數據失敗:', data, e);
            }
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              console.log('語音識別完成:', fullTranscript);
              resolve(fullTranscript.trim());
            } else {
              console.error('語音識別API錯誤:', xhr.status, xhr.responseText);
              reject(new Error(`語音識別API錯誤: ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('語音識別請求失敗'));
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
                  text: '請將這段語音轉錄成文字，只輸出轉錄的文字內容。'
                }
              ]
            }
          ],
        });

        xhr.send(body);

      } catch (error) {
        console.error('語音識別失敗:', error);
        reject(error);
      }
    });
  }

  // 使用AI解析相簿創建指令
  private async parseAlbumCommandWithAI(text: string): Promise<AlbumCreationRequest> {
    try {
      const config = await getOmniConfig();
      
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
              content: `你是一個智能相簿創建助手。請分析用戶的語音指令，提取相簿創建信息。

返回JSON格式：
{
  "albumName": "相簿名稱",
  "theme": "主題分類",
  "keywords": ["關鍵詞1", "關鍵詞2"],
  "timeRange": "時間範圍（可選）"
}

主題分類選項：
- 家庭成長：包含小孩、寶寶、成長、長大等
- 旅遊紀錄：包含旅行、出遊、景點等  
- 慶祝活動：包含生日、派對、節日等
- 日常生活：包含日常、生活、家庭等
- 美食記錄：包含美食、料理、餐廳等
- 運動健身：包含運動、健身、戶外等

範例：
用戶說："幫我做一個小孩的成長視頻"
輸出：{"albumName":"小孩成長記錄","theme":"家庭成長","keywords":["小孩","成長","視頻"],"timeRange":null}`
            }, {
              role: "user",
              content: text
            }]
          },
          parameters: {
            result_format: "json_object",
            max_tokens: 500
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`AI解析API錯誤: ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.output?.text || '{}';
      
      try {
        const parsed = JSON.parse(resultText);
        return {
          albumName: parsed.albumName || '新相簿',
          theme: parsed.theme || '日常生活',
          keywords: parsed.keywords || [],
          timeRange: parsed.timeRange || undefined
        };
      } catch (parseError) {
        // 如果JSON解析失敗，回退到基本解析
        console.warn('AI返回的JSON解析失敗，使用備用解析');
        return this.parseAlbumCommandBasic(text);
      }
    } catch (error) {
      console.error('AI解析失敗，使用備用解析:', error);
      return this.parseAlbumCommandBasic(text);
    }
  }

  // 備用的基本指令解析
  private parseAlbumCommandBasic(text: string): AlbumCreationRequest {
    const albumPatterns = [
      /創建(.+?)相簿/,
      /幫我創建(.+?)相簿/,
      /做一個(.+?)相簿/,
      /做一個(.+?)視頻/,
      /幫我做(.+?)視頻/,
      /整理(.+?)相簿/
    ];

    let albumName = '';
    let theme = '日常生活';
    let keywords: string[] = [];

    for (const pattern of albumPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        albumName = match[1].trim();
        break;
      }
    }

    if (!albumName) {
      albumName = this.extractAlbumNameFromText(text);
    }

    // 提取關鍵詞
    keywords = this.extractKeywords(text);
    
    // 推斷主題
    theme = this.inferThemeFromText(text);

    return {
      albumName: albumName || '新相簿',
      theme: theme,
      keywords: keywords
    };
  }

  // 從文字中提取相簿名稱
  private extractAlbumNameFromText(text: string): string {
    const cleanText = text
      .replace(/創建|幫我|做一個|整理|相簿|視頻/g, '')
      .trim();
    
    return cleanText || '新相簿';
  }

  // 提取關鍵詞
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const keywordPatterns = [
      '小孩', '孩子', '寶寶', '嬰兒', '成長', '長大',
      '生日', '派對', '慶祝', '節日',
      '旅行', '旅遊', '出遊', '景點',
      '美食', '料理', '餐廳', '食物',
      '運動', '健身', '戶外', '活動',
      '家庭', '日常', '生活', '記錄'
    ];

    keywordPatterns.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return keywords;
  }

  // 根據文字推斷主題
  private inferThemeFromText(text: string): string {
    const themeMap: { [key: string]: string } = {
      '小孩': '家庭成長',
      '孩子': '家庭成長',
      '寶寶': '家庭成長',
      '嬰兒': '家庭成長',
      '成長': '家庭成長',
      '長大': '家庭成長',
      '生日': '慶祝活動',
      '派對': '慶祝活動',
      '慶祝': '慶祝活動',
      '節日': '慶祝活動',
      '旅行': '旅遊紀錄',
      '旅遊': '旅遊紀錄',
      '出遊': '旅遊紀錄',
      '美食': '美食記錄',
      '料理': '美食記錄',
      '餐廳': '美食記錄',
      '運動': '運動健身',
      '健身': '運動健身',
      '戶外': '運動健身'
    };

    for (const keyword in themeMap) {
      if (text.includes(keyword)) {
        return themeMap[keyword];
      }
    }

    return '日常生活';
  }

  // 分析照片內容
  async analyzePhotoContent(base64Image: string): Promise<PhotoAnalysis> {
    try {
      const config = await getOmniConfig();
      
      const response = await fetch(`${config.baseURL}/api/v1/services/aigc/multimodal-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
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
                    text: `請分析這張照片的內容，返回JSON格式：
{
  "tags": ["標籤1", "標籤2"],
  "description": "照片描述",
  "hasChildren": true/false,
  "isGrowthMoment": true/false,
  "scenery": ["場景1", "場景2"],
  "confidence": 0.95
}

重點關注：
1. 是否包含兒童（hasChildren）
2. 是否是成長時刻（isGrowthMoment）：如第一步、學習、慶祝等
3. 場景和環境
4. 關鍵標籤`
                  }
                ]
              }
            ]
          },
          parameters: {
            "max_tokens": 1000,
            "temperature": 0.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`照片分析API錯誤: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.output?.choices?.[0]?.message?.content?.[0]?.text || '';
      
      if (responseText) {
        try {
          const analysis = JSON.parse(responseText);
          return {
            tags: analysis.tags || [],
            confidence: analysis.confidence || 0.5,
            description: analysis.description || '',
            hasChildren: analysis.hasChildren || false,
            isGrowthMoment: analysis.isGrowthMoment || false,
            scenery: analysis.scenery || []
          };
        } catch (parseError) {
          console.warn('照片分析JSON解析失敗');
        }
      }
      
      // 返回默認分析
      return {
        tags: ['照片'],
        confidence: 0.3,
        description: '無法分析照片內容',
        hasChildren: false,
        isGrowthMoment: false,
        scenery: []
      };
    } catch (error) {
      console.error('照片分析失敗:', error);
      return {
        tags: ['照片'],
        confidence: 0.1,
        description: '照片分析失敗',
        hasChildren: false,
        isGrowthMoment: false,
        scenery: []
      };
    }
  }
}

// 智能相簿創建服務
export class SmartAlbumCreator {
  private static instance: SmartAlbumCreator;
  private voiceService: VoiceAlbumService;
  
  static getInstance(): SmartAlbumCreator {
    if (!SmartAlbumCreator.instance) {
      SmartAlbumCreator.instance = new SmartAlbumCreator();
    }
    return SmartAlbumCreator.instance;
  }

  constructor() {
    this.voiceService = VoiceAlbumService.getInstance();
  }

  // 智能創建相簿（根據關鍵詞自動篩選照片）
  async createSmartAlbumIntelligent(albumName: string, theme: string, keywords: string[]): Promise<SmartAlbum> {
    try {
      console.log(`開始創建智能相簿: ${albumName}, 主題: ${theme}, 關鍵詞:`, keywords);
      
      // 1. 獲取媒體庫權限
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (!mediaPermission.granted) {
        throw new Error('需要媒體庫權限才能創建智能相簿');
      }

      // 2. 獲取所有照片
      console.log('正在獲取照片...');
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 100, // 限制數量避免性能問題
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      if (assets.assets.length === 0) {
        throw new Error('未找到任何照片');
      }

      console.log(`找到 ${assets.assets.length} 張照片，開始智能篩選...`);

      // 3. 智能篩選照片
      const selectedAssets = await this.selectRelevantPhotos(assets.assets, theme, keywords);
      
      if (selectedAssets.length === 0) {
        // 如果智能篩選沒有結果，提供手動選擇選項
        Alert.alert(
          '未找到相關照片',
          '未找到符合主題的照片，您想手動選擇照片嗎？',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '手動選擇', 
              onPress: () => this.createSmartAlbumManual(albumName, theme)
            }
          ]
        );
        throw new Error('未找到符合主題的照片');
      }

      // 4. 轉換為ImagePicker格式
      const selectedPhotos = await this.convertAssetsToImagePicker(selectedAssets);

      // 5. 生成相簿故事
      const story = await this.generateAlbumStoryWithAI(albumName, theme, selectedPhotos);

      const smartAlbum: SmartAlbum = {
        id: `smart_album_${Date.now()}`,
        name: albumName,
        theme: theme,
        photos: selectedPhotos,
        story: story,
        coverPhoto: selectedPhotos[0],
        createdAt: new Date()
      };

      console.log(`智能相簿創建完成，包含 ${selectedPhotos.length} 張照片`);
      return smartAlbum;
      
    } catch (error: any) {
      console.error('創建智能相簿失敗:', error);
      throw error;
    }
  }

  // 手動選擇照片創建相簿（備用方案）
  async createSmartAlbumManual(albumName: string, theme: string): Promise<SmartAlbum> {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        throw new Error('需要媒體庫權限才能創建智能相簿');
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 20,
      });

      if (pickerResult.canceled || !pickerResult.assets) {
        throw new Error('用戶取消了照片選擇');
      }

      const selectedPhotos = pickerResult.assets;
      const story = await this.generateAlbumStoryWithAI(albumName, theme, selectedPhotos);

      const smartAlbum: SmartAlbum = {
        id: `smart_album_${Date.now()}`,
        name: albumName,
        theme: theme,
        photos: selectedPhotos,
        story: story,
        coverPhoto: selectedPhotos[0],
        createdAt: new Date()
      };

      return smartAlbum;
    } catch (error: any) {
      console.error('手動創建相簿失敗:', error);
      throw error;
    }
  }

  // 智能篩選相關照片
  private async selectRelevantPhotos(assets: MediaLibrary.Asset[], theme: string, keywords: string[]): Promise<MediaLibrary.Asset[]> {
    const relevantPhotos: Array<{asset: MediaLibrary.Asset, score: number}> = [];
    const maxPhotosToAnalyze = Math.min(50, assets.length); // 限制分析數量
    
    console.log(`開始分析 ${maxPhotosToAnalyze} 張照片...`);

    for (let i = 0; i < maxPhotosToAnalyze; i++) {
      const asset = assets[i];
      try {
        // 獲取照片的base64
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        if (!assetInfo.uri) continue;

        // 將照片轉為base64
        const base64 = await FileSystem.readAsStringAsync(assetInfo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // AI分析照片內容
        const analysis = await this.voiceService.analyzePhotoContent(base64);
        
        // 計算相關性評分
        let score = 0;
        
        // 主題匹配
        if (theme === '家庭成長' && (analysis.hasChildren || analysis.isGrowthMoment)) {
          score += 30;
        }
        
        // 關鍵詞匹配
        keywords.forEach(keyword => {
          if (analysis.tags.some(tag => tag.includes(keyword) || keyword.includes(tag))) {
            score += 20;
          }
          if (analysis.description.includes(keyword)) {
            score += 10;
          }
        });

        // 置信度加權
        score *= analysis.confidence;

        console.log(`照片 ${i+1} 分析完成，評分: ${score.toFixed(2)}`);

        if (score > 15) { // 設定閾值
          relevantPhotos.push({ asset, score });
        }
        
        // 避免處理過久
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.warn(`分析照片 ${i+1} 失敗:`, error);
        continue;
      }
    }

    // 按評分排序並返回最佳照片
    const sortedPhotos = relevantPhotos
      .sort((a, b) => b.score - a.score)
      .slice(0, 15) // 最多選15張
      .map(item => item.asset);

    console.log(`智能篩選完成，選出 ${sortedPhotos.length} 張相關照片`);
    return sortedPhotos;
  }

  // 將MediaLibrary.Asset轉換為ImagePicker.ImagePickerAsset
  private async convertAssetsToImagePicker(assets: MediaLibrary.Asset[]): Promise<ImagePicker.ImagePickerAsset[]> {
    const result: ImagePicker.ImagePickerAsset[] = [];
    
    for (const asset of assets) {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        if (assetInfo.uri) {
          result.push({
            id: asset.id,
            uri: assetInfo.uri,
            width: asset.width,
            height: asset.height,
            fileName: asset.filename,
            fileSize: assetInfo.fileSize,
            type: 'image',
            mimeType: 'image/jpeg',
          } as ImagePicker.ImagePickerAsset);
        }
      } catch (error) {
        console.warn(`轉換照片 ${asset.id} 失敗:`, error);
      }
    }
    
    return result;
  }

  // 使用AI生成相簿故事
  private async generateAlbumStoryWithAI(albumName: string, theme: string, photos: ImagePicker.ImagePickerAsset[]): Promise<string> {
    try {
      const config = await getOmniConfig();
      
      // 分析前3張照片的內容來生成更個性化的故事
      const analysisPromises = photos.slice(0, 3).map(async (photo) => {
        try {
          if (!photo.uri) return null;
          const base64 = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return await this.voiceService.analyzePhotoContent(base64);
        } catch {
          return null;
        }
      });

      const analyses = (await Promise.all(analysisPromises)).filter(Boolean);
      
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
              content: `你是一個溫馨的家庭相簿故事創作者。根據相簿信息創作一個感人的故事。

要求：
1. 語言溫暖親切，充滿愛意
2. 100-200字左右
3. 突出成長和回憶的珍貴
4. 適合家庭分享`
            }, {
              role: "user",
              content: `相簿名稱：${albumName}
主題：${theme}
照片數量：${photos.length}張
照片分析：${analyses.map(a => a?.description).filter(Boolean).join('；')}

請為這個相簿創作一個溫馨的故事。`
            }]
          },
          parameters: {
            max_tokens: 300,
            temperature: 0.7
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiStory = data.output?.text;
        if (aiStory && aiStory.trim()) {
          return aiStory.trim();
        }
      }
    } catch (error) {
      console.warn('AI生成故事失敗，使用模板:', error);
    }

    // AI失敗時的備用模板
    return this.generateStoryTemplate(albumName, theme, photos.length);
  }

  // 備用故事模板
  private generateStoryTemplate(albumName: string, theme: string, photoCount: number): string {
    const templates: { [key: string]: string[] } = {
      '家庭成長': [
        `${albumName}記錄了最珍貴的成長時光。每一個笑容、每一次嘗試、每一個里程碑，都是愛與陪伴的見證。這${photoCount}張照片，定格了最美好的瞬間，見證著小小生命的蓬勃生長。`,
        `在${albumName}中，我們珍藏著成長路上的每一步足跡。從蹣跚學步到燦爛笑容，從好奇探索到勇敢嘗試，${photoCount}張照片記錄了無數個溫馨時刻，每一張都閃耀著愛的光芒。`
      ],
      '旅遊紀錄': [
        `${albumName}帶我們重溫那段美妙的旅程。從出發時的興奮到歸來時的滿足，每一處風景都留下了美好回憶。這${photoCount}張照片，記錄了我們一起走過的路，見過的景，分享的快樂時光。`
      ],
      '慶祝活動': [
        `${albumName}捕捉了歡樂時光的每一個精彩瞬間。歡聲笑語、溫馨擁抱、幸福笑容，${photoCount}張照片記錄了這個特別的日子，每一張都充滿了愛與祝福，值得永遠珍藏。`
      ]
    };

    const themeTemplates = templates[theme] || templates['家庭成長'];
    const selectedTemplate = themeTemplates[Math.floor(Math.random() * themeTemplates.length)];
    
    return selectedTemplate;
  }

  // 生成成長視頻
  async generateGrowthVideo(photos: ImagePicker.ImagePickerAsset[], musicStyle: string = 'emotional'): Promise<VideoGenerationResult> {
    try {
      console.log(`開始生成成長視頻，照片數量: ${photos.length}`);
      
      // 這裡將實現視頻生成邏輯
      // 目前返回模擬結果，實際應整合視頻生成服務
      await new Promise(resolve => setTimeout(resolve, 3000)); // 模擬處理時間
      
      return {
        success: true,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // 臨時視頻
      };
    } catch (error: any) {
      console.error('視頻生成失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 導出主要服務實例
export const voiceAlbumService = VoiceAlbumService.getInstance();
export const smartAlbumCreator = SmartAlbumCreator.getInstance();