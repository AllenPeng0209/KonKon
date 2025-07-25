import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
    }
  }, [isVisible, album]);

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
                此操作無法復原，所有照片都將被永久刪除。
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