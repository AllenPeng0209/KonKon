import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface PhotoViewerProps {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  visible,
  images,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const savePhotoToLibrary = async (imageUrl: string) => {
    try {
      // 請求媒體庫權限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('權限被拒絕', '需要相簿權限才能保存照片');
        return;
      }

      // 下載照片
      const filename = imageUrl.split('/').pop() || `photo_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      if (downloadResult.status === 200) {
        // 保存到相簿
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        
        // 創建相簿（如果不存在）
        const albumName = 'KonKon 事件照片';
        let album;
        try {
          album = await MediaLibrary.getAlbumAsync(albumName);
        } catch (error) {
          album = null;
        }
        
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        }

        Alert.alert('保存成功', '照片已保存到相簿');
        
        // 清理臨時文件
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } else {
        throw new Error('下載失敗');
      }
    } catch (error: any) {
      console.error('保存照片失敗:', error);
      Alert.alert('保存失敗', error.message || '無法保存照片到相簿');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.counter}>
            {currentIndex + 1} / {images.length}
          </Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => savePhotoToLibrary(images[currentIndex])}
          >
            <Text style={styles.saveText}>保存</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setCurrentIndex(newIndex);
          }}
          contentOffset={{ x: currentIndex * screenWidth, y: 0 }}
        >
          {images.map((imageUrl, index) => (
            <View key={index} style={styles.imageContainer}>
              <TouchableOpacity
                onLongPress={() => {
                  Alert.alert(
                    '保存照片', 
                    '長按已觸發！要保存這張照片嗎？',
                    [
                      { text: '取消', style: 'cancel' },
                      { text: '保存', onPress: () => savePhotoToLibrary(imageUrl) }
                    ]
                  );
                }}
                activeOpacity={1}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        
        {images.length > 1 && (
          <View style={styles.dots}>
            {images.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.activeDot
                ]} 
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderRadius: 20,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth - 40,
    height: '80%',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
}); 