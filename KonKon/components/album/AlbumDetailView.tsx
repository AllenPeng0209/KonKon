import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { videoGenerationService } from '@/lib/videoGenerationService';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type SimpleAlbum = Tables<'family_albums'> & {
  user_name?: string;
};

type AlbumPhoto = Tables<'album_photos'>;

interface AlbumDetailViewProps {
  album: SimpleAlbum;
  isVisible: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onPhotoAdded?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const PHOTO_SIZE = (screenWidth - 48) / 2; // 2 columns with padding

const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({ album, isVisible, onClose, onDelete, onPhotoAdded }) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  // Video generation states
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<string>('upbeat');
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  
  // Delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // More menu states
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isVisible && album) {
      fetchAlbumPhotos();
      // Check if there's already a generated video for this album
      checkExistingVideo();
    }
  }, [isVisible, album]);

  // Music options
  const musicOptions = [
    { id: 'upbeat', name: '歡快輕鬆', icon: '🎵' },
    { id: 'emotional', name: '溫馨感人', icon: '💖' },
    { id: 'peaceful', name: '寧靜祥和', icon: '🌸' },
    { id: 'adventure', name: '冒險刺激', icon: '🚀' },
    { id: 'nostalgic', name: '懷舊經典', icon: '📻' },
  ];

  const fetchAlbumPhotos = async () => {
    if (!album) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('album_photos')
        .select('*')
        .eq('album_id', album.id)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching album photos:', error);
        return;
      }

      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching album photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingVideo = async () => {
    // Check if there's a generated video stored for this album
    // For now, we'll disable this functionality until metadata field is added to database
    // if (album.metadata && typeof album.metadata === 'object') {
    //   const metadata = album.metadata as any;
    //   if (metadata.generated_video_url) {
    //     setGeneratedVideoUrl(metadata.generated_video_url);
    //   }
    // }
    console.log('Video generation feature temporarily disabled - metadata field needed');
  };

  const generateVideo = async () => {
    if (displayPhotos.length === 0) {
      Alert.alert('無法生成視頻', '此相簿沒有照片');
      return;
    }

    setIsGeneratingVideo(true);
    
    try {
      console.log('開始使用AI生成視頻...');
      
      // 將 AlbumPhoto 轉換為 ImagePickerAsset 格式
      const photoAssets = displayPhotos.map((photo, index) => ({
        uri: photo.image_url,
        width: 1080,
        height: 1080,
        fileName: `photo_${index}.jpg`,
        type: 'image' as const,
        mimeType: 'image/jpeg',
      }));

      // 準備視頻生成選項
      const videoOptions = {
        photos: photoAssets,
        musicStyle: selectedMusic as 'upbeat' | 'emotional' | 'peaceful' | 'adventure' | 'nostalgic',
        albumId: album.id,
        albumName: album.name,
        theme: album.theme || '日常生活'
      };

      console.log('調用視頻生成服務...');
      const result = await videoGenerationService.generateSlideShowVideo(videoOptions);
      
      if (result.success && result.videoUrl) {
        setGeneratedVideoUrl(result.videoUrl);
        
        // 更新相簿元數據（如果數據庫支持）
        try {
          const updateData = {
            // 只更新已存在的字段
            updated_at: new Date().toISOString()
          };
          
          await supabase
            .from('family_albums')
            .update(updateData)
            .eq('id', album.id);
            
          console.log('相簿更新成功');
        } catch (updateError) {
          console.warn('更新相簿元數據失敗（非關鍵錯誤）:', updateError);
        }
        
        Alert.alert(
          '視頻生成成功', 
          `您的相簿視頻已準備就緒！\n時長：${Math.round(result.duration || 30)}秒`,
          [{ text: '太棒了！', style: 'default' }]
        );
      } else {
        throw new Error(result.error || '視頻生成失敗');
      }
      
    } catch (error: any) {
      console.error('視頻生成錯誤:', error);
      Alert.alert(
        '生成失敗', 
        error.message || '視頻生成過程中出現錯誤，請稍後重試',
        [
          { text: '稍後重試', style: 'cancel' },
          { text: '重新嘗試', onPress: generateVideo }
        ]
      );
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!user || !album) return;
    
    setIsDeleting(true);
    try {
      // 1. 刪除存儲中的照片文件
      const { data: objects } = await supabase.storage
        .from('memories')
        .list(`${album.family_id}/${album.user_id}`);
        
      if (objects && objects.length > 0) {
        const filesToDelete = objects
          .filter(obj => album.image_urls?.some(url => url.includes(obj.name)))
          .map(obj => `${album.family_id}/${album.user_id}/${obj.name}`);
          
        if (filesToDelete.length > 0) {
          await supabase.storage.from('memories').remove(filesToDelete);
        }
      }

      // 2. 刪除 album_photos 記錄
      await supabase
        .from('album_photos')
        .delete()
        .eq('album_id', album.id);

      // 3. 刪除相簿記錄
      const { error: deleteError } = await supabase
        .from('family_albums')
        .delete()
        .eq('id', album.id);

      if (deleteError) throw deleteError;

      Alert.alert('刪除成功', '相簿已刪除');
      
      // 通知父組件更新
      try {
        if (onDelete && typeof onDelete === 'function') {
          onDelete();
        }
      } catch (error) {
        console.error('Error calling onDelete callback:', error);
      }
      
      onClose();
    } catch (error: any) {
      console.error('刪除相簿失敗:', error);
      Alert.alert('刪除失敗', error.message || '無法刪除相簿');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddPhotos = async () => {
    console.log('handleAddPhotos called');
    try {
      // 檢查是否在模擬器上運行
      const isSimulator = __DEV__ && (Platform.OS === 'ios');
      
      if (isSimulator) {
        // 在模擬器上提供相機選項
        Alert.alert(
          '選擇圖片來源',
          '模擬器圖片庫可能有限制，建議使用相機',
          [
            {
              text: '相機',
              onPress: () => handleCameraPhoto(),
            },
            {
              text: '圖片庫',
              onPress: () => handleLibraryPhotos(),
            },
            {
              text: '取消',
              style: 'cancel',
            },
          ]
        );
        return;
      }
      
      // 真機上直接使用圖片庫
      await handleLibraryPhotos();
    } catch (error: any) {
      console.error('Error in handleAddPhotos:', error);
      Alert.alert('錯誤', error.message || '新增照片時發生錯誤');
    }
  };

  const handleCameraPhoto = async () => {
    try {
      // 請求相機權限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('權限被拒絕', '需要相機權限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        await processSelectedPhotos(result.assets);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('錯誤', error.message || '拍照時發生錯誤');
    }
  };

  const handleLibraryPhotos = async () => {
    try {
      // 請求相機和相冊權限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);
      if (status !== 'granted') {
        Alert.alert('權限被拒絕', '需要相冊權限才能添加照片');
        return;
      }

      // 選擇多張圖片
      console.log('About to launch image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
      });
      console.log('Image library launched');

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets.length > 0) {
        await processSelectedPhotos(result.assets);
      }
    } catch (error: any) {
      console.error('Error in handleLibraryPhotos:', error);
      Alert.alert('錯誤', error.message || '選擇照片時發生錯誤');
    }
  };

  const processSelectedPhotos = async (assets: any[]) => {
    setIsUploading(true);
    try {
      const imageUrls: string[] = [];
      
      for (const asset of assets) {
        if (!asset.uri) continue;

        const fileName = `${album.family_id}/${album.user_id}/${Date.now()}_${asset.fileName || 'photo.jpg'}`;
        
        let uploadData;
        if (asset.base64) {
          // 使用 base64 數據（與 AddMemoryModal 相同的方法）
          const { decode } = require('base64-arraybuffer');
          uploadData = decode(asset.base64);
          console.log(`Uploading ${fileName} using base64, size: ${uploadData.byteLength} bytes`);
        } else {
          // 備用方案：使用 fetch + ArrayBuffer
          const response = await fetch(asset.uri);
          uploadData = await response.arrayBuffer();
          console.log(`Uploading ${fileName} using fetch, size: ${uploadData.byteLength} bytes`);
        }

        // 上傳到 Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('memories')
          .upload(fileName, uploadData, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(data.path);
        imageUrls.push(publicUrl);
      }

      // 更新相簿的 image_urls 和 photo_count
      const updatedImageUrls = [...(album.image_urls || []), ...imageUrls];
      await supabase
        .from('family_albums')
        .update({ 
          image_urls: updatedImageUrls,
          photo_count: updatedImageUrls.length 
        })
        .eq('id', album.id);

      // 創建 album_photos 記錄
      const currentPhotoCount = photos.length;
      const albumPhotosData = imageUrls.map((url, index) => ({
        album_id: album.id,
        image_url: url,
        order_index: currentPhotoCount + index,
        caption: null,
        metadata: {}
      }));

      await supabase
        .from('album_photos')
        .insert(albumPhotosData);

      // 刷新照片列表
      fetchAlbumPhotos();
      
      // 通知父組件
      if (onPhotoAdded) {
        onPhotoAdded();
      }

      Alert.alert('上傳成功', `已添加 ${imageUrls.length} 張照片`);
      setShowAddPhotoModal(false);
      setShowMoreMenu(false);
      
    } catch (error: any) {
      console.error('上傳照片失敗:', error);
      Alert.alert('上傳失敗', error.message || '無法上傳照片');
    } finally {
      setIsUploading(false);
    }
  };

  // If album has image_urls array, use those as fallback
  const displayPhotos = photos.length > 0 ? photos : 
    (album.image_urls || []).map((url, index) => ({
      id: `fallback-${index}`,
      album_id: album.id,
      image_url: url,
      caption: null,
      order_index: index,
      metadata: null,
      created_at: new Date().toISOString(),
    }));

  const renderPhoto = ({ item, index }: { item: AlbumPhoto; index: number }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => setSelectedPhoto(item.image_url)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.photoImage}
        resizeMode="cover"
      />
      {item.caption && (
        <Text style={styles.photoCaption} numberOfLines={2}>
          {item.caption}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.albumTitle} numberOfLines={1}>
            {album.name}
          </Text>
          <TouchableOpacity 
            style={styles.moreButton} 
            onPress={() => setShowMoreMenu(true)}
            disabled={isDeleting || isUploading}
          >
            <Text style={styles.moreText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Album Info */}
        <View style={styles.albumInfo}>
          <Text style={styles.albumTheme}>{album.theme}</Text>
          {album.story && (
            <Text style={styles.albumStory}>{album.story}</Text>
          )}
          <Text style={styles.albumMeta}>
            📷 {displayPhotos.length} 張照片 • 由 {album.user_name} 創建
          </Text>
        </View>

        {/* Video Generation & Player Section */}
        <View style={styles.videoSection}>
          <Text style={styles.videoSectionTitle}>🎬 相簿視頻</Text>
          
          {generatedVideoUrl ? (
            // Show generated video
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: generatedVideoUrl }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
              />
              <TouchableOpacity 
                style={styles.regenerateButton}
                onPress={() => setShowMusicSelector(true)}
                disabled={isGeneratingVideo}
              >
                <Text style={styles.regenerateButtonText}>🎵 重新生成</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Show generation UI
            <View style={styles.generateContainer}>
              {isGeneratingVideo ? (
                <View style={styles.generatingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.generatingText}>正在生成精彩視頻...</Text>
                  <Text style={styles.generatingSubtext}>
                    AI 正在將您的照片與 {musicOptions.find(m => m.id === selectedMusic)?.name} 音樂結合
                  </Text>
                </View>
              ) : (
                <View style={styles.generatePrompt}>
                  <Text style={styles.generateIcon}>🎥</Text>
                  <Text style={styles.generateTitle}>生成相簿視頻</Text>
                  <Text style={styles.generateDescription}>
                    將您的照片自動組合成精美視頻，配上優美音樂
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.musicSelector}
                    onPress={() => setShowMusicSelector(true)}
                  >
                    <Text style={styles.musicSelectorText}>
                      {musicOptions.find(m => m.id === selectedMusic)?.icon} {musicOptions.find(m => m.id === selectedMusic)?.name}
                    </Text>
                    <Text style={styles.musicSelectorArrow}>›</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={generateVideo}
                  >
                    <Text style={styles.generateButtonText}>✨ 開始生成</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Photos Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>載入相簿照片...</Text>
          </View>
        ) : displayPhotos.length > 0 ? (
          <FlatList
            data={displayPhotos}
            renderItem={renderPhoto}
            keyExtractor={(item, index) => item.id ? `photo-${item.id}` : `fallback-${index}-${item.image_url?.split('/').pop()}`}
            numColumns={2}
            contentContainerStyle={styles.photosContainer}
            showsVerticalScrollIndicator={false}
            style={styles.photosList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>這個相簿還沒有照片</Text>
          </View>
        )}

        {/* Full Screen Photo Modal */}
        {selectedPhoto && (
          <Modal
            visible={!!selectedPhoto}
            animationType="fade"
            onRequestClose={() => setSelectedPhoto(null)}
          >
            <View style={styles.fullScreenContainer}>
              <TouchableOpacity
                style={styles.fullScreenClose}
                onPress={() => setSelectedPhoto(null)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          </Modal>
        )}

        {/* Music Selection Modal */}
        <Modal
          visible={showMusicSelector}
          animationType="slide"
          onRequestClose={() => setShowMusicSelector(false)}
          transparent
        >
          <View style={styles.musicModalOverlay}>
            <View style={styles.musicModalContainer}>
              <View style={styles.musicModalHeader}>
                <Text style={styles.musicModalTitle}>選擇音樂風格</Text>
                <TouchableOpacity 
                  style={styles.musicModalClose}
                  onPress={() => setShowMusicSelector(false)}
                >
                  <Text style={styles.musicModalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.musicOptionsList}>
                {musicOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.musicOption,
                      selectedMusic === option.id && styles.musicOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedMusic(option.id);
                      setShowMusicSelector(false);
                      if (generatedVideoUrl) {
                        // If video already exists, regenerate with new music
                        generateVideo();
                      }
                    }}
                  >
                    <Text style={styles.musicOptionIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.musicOptionText,
                      selectedMusic === option.id && styles.musicOptionTextSelected
                    ]}>
                      {option.name}
                    </Text>
                    {selectedMusic === option.id && (
                      <Text style={styles.musicOptionCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {!generatedVideoUrl && (
                <TouchableOpacity 
                  style={styles.musicModalGenerateButton}
                  onPress={() => {
                    setShowMusicSelector(false);
                    generateVideo();
                  }}
                >
                  <Text style={styles.musicModalGenerateText}>✨ 使用此風格生成視頻</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          animationType="fade"
          transparent
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContainer}>
              <Text style={styles.deleteModalTitle}>刪除相簿</Text>
              <Text style={styles.deleteModalMessage}>
                確定要刪除「{album.name}」相簿嗎？
              </Text>
              <Text style={styles.deleteModalWarning}>
                此操作無法復原，所有照片和視頻都將被永久刪除。
              </Text>
              
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalCancelButton}
                  onPress={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteModalCancelText}>取消</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.deleteModalConfirmButton, isDeleting && styles.deleteModalConfirmButtonDisabled]}
                  onPress={handleDeleteAlbum}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.deleteModalConfirmText}>刪除</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* More Menu Modal */}
        <Modal
          visible={showMoreMenu}
          animationType="fade"
          transparent
          onRequestClose={() => setShowMoreMenu(false)}
        >
          <TouchableOpacity 
            style={styles.moreMenuOverlay}
            activeOpacity={1}
            onPress={() => setShowMoreMenu(false)}
          >
            <View style={styles.moreMenuContainer}>
              <Text style={styles.moreMenuTitle}>相簿選項</Text>
              
              <TouchableOpacity
                style={styles.moreMenuItem}
                onPress={() => {
                  setShowMoreMenu(false);
                  handleAddPhotos();
                }}
                disabled={isUploading}
              >
                <Text style={styles.moreMenuItemIcon}>📷</Text>
                <Text style={styles.moreMenuItemText}>
                  {isUploading ? '上傳中...' : '新增照片'}
                </Text>
                {isUploading && (
                  <ActivityIndicator size="small" color="#007AFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.moreMenuItem, styles.deleteMenuItem]}
                onPress={() => {
                  setShowMoreMenu(false);
                  setShowDeleteConfirm(true);
                }}
                disabled={isDeleting}
              >
                <Text style={styles.moreMenuItemIcon}>🗑️</Text>
                <Text style={[styles.moreMenuItemText, styles.deleteMenuItemText]}>
                  刪除相簿
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backButton: {
    flex: 1,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  albumTitle: {
    flex: 2,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  moreButton: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  moreText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  albumInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  albumTheme: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  albumStory: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  albumMeta: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  photosList: {
    flex: 1,
  },
  photosContainer: {
    padding: 16,
  },
  photoItem: {
    flex: 1,
    margin: 4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: PHOTO_SIZE,
  },
  photoCaption: {
    padding: 8,
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  
  // Video Section Styles
  videoSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  videoSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  videoContainer: {
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  regenerateButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  regenerateButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  generateContainer: {
    alignItems: 'center',
  },
  generatingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  generatingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  generatingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  generatePrompt: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  generateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  generateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  generateDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  musicSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    marginBottom: 20,
    minWidth: 200,
  },
  musicSelectorText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  musicSelectorArrow: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Music Modal Styles
  musicModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  musicModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  musicModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  musicModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  musicModalClose: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicModalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  musicOptionsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  musicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  musicOptionSelected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
  },
  musicOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  musicOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  musicOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  musicOptionCheck: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  musicModalGenerateButton: {
    margin: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  musicModalGenerateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ff4444',
    borderRadius: 8,
  },
  deleteModalConfirmButtonDisabled: {
    backgroundColor: '#ffaaaa',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  
  // More Menu Styles
  moreMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  moreMenuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  moreMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  moreMenuItemIcon: {
    fontSize: 20,
    marginRight: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  moreMenuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  deleteMenuItemText: {
    color: '#ff4444',
  },
});

export default AlbumDetailView;