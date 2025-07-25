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
    View
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [manualPhotos, setManualPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const themeOptions = [
    { key: '日常生活', label: '日常生活', icon: '🏠' },
    { key: '慶祝活動', label: '慶祝活動', icon: '🎉' },
    { key: '旅遊紀錄', label: '旅遊紀錄', icon: '✈️' },
    { key: '美食記錄', label: '美食記錄', icon: '🍽️' },
    { key: '家庭成長', label: '家庭成長', icon: '👶' },
    { key: '運動健身', label: '運動健身', icon: '🏃' },
  ];

  const handleSelectPhotos = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('權限被拒絕', '需要相冊權限才能選擇照片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 20, // 最多選擇20張照片
      });

      if (!result.canceled && result.assets.length > 0) {
        setManualPhotos(prev => [...prev, ...result.assets]);
      }
    } catch (error: any) {
      console.error('選擇照片失敗:', error);
      Alert.alert('錯誤', error.message || '選擇照片時發生錯誤');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('權限被拒絕', '需要相機權限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setManualPhotos(prev => [...prev, ...result.assets]);
      }
    } catch (error: any) {
      console.error('拍照失敗:', error);
      Alert.alert('錯誤', error.message || '拍照時發生錯誤');
    }
  };

  const handleRemovePhoto = (photoUri: string) => {
    setManualPhotos(prev => prev.filter(photo => photo.uri !== photoUri));
    setSelectedPhotos(prev => prev.filter(photo => photo.uri !== photoUri));
  };

  const handleCreateSmartAlbum = async () => {
    if (!albumName.trim()) {
      Alert.alert('錯誤', '請輸入相簿名稱');
      return;
    }

    // 如果用戶手動選擇了照片，優先使用手動選擇的照片
    if (manualPhotos.length > 0) {
      const newSmartAlbum: SmartAlbum = {
        id: `manual_${Date.now()}`,
        name: albumName,
        theme: theme,
        story: `這是一個關於「${theme}」的美好相簿，包含了 ${manualPhotos.length} 張珍貴的照片。`,
        photos: manualPhotos,
        createdAt: new Date()
      };
      setSmartAlbum(newSmartAlbum);
      setSelectedPhotos(manualPhotos);
      Alert.alert('相簿創建成功', `成功創建了包含 ${manualPhotos.length} 張照片的相簿！`);
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
    setManualPhotos([]);
    onClose();
  };

  const renderPhotoItem = ({ item }: { item: ImagePicker.ImagePickerAsset }) => {
    const isSelected = selectedPhotos.find(p => p.uri === item.uri);
    
    return (
      <TouchableOpacity
        style={[styles.photoItem, isSelected && styles.photoItemSelected]}
        onPress={() => handleTogglePhoto(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.uri }} style={styles.photoImage} />
        <TouchableOpacity 
          style={styles.photoRemoveButton}
          onPress={() => handleRemovePhoto(item.uri)}
        >
          <Text style={styles.photoRemoveText}>✕</Text>
        </TouchableOpacity>
        {isSelected ? (
          <View style={styles.photoSelectionIndicator}>
            <Text style={styles.photoSelectionText}>✓</Text>
          </View>
        ) : (
          <View style={styles.photoOverlay}>
            <View style={styles.photoSelectCircle} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyPhotoState = () => (
    <View style={styles.emptyPhotoContainer}>
      <View style={styles.emptyPhotoIcon}>
        <Text style={styles.emptyPhotoIconText}>📸</Text>
      </View>
      <Text style={styles.emptyPhotoTitle}>添加照片到您的相簿</Text>
      <Text style={styles.emptyPhotoSubtitle}>
        選擇照片或拍攝新照片來創建美好的回憶相簿
      </Text>
      
      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.photoActionButton} onPress={handleSelectPhotos}>
          <Text style={styles.photoActionIcon}>🖼️</Text>
          <Text style={styles.photoActionText}>選擇照片</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.photoActionButton} onPress={handleTakePhoto}>
          <Text style={styles.photoActionIcon}>📷</Text>
          <Text style={styles.photoActionText}>拍攝照片</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPhotosWithAddButton = () => {
    const displayPhotos = smartAlbum ? smartAlbum.photos : manualPhotos;
    
    return (
      <View style={styles.photosContent}>
        <FlatList
          data={displayPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={(item, index) => item.uri || index.toString()}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          columnWrapperStyle={styles.photoRow}
          contentContainerStyle={styles.photoList}
          ListFooterComponent={() => (
            <View style={styles.addPhotoFooter}>
              <TouchableOpacity style={styles.miniAddButton} onPress={handleSelectPhotos}>
                <Text style={styles.miniAddButtonText}>+ 添加更多</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
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
        {/* 漸變背景 */}
        <View style={styles.gradientBackground} />
        
        {/* 標題欄 */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>✨ AI 智能相簿</Text>
            <TouchableOpacity 
              onPress={resetState} 
              disabled={isCreating || isPublishing}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 主要內容 */}
        <View style={styles.mainContent}>
          {/* 上半部分：照片選擇區域 */}
          <View style={styles.photoSection}>
            <View style={styles.photoHeader}>
              <Text style={styles.photoTitle}>
                📷 照片預覽 {smartAlbum && `(${selectedPhotos.length}/${smartAlbum.photos.length})`}
              </Text>
              {smartAlbum && (
                <View style={styles.photoCounter}>
                  <Text style={styles.photoCounterText}>{selectedPhotos.length} 已選</Text>
                </View>
              )}
            </View>
            
            <View style={styles.photoContainer}>
              {(smartAlbum && smartAlbum.photos.length > 0) || manualPhotos.length > 0 ? (
                renderPhotosWithAddButton()
              ) : (
                renderEmptyPhotoState()
              )}
            </View>
          </View>

          {/* 下半部分：相簿設定區域 */}
          <View style={styles.settingsSection}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>🎨 相簿設定</Text>
                
                {/* 相簿名稱 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>相簿名稱</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="為您的相簿取個美麗的名字..."
                    value={albumName}
                    onChangeText={setAlbumName}
                    editable={!isCreating && !isPublishing}
                    placeholderTextColor="#999"
                  />
                </View>

                {/* 主題選擇 */}
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
                          activeOpacity={0.8}
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
                    <Text style={styles.inputLabel}>🤖 AI 智能篩選</Text>
                    <TouchableOpacity
                      style={[styles.switchContainer, useIntelligentSelection && styles.switchContainerActive]}
                      onPress={() => setUseIntelligentSelection(!useIntelligentSelection)}
                      disabled={isCreating || isPublishing}
                      activeOpacity={0.8}
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
                        <Text style={styles.keywordsTitle}>🏷️ 篩選關鍵詞</Text>
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

                {/* 創建按鈕 */}
                <TouchableOpacity
                  style={[styles.createButton, (isCreating || !albumName.trim()) && styles.createButtonDisabled]}
                  onPress={handleCreateSmartAlbum}
                  disabled={isCreating || !albumName.trim()}
                  activeOpacity={0.8}
                >
                  {isCreating ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.createButtonText}>
                        {useIntelligentSelection ? '🔍 AI 正在分析照片...' : '📸 正在選擇照片...'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.createButtonIcon}>
                        {useIntelligentSelection && keywords.length > 0 ? '🤖' : '📸'}
                      </Text>
                      <Text style={styles.createButtonText}>
                        {useIntelligentSelection && keywords.length > 0 
                          ? 'AI 智能生成相簿' 
                          : '手動選擇照片創建'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* 發布按鈕 */}
        {smartAlbum && (
          <View style={styles.publishContainer}>
            <TouchableOpacity
              style={[
                styles.publishButton,
                (isPublishing || selectedPhotos.length === 0) && styles.publishButtonDisabled
              ]}
              onPress={handlePublishAlbum}
              disabled={isPublishing || selectedPhotos.length === 0}
              activeOpacity={0.8}
            >
              {isPublishing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.publishButtonContent}>
                  <Text style={styles.publishButtonIcon}>🚀</Text>
                  <Text style={styles.publishButtonText}>
                    分享到家庭相簿 ({selectedPhotos.length} 張照片)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.3,
    backgroundColor: '#667eea',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  photoSection: {
    flex: 0.6,
    marginTop: 16,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  photoCounter: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  photoContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photosContent: {
    flex: 1,
  },
  addPhotoFooter: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  miniAddButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
     miniAddButtonText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '600',
   },
   photoActions: {
     marginTop: 20,
     alignItems: 'center',
   },
   photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  photoActionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  emptyPhotoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPhotoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyPhotoIconText: {
    fontSize: 32,
  },
  emptyPhotoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyPhotoSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  photoList: {
    paddingVertical: 8,
  },
  photoRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  photoItem: {
    width: (screenWidth - 64) / 3,
    height: (screenWidth - 64) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  photoItemSelected: {
    borderWidth: 3,
    borderColor: '#667eea',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  photoSelectCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  photoSelectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSelectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoRemoveButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  photoRemoveText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  settingsSection: {
    flex: 0.4,
    marginTop: 16,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    color: '#333',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  themeOption: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    minWidth: 80,
  },
  themeOptionSelected: {
    backgroundColor: '#E7F0FF',
    borderColor: '#667eea',
  },
  themeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  themeLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  themeLabelSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  switchContainerActive: {
    backgroundColor: '#E7F0FF',
    borderColor: '#667eea',
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E1E8ED',
    marginRight: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: '#667eea',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    position: 'absolute',
    left: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    left: 22,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  keywordsContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1E0FF',
  },
  keywordsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 12,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordTag: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  keywordText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    backgroundColor: '#B8C5EA',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  publishButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  publishButtonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0,
    elevation: 0,
  },
  publishButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  publishButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SmartAlbumModal;