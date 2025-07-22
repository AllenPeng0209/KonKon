import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Database } from './database.types';
import { supabase } from './supabase';

type User = Database['public']['Tables']['users']['Row'];

export interface AvatarUploadResult {
  success: boolean;
  avatarUrl?: string;
  error?: string;
}

export class AvatarService {
  // 默認頭像列表 - 使用 emoji 或本地資源
  private static readonly DEFAULT_AVATARS = [
    '👤', '👨', '👩', '🧑', '👦', '👧',
    '🐶', '🐱', '🐰', '🐻', '🐼', '🦊',
    '🌟', '🌈', '🎨', '🎭', '🎪', '🎯'
  ];

  /**
   * 獲取默認頭像
   */
  static getDefaultAvatar(userId?: string): string {
    if (!userId) {
      return AvatarService.DEFAULT_AVATARS[0];
    }
    
    // 根據用戶ID生成一個一致的默認頭像
    const hash = AvatarService.hashCode(userId);
    const index = Math.abs(hash) % AvatarService.DEFAULT_AVATARS.length;
    return AvatarService.DEFAULT_AVATARS[index];
  }

  /**
   * 生成頭像佔位符 URL
   */
  static getPlaceholderUrl(name: string = '用戶', size: number = 80): string {
    const initial = name.charAt(0).toUpperCase();
    const colors = ['87CEEB', '98FB98', 'F0E68C', 'DDA0DD', 'F4A460', 'B0E0E6'];
    const colorIndex = AvatarService.hashCode(name) % colors.length;
    const bgColor = colors[Math.abs(colorIndex)];
    
    return `https://via.placeholder.com/${size}x${size}/${bgColor}/FFFFFF?text=${encodeURIComponent(initial)}`;
  }

  /**
   * 字符串哈希函數
   */
  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * 請求相機權限
   */
  static async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  /**
   * 請求媒體庫權限
   */
  static async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * 從相機拍照選擇頭像
   */
  static async pickFromCamera(): Promise<ImagePicker.ImagePickerAsset | null> {
    const hasPermission = await AvatarService.requestCameraPermission();
    if (!hasPermission) {
      throw new Error('需要相機權限才能拍照');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [1, 1], // 正方形
      quality: 0.8,
      base64: false,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  }

  /**
   * 從相冊選擇頭像
   */
  static async pickFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
    const hasPermission = await AvatarService.requestMediaLibraryPermission();
    if (!hasPermission) {
      throw new Error('需要相冊權限才能選擇照片');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [1, 1], // 正方形
      quality: 0.8,
      base64: false,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  }

  /**
   * 上傳頭像到 Supabase Storage
   */
  static async uploadAvatar(imageAsset: ImagePicker.ImagePickerAsset): Promise<AvatarUploadResult> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          success: false,
          error: '用戶未登入'
        };
      }

      // 讀取圖片文件
      const fileInfo = await FileSystem.getInfoAsync(imageAsset.uri);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: '圖片文件不存在'
        };
      }

      // 生成文件名
      const fileExt = imageAsset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 讀取文件為 base64
      const base64 = await FileSystem.readAsStringAsync(imageAsset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 轉換為 Uint8Array
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // 上傳到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, byteArray, {
          contentType: `image/${fileExt}`,
          upsert: true, // 允許覆蓋
        });

      if (uploadError) {
        console.error('上傳錯誤:', uploadError);
        return {
          success: false,
          error: `上傳失敗: ${uploadError.message}`
        };
      }

      // 獲取公共 URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // 更新用戶資料
      const updateResult = await AvatarService.updateUserAvatar(avatarUrl);
      if (!updateResult.success) {
        return updateResult;
      }

      return {
        success: true,
        avatarUrl
      };

    } catch (error: any) {
      console.error('頭像上傳錯誤:', error);
      return {
        success: false,
        error: `上傳失敗: ${error.message}`
      };
    }
  }

  /**
   * 更新用戶頭像 URL 到數據庫
   */
  static async updateUserAvatar(avatarUrl: string): Promise<AvatarUploadResult> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          success: false,
          error: '用戶未登入'
        };
      }

      // 更新 public.users 表
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('數據庫更新錯誤:', updateError);
        return {
          success: false,
          error: `數據庫更新失敗: ${updateError.message}`
        };
      }

      // 也更新 auth.users 的 user_metadata
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });

      if (authUpdateError) {
        console.warn('Auth metadata 更新失敗:', authUpdateError);
        // 不返回錯誤，因為主要數據已經更新成功
      }

      return {
        success: true,
        avatarUrl
      };

    } catch (error: any) {
      console.error('更新用戶頭像錯誤:', error);
      return {
        success: false,
        error: `更新失敗: ${error.message}`
      };
    }
  }

  /**
   * 刪除用戶頭像
   */
  static async deleteUserAvatar(): Promise<AvatarUploadResult> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          success: false,
          error: '用戶未登入'
        };
      }

      // 獲取當前頭像 URL
      const { data: userData } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      // 如果有頭像文件，嘗試從 Storage 刪除
      if (userData?.avatar_url && userData.avatar_url.includes('avatars/')) {
        const fileName = userData.avatar_url.split('/').pop();
        if (fileName) {
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([`avatars/${fileName}`]);
          
          if (deleteError) {
            console.warn('刪除 Storage 文件失敗:', deleteError);
          }
        }
      }

      // 更新數據庫，設置為 null
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        return {
          success: false,
          error: `數據庫更新失敗: ${updateError.message}`
        };
      }

      // 也更新 auth.users 的 user_metadata
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });

      if (authUpdateError) {
        console.warn('Auth metadata 更新失敗:', authUpdateError);
      }

      return {
        success: true
      };

    } catch (error: any) {
      console.error('刪除用戶頭像錯誤:', error);
      return {
        success: false,
        error: `刪除失敗: ${error.message}`
      };
    }
  }

  /**
   * 獲取用戶頭像 URL
   */
  static async getUserAvatarUrl(userId: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('users')
        .select('avatar_url, display_name')
        .eq('id', userId)
        .single();

      return data?.avatar_url || null;
    } catch (error) {
      console.error('獲取用戶頭像錯誤:', error);
      return null;
    }
  }

  /**
   * 獲取用戶頭像 URL 或默認頭像
   */
  static async getUserAvatarOrDefault(userId: string, displayName?: string): Promise<string> {
    const avatarUrl = await AvatarService.getUserAvatarUrl(userId);
    
    if (avatarUrl) {
      return avatarUrl;
    }

    // 返回佔位符 URL
    return AvatarService.getPlaceholderUrl(displayName || '用戶');
  }
}

export default AvatarService; 