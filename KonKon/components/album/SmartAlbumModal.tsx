import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SmartAlbum, smartAlbumCreator } from '@/lib/voiceAlbumService';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import 'react-native-get-random-values';

interface SmartAlbumModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  albumName?: string;
  theme?: string;
  keywords?: string[]; // 新增：從語音解析的關鍵詞
}

const SmartAlbumModal: React.FC<SmartAlbumModalProps> = ({ 
  isVisible, 
  onClose, 
  onSave, 
  albumName: initialAlbumName = '',
  theme: initialTheme = '日常生活',
  keywords: initialKeywords = []
}) => {
  const { user, userFamilyDetails } = useAuth();
  const [albumName, setAlbumName] = useState(initialAlbumName);
  const [theme, setTheme] = useState(initialTheme);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [smartAlbum, setSmartAlbum] = useState<SmartAlbum | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [useIntelligentSelection, setUseIntelligentSelection] = useState(true);

  const themeOptions = [
    { key: '日常生活', label: '日常生活', icon: '🏠' },
    { key: '慶祝活動', label: '慶祝活動', icon: '🎉' },
    { key: '旅遊紀錄', label: '旅遊紀錄', icon: '✈️' },
    { key: '美食記錄', label: '美食記錄', icon: '🍽️' },
    { key: '家庭成長', label: '家庭成長', icon: '👶' },
    { key: '運動健身', label: '運動健身', icon: '🏃' },
  ];

  const handleCreateSmartAlbum = async () => {
    if (!albumName.trim()) {
      Alert.alert('錯誤', '請輸入相簿名稱');
      return;
    }

    setIsCreating(true);
    try {
      let newSmartAlbum: SmartAlbum;
      
      if (useIntelligentSelection && keywords.length > 0) {
        console.log('使用智能照片篩選功能');
        newSmartAlbum = await smartAlbumCreator.createSmartAlbumIntelligent(albumName, theme, keywords);
      } else {
        console.log('使用手動選擇照片功能');
        newSmartAlbum = await smartAlbumCreator.createSmartAlbumManual(albumName, theme);
      }
      
      setSmartAlbum(newSmartAlbum);
      setSelectedPhotos(newSmartAlbum.photos);
      
      Alert.alert(
        '智能相簿創建成功',
        `成功創建了包含 ${newSmartAlbum.photos.length} 張照片的智能相簿！`,
        [{ text: '確定', style: 'default' }]
      );
    } catch (error: any) {
      console.error('創建智能相簿失敗:', error);
      if (error.message.includes('未找到符合主題的照片')) {
        Alert.alert(
          '智能篩選未找到照片',
          '沒有找到符合主題的照片，您可以：\n1. 調整主題設定\n2. 改為手動選擇照片',
          [
            { text: '調整設定', style: 'default' },
            { 
              text: '手動選擇', 
              onPress: () => {
                setUseIntelligentSelection(false);
                handleCreateSmartAlbum();
              }
            }
          ]
        );
      } else {
        Alert.alert('創建失敗', error.message || '無法創建智能相簿');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleTogglePhoto = (photo: ImagePicker.ImagePickerAsset) => {
    setSelectedPhotos(prev => {
      const exists = prev.find(p => p.uri === photo.uri);
      if (exists) {
        return prev.filter(p => p.uri !== photo.uri);
      } else {
        return [...prev, photo];
      }
    });
  };

  const handlePublishAlbum = async () => {
    if (!user || !userFamilyDetails || userFamilyDetails.length === 0) {
      Alert.alert('錯誤', '您還未加入家庭');
      return;
    }

    if (!smartAlbum || selectedPhotos.length === 0) {
      Alert.alert('錯誤', '請先創建相簿並選擇照片');
      return;
    }

    setIsPublishing(true);
    try {
      const familyId = userFamilyDetails[0].family_id;
      
      // 上傳選中的照片到 Supabase Storage
      const imageUrls: string[] = [];
      
      for (const photo of selectedPhotos) {
        if (!photo.uri) continue;

        // 創建文件名
        const fileName = `${familyId}/${user.id}/${Date.now()}_${photo.fileName || 'photo.jpg'}`;
        
        // 讀取文件並轉換為 ArrayBuffer
        const response = await fetch(photo.uri);
        const arrayBuffer = await response.arrayBuffer();
        
        console.log(`Uploading ${fileName}, size: ${arrayBuffer.byteLength} bytes`);

        // 使用 ArrayBuffer 上傳
        const { data, error: uploadError } = await supabase.storage
          .from('memories')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(data.path);
        imageUrls.push(publicUrl);
      }

      // 創建家庭相簿記錄
      const { data: albumData, error: insertError } = await supabase.from('family_albums').insert({
        family_id: familyId,
        user_id: user.id,
        name: smartAlbum.name,
        theme: smartAlbum.theme,
        story: smartAlbum.story,
        image_urls: imageUrls,
        cover_image_url: imageUrls[0] || null,
        photo_count: selectedPhotos.length
      }).select().single();

      if (insertError) throw insertError;

      // 創建對應的 album_photos 記錄
      if (albumData && imageUrls.length > 0) {
        const albumPhotosData = imageUrls.map((url, index) => ({
          album_id: albumData.id,
          image_url: url,
          order_index: index,
          caption: null,
          metadata: {}
        }));

        const { error: photosError } = await supabase
          .from('album_photos')
          .insert(albumPhotosData);

        if (photosError) {
          console.error('創建照片記錄失敗:', photosError);
          // 不中斷流程，因為主要的相簿已經創建成功
        }
      }

      Alert.alert('成功', '智能相簿已創建並分享給家庭');
      resetState();
      onSave();
    } catch (error: any) {
      console.error('發布相簿失敗:', error);
      Alert.alert('發布失敗', error.message || '無法發布相簿');
    } finally {
      setIsPublishing(false);
    }
  };

  const resetState = () => {
    setAlbumName(initialAlbumName);
    setTheme(initialTheme);
    setSmartAlbum(null);
    setSelectedPhotos([]);
    onClose();
  };

  const renderPhotoItem = ({ item }: { item: ImagePicker.ImagePickerAsset }) => {
    const isSelected = selectedPhotos.find(p => p.uri === item.uri);
    
    return (
      <TouchableOpacity
        style={[styles.photoItem, isSelected && styles.photoItemSelected]}
        onPress={() => handleTogglePhoto(item)}
      >
        <Image source={{ uri: item.uri }} style={styles.photoImage} />
        {isSelected && (
          <View style={styles.photoSelectionIndicator}>
            <Text style={styles.photoSelectionText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={resetState}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI 智能相簿</Text>
          <TouchableOpacity onPress={resetState} disabled={isCreating || isPublishing}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 相簿設定區域 */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>相簿設定</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>相簿名稱</Text>
              <TextInput
                style={styles.textInput}
                placeholder="輸入相簿名稱..."
                value={albumName}
                onChangeText={setAlbumName}
                editable={!isCreating && !isPublishing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>主題類型</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.themeOptions}>
                  {themeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.themeOption,
                        theme === option.key && styles.themeOptionSelected
                      ]}
                      onPress={() => setTheme(option.key)}
                      disabled={isCreating || isPublishing}
                    >
                      <Text style={styles.themeIcon}>{option.icon}</Text>
                      <Text style={[
                        styles.themeLabel,
                        theme === option.key && styles.themeLabelSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* 智能篩選選項 */}
            {keywords.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🤖 智能篩選</Text>
                <TouchableOpacity
                  style={[styles.switchContainer, useIntelligentSelection && styles.switchContainerActive]}
                  onPress={() => setUseIntelligentSelection(!useIntelligentSelection)}
                  disabled={isCreating || isPublishing}
                >
                  <View style={[styles.switchTrack, useIntelligentSelection && styles.switchTrackActive]}>
                    <View style={[styles.switchThumb, useIntelligentSelection && styles.switchThumbActive]} />
                  </View>
                  <Text style={styles.switchLabel}>
                    {useIntelligentSelection ? 'AI 智能篩選照片' : '手動選擇照片'}
                  </Text>
                </TouchableOpacity>
                
                {useIntelligentSelection && (
                  <View style={styles.keywordsContainer}>
                    <Text style={styles.keywordsTitle}>篩選關鍵詞：</Text>
                    <View style={styles.keywordsList}>
                      {keywords.map((keyword, index) => (
                        <View key={index} style={styles.keywordTag}>
                          <Text style={styles.keywordText}>{keyword}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.createButton, (isCreating || !albumName.trim()) && styles.createButtonDisabled]}
              onPress={handleCreateSmartAlbum}
              disabled={isCreating || !albumName.trim()}
            >
              {isCreating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.createButtonText}>
                    {useIntelligentSelection ? '🔍 AI 正在分析照片...' : '📸 正在選擇照片...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.createButtonText}>
                  {useIntelligentSelection && keywords.length > 0 
                    ? '🤖 AI 智能生成相簿' 
                    : '📸 手動選擇照片創建'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 相簿預覽區域 */}
          {smartAlbum && (
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>相簿預覽</Text>
              
              <View style={styles.albumInfo}>
                <Text style={styles.albumName}>{smartAlbum.name}</Text>
                <Text style={styles.albumTheme}>主題: {smartAlbum.theme}</Text>
                <Text style={styles.albumStory}>{smartAlbum.story}</Text>
              </View>

              <Text style={styles.photoSectionTitle}>
                照片選擇 ({selectedPhotos.length}/{smartAlbum.photos.length})
              </Text>
              
              <FlatList
                data={smartAlbum.photos}
                renderItem={renderPhotoItem}
                keyExtractor={(item, index) => item.uri || index.toString()}
                numColumns={3}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
                columnWrapperStyle={styles.photoRow}
              />
            </View>
          )}
        </ScrollView>

        {/* 發布按鈕 */}
        {smartAlbum && (
          <TouchableOpacity
            style={[
              styles.publishButton,
              (isPublishing || selectedPhotos.length === 0) && styles.publishButtonDisabled
            ]}
            onPress={handlePublishAlbum}
            disabled={isPublishing || selectedPhotos.length === 0}
          >
            {isPublishing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.publishButtonText}>
                分享到家庭相簿 ({selectedPhotos.length} 張照片)
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#6C757D',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    minWidth: 80,
  },
  themeOptionSelected: {
    backgroundColor: '#E7F5FF',
    borderColor: '#007AFF',
  },
  themeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  themeLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  themeLabelSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#a0c8ff',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: 24,
  },
  albumInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  albumName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  albumTheme: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 12,
  },
  albumStory: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  photoRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  photoItem: {
    width: (Dimensions.get('window').width - 48) / 3,
    height: (Dimensions.get('window').width - 48) / 3,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoItemSelected: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoSelectionIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSelectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  publishButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: '#a0c8ff',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 8,
    marginTop: 8,
  },
  switchContainerActive: {
    backgroundColor: '#e3f2fd',
  },
  switchTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
    marginRight: 12,
    position: 'relative',
  },
  switchTrackActive: {
    backgroundColor: '#007AFF',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    left: 2,
    top: 2,
  },
  switchThumbActive: {
    left: 18,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  keywordsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  keywordsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordTag: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  keywordText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SmartAlbumModal;