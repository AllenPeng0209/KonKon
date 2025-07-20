import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface AlbumCreationRequest {
  albumName: string;
  theme?: string;
  timeRange?: string;
  style?: string;
}

export interface ParsedAlbumResult {
  albumName: string;
  theme: string;
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
      // 這裡應該調用語音識別API將語音轉為文字
      const transcribedText = await this.speechToText(audioBase64);
      console.log('轉錄文字:', transcribedText);
      
      // 使用AI解析相簿創建指令
      const albumRequest = await this.parseAlbumCommand(transcribedText);
      
      return {
        albumName: albumRequest.albumName,
        theme: albumRequest.theme || '日常生活',
        success: true
      };
    } catch (error: any) {
      console.error('語音處理失敗:', error);
      return {
        albumName: '',
        theme: '',
        success: false,
        error: error.message
      };
    }
  }

  // 語音轉文字 (模擬實現，實際應使用語音識別服務)
  private async speechToText(audioBase64: string): Promise<string> {
    // TODO: 集成實際的語音識別服務
    // 暫時返回模擬數據
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模擬語音識別結果
    const mockCommands = [
      '幫我創建生日派對相簿',
      '創建家庭旅行相簿',
      '做一個美食記錄相簿',
      '創建寶寶成長相簿',
      '幫我整理週末活動相簿'
    ];
    
    return mockCommands[Math.floor(Math.random() * mockCommands.length)];
  }

  // 解析語音指令中的相簿信息
  async parseAlbumCommand(text: string): Promise<AlbumCreationRequest> {
    // 使用正則表達式和關鍵詞匹配解析相簿名稱和主題
    const albumPatterns = [
      /創建(.+?)相簿/,
      /幫我創建(.+?)相簿/,
      /做一個(.+?)相簿/,
      /整理(.+?)相簿/
    ];

    let albumName = '';
    let theme = '';

    for (const pattern of albumPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        albumName = match[1].trim();
        theme = this.inferThemeFromName(albumName);
        break;
      }
    }

    if (!albumName) {
      // 如果沒有匹配到特定格式，嘗試提取關鍵詞
      albumName = this.extractAlbumNameFromText(text);
      theme = this.inferThemeFromName(albumName);
    }

    return {
      albumName: albumName || '新相簿',
      theme: theme || '日常生活'
    };
  }

  // 從文字中提取相簿名稱
  private extractAlbumNameFromText(text: string): string {
    // 移除常見的指令詞匯
    const cleanText = text
      .replace(/創建|幫我|做一個|整理|相簿/g, '')
      .trim();
    
    return cleanText || '新相簿';
  }

  // 根據相簿名稱推斷主題
  private inferThemeFromName(name: string): string {
    const themeMap: { [key: string]: string } = {
      '生日': '慶祝活動',
      '派對': '慶祝活動',
      '旅行': '旅遊紀錄',
      '美食': '美食記錄',
      '寶寶': '家庭成長',
      '成長': '家庭成長',
      '週末': '日常生活',
      '假期': '假期回憶',
      '聚會': '慶祝活動',
      '運動': '運動健身',
      '工作': '工作記錄'
    };

    for (const keyword in themeMap) {
      if (name.includes(keyword)) {
        return themeMap[keyword];
      }
    }

    return '日常生活';
  }
}

// 智能相簿創建服務
export class SmartAlbumCreator {
  private static instance: SmartAlbumCreator;
  
  static getInstance(): SmartAlbumCreator {
    if (!SmartAlbumCreator.instance) {
      SmartAlbumCreator.instance = new SmartAlbumCreator();
    }
    return SmartAlbumCreator.instance;
  }

  // 從手機相簿中智能選取照片創建主題相簿
  async createSmartAlbum(albumName: string, theme: string): Promise<SmartAlbum> {
    try {
      // 獲取媒體庫權限
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        throw new Error('需要媒體庫權限才能創建智能相簿');
      }

      // 使用 ImagePicker 選取多張照片作為模擬智能選取
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 20, // 限制選擇數量
      });

      if (pickerResult.canceled || !pickerResult.assets) {
        throw new Error('用戶取消了照片選擇');
      }

      const selectedPhotos = pickerResult.assets;
      
      // 生成相簿故事
      const story = await this.generateAlbumStory(albumName, theme, selectedPhotos);
      
      // 選擇封面照片
      const coverPhoto = selectedPhotos.length > 0 ? selectedPhotos[0] : undefined;

      const smartAlbum: SmartAlbum = {
        id: `smart_album_${Date.now()}`,
        name: albumName,
        theme: theme,
        photos: selectedPhotos,
        story: story,
        coverPhoto: coverPhoto,
        createdAt: new Date()
      };

      return smartAlbum;
    } catch (error: any) {
      console.error('創建智能相簿失敗:', error);
      throw error;
    }
  }

  // 根據主題智能選擇照片 (已移除，改用ImagePicker直接選取)
  private async selectPhotosByTheme(photos: ImagePicker.ImagePickerAsset[], theme: string): Promise<ImagePicker.ImagePickerAsset[]> {
    // 簡化版本：根據主題返回不同數量的照片
    const maxPhotos = theme === '家庭成長' ? 25 : theme === '旅遊紀錄' ? 20 : 15;
    return photos.slice(0, maxPhotos);
  }

  // 生成相簿故事
  private async generateAlbumStory(albumName: string, theme: string, photos: ImagePicker.ImagePickerAsset[]): Promise<string> {
    // 這裡應該使用AI來分析照片內容並生成故事
    // 暫時使用模板生成
    
    const storyTemplates: { [key: string]: string[] } = {
      '慶祝活動': [
        `${albumName}記錄了一個特別的慶祝時刻。從準備到歡樂的瞬間，每一張照片都充滿了溫暖的回憶。`,
        `這次的${albumName}充滿了歡聲笑語，大家齊聚一堂，共度美好時光。這些珍貴的瞬間值得永遠珍藏。`
      ],
      '旅遊紀錄': [
        `${albumName}帶我們踏上了一段美妙的旅程。從出發的興奮到沿途的風景，每個瞬間都是獨特的冒險。`,
        `這次的${albumName}讓我們探索了新的地方，體驗了不同的文化，留下了難忘的回憶。`
      ],
      '家庭成長': [
        `${albumName}記錄了寶貴的成長足跡。從小小的變化到重要的里程碑，見證了時光的流逝和愛的延續。`,
        `通過${albumName}，我們看到了成長的軌跡，每一個瞬間都是珍貴的回憶，充滿了愛與關懷。`
      ],
      '日常生活': [
        `${albumName}捕捉了平凡而美好的日常時光。這些看似普通的瞬間，卻是生活中最真實的幸福。`,
        `在${albumName}中，我們珍藏了日常生活的點點滴滴，每一個平凡的瞬間都閃閃發光。`
      ]
    };

    const templates = storyTemplates[theme] || storyTemplates['日常生活'];
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    return `${selectedTemplate}\n\n共收錄了 ${photos.length} 張珍貴照片，每一張都訴說著屬於我們的故事。`;
  }
}

// 導出主要服務實例
export const voiceAlbumService = VoiceAlbumService.getInstance();
export const smartAlbumCreator = SmartAlbumCreator.getInstance();