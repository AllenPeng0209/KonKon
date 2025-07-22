import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import AvatarService from '../../lib/avatarService';

interface AvatarProps {
  userId?: string;
  avatarUrl?: string | null;
  displayName?: string;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
  showInitial?: boolean; // 是否顯示名稱首字母
}

export const Avatar: React.FC<AvatarProps> = ({
  userId,
  avatarUrl,
  displayName = '用戶',
  size = 40,
  style,
  imageStyle,
  textStyle,
  showInitial = false
}) => {
  const [finalAvatarUrl, setFinalAvatarUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadAvatar();
  }, [userId, avatarUrl, displayName]);

  const loadAvatar = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      let url = avatarUrl;

      // 如果沒有提供 avatarUrl，但有 userId，則從數據庫獲取
      if (!url && userId) {
        url = await AvatarService.getUserAvatarUrl(userId);
      }

      // 如果仍然沒有頭像，使用默認頭像
      if (!url) {
        url = AvatarService.getPlaceholderUrl(displayName, size);
      }

      setFinalAvatarUrl(url);
    } catch (error) {
      console.error('載入頭像失敗:', error);
      setHasError(true);
      // 設置默認頭像
      setFinalAvatarUrl(AvatarService.getPlaceholderUrl(displayName, size));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    setHasError(true);
    // 如果圖片載入失敗，使用默認頭像
    setFinalAvatarUrl(AvatarService.getPlaceholderUrl(displayName, size));
  };

  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: size / 2 },
    style
  ];

  const defaultImageStyle = [
    styles.image,
    { width: size, height: size, borderRadius: size / 2 },
    imageStyle
  ];

  // 如果要顯示首字母且沒有有效的頭像 URL，或者有錯誤
  if (showInitial && (!finalAvatarUrl || hasError || finalAvatarUrl.includes('placeholder'))) {
    const initial = displayName.charAt(0).toUpperCase();
    const fontSize = size * 0.4; // 字體大小是容器大小的 40%
    
    return (
      <View style={[containerStyle, styles.initialContainer]}>
        <Text style={[styles.initialText, { fontSize }, textStyle]}>
          {initial}
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[containerStyle, styles.loadingContainer]}>
        <Text style={[styles.loadingText, textStyle]}>...</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: finalAvatarUrl }}
        style={defaultImageStyle}
        onError={handleImageError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
  },
  image: {
    resizeMode: 'cover',
  },
  initialContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#87CEEB',
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  loadingText: {
    color: '#999999',
    fontSize: 12,
  },
});

export default Avatar; 