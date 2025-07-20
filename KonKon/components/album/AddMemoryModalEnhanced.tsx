import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
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
import { v4 as uuidv4 } from 'uuid';

interface AddMemoryModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  initialImages?: ImagePicker.ImagePickerAsset[];
}

const { width: screenWidth } = Dimensions.get('window');
const THUMBNAIL_SIZE = 80;
const MAX_IMAGES = 9;

const AddMemoryModalEnhanced: React.FC<AddMemoryModalProps> = ({ 
  isVisible, 
  onClose, 
  onSave, 
  initialImages 
}) => {
  const { user, userFamilyDetails } = useAuth();
  const [story, setStory] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
  }, [initialImages]);

  const handleSelectImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(t('addMemory.maxImagesReached', { max: MAX_IMAGES }));
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('addMemory.permissionDenied'));
      return;
    }

    const remainingSlots = MAX_IMAGES - images.length;
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
      selectionLimit: remainingSlots,
    });

    if (!pickerResult.canceled) {
      const newImages = pickerResult.assets.slice(0, remainingSlots);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleTakePhoto = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(t('addMemory.maxImagesReached', { max: MAX_IMAGES }));
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('addMemory.cameraPermissionDenied'));
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!pickerResult.canceled) {
      setImages(prev => [...prev, ...pickerResult.assets]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setShowImagePreview(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('addMemory.locationPermissionDenied'));
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const locationString = [address.street, address.city, address.region]
          .filter(Boolean)
          .join(', ');
        setLocation(locationString);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(t('addMemory.locationError'));
    }
  };

  const handlePublish = async () => {
    if (!user || !userFamilyDetails || userFamilyDetails.length === 0) {
      Alert.alert(t('addMemory.error'), t('addMemory.notInFamily'));
      return;
    }
    if (images.length === 0) {
      Alert.alert(t('addMemory.error'), t('addMemory.noImages'));
      return;
    }

    setIsUploading(true);

    try {
      const familyId = userFamilyDetails[0].family_id;
      const imageUrls: string[] = [];

      // 上傳圖片
      for (const image of images) {
        const base64 = image.base64;
        if (!base64) continue;

        const filePath = `${familyId}/${user.id}/${uuidv4()}.jpg`;
        const { data, error: uploadError } = await supabase.storage
          .from('memories')
          .upload(filePath, decode(base64), {
            contentType: 'image/jpeg',
          });
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(data.path);
        imageUrls.push(publicUrl);
      }

      // 保存回憶記錄
      const { error: insertError } = await supabase.from('family_memories').insert({
        family_id: familyId,
        user_id: user.id,
        story: story || null,
        image_urls: imageUrls,
        location: location || null,
        tags: tags.length > 0 ? tags : null,
      });

      if (insertError) throw insertError;
      
      Alert.alert(t('addMemory.success'), t('addMemory.publishSuccess'));
      resetState();
      onSave();
    } catch (error: any) {
      console.error('Failed to publish memory:', error);
      Alert.alert(t('addMemory.error'), error.message || t('addMemory.publishFailed'));
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetState = () => {
    setStory('');
    setImages([]);
    setLocation('');
    setTags([]);
    setNewTag('');
    setSelectedImageIndex(0);
    setShowImagePreview(false);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={resetState}
    >
      <View style={styles.container}>
        {/* 頂部標題欄 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('addMemory.title')}</Text>
          <TouchableOpacity onPress={resetState} disabled={isUploading}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 圖片選擇和預覽區域 */}
          <View style={styles.imageSection}>
            <View style={styles.imageSectionHeader}>
              <Text style={styles.imageSectionTitle}>
                {t('addMemory.photos')} ({images.length}/{MAX_IMAGES})
              </Text>
              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.imageActionButton} onPress={handleTakePhoto}>
                  <Text style={styles.imageActionText}>📷</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageActionButton} onPress={handleSelectImages}>
                  <Text style={styles.imageActionText}>🖼️</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
              {images.map((img, index) => (
                <View key={index} style={styles.thumbnailWrapper}>
                  <TouchableOpacity onPress={() => handleImagePress(index)}>
                    <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < MAX_IMAGES && (
                <TouchableOpacity style={styles.addImageButton} onPress={handleSelectImages}>
                  <Text style={styles.addImageButtonText}>+</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* 故事輸入 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{t('addMemory.story')}</Text>
            <TextInput
              style={styles.storyInput}
              multiline
              placeholder={t('addMemory.storyPlaceholder')}
              value={story}
              onChangeText={setStory}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{story.length}/500</Text>
          </View>

          {/* 位置輸入 */}
          <View style={styles.inputSection}>
            <View style={styles.locationHeader}>
              <Text style={styles.inputLabel}>{t('addMemory.location')}</Text>
              <TouchableOpacity style={styles.locationButton} onPress={handleGetCurrentLocation}>
                <Text style={styles.locationButtonText}>📍 {t('addMemory.getCurrentLocation')}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.locationInput}
              placeholder={t('addMemory.locationPlaceholder')}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
          </View>

          {/* 標籤管理 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{t('addMemory.tags')} ({tags.length}/10)</Text>
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tagsRow}>
                    {tags.map((tag, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.tag}
                        onPress={() => handleRemoveTag(tag)}
                      >
                        <Text style={styles.tagText}>#{tag}</Text>
                        <Text style={styles.tagRemove}>×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
            <View style={styles.addTagContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder={t('addMemory.addTag')}
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddTag}
                maxLength={20}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                <Text style={styles.addTagButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI工具 */}
          <View style={styles.aiToolsContainer}>
            <TouchableOpacity style={styles.aiButton}>
              <Text style={styles.aiButtonText}>✨ {t('addMemory.aiWriteStory')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiButton}>
              <Text style={styles.aiButtonText}>🎨 {t('addMemory.aiEditPhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiButton}>
              <Text style={styles.aiButtonText}>🏷️ {t('addMemory.aiSuggestTags')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* 發佈按鈕 */}
        <TouchableOpacity 
          style={[styles.publishButton, (isUploading || images.length === 0) && styles.disabledButton]} 
          onPress={handlePublish} 
          disabled={isUploading || images.length === 0}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishButtonText}>{t('addMemory.publish')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 圖片預覽模態框 */}
      <Modal
        visible={showImagePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View style={styles.imagePreviewContainer}>
          <TouchableOpacity 
            style={styles.imagePreviewClose}
            onPress={() => setShowImagePreview(false)}
          >
            <Text style={styles.imagePreviewCloseText}>✕</Text>
          </TouchableOpacity>
          
          {images.length > 0 && (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              initialScrollIndex={selectedImageIndex}
              getItemLayout={(data, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              renderItem={({ item }) => (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: item.uri }} style={styles.imagePreview} resizeMode="contain" />
                </View>
              )}
              keyExtractor={(item, index) => `preview-${index}`}
            />
          )}
        </View>
      </Modal>
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
  },
  closeButton: {
    fontSize: 24,
    color: '#6C757D',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // 圖片相關樣式
  imageSection: {
    marginBottom: 20,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageActionText: {
    fontSize: 18,
  },
  thumbnailContainer: {
    maxHeight: THUMBNAIL_SIZE + 20,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CED4DA',
    borderStyle: 'dashed',
  },
  addImageButtonText: {
    fontSize: 32,
    color: '#6C757D',
  },
  // 輸入區域樣式
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  storyInput: {
    backgroundColor: '#fff',
    minHeight: 100,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  characterCount: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'right',
    marginTop: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  locationInput: {
    backgroundColor: '#fff',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  // 標籤樣式
  tagsContainer: {
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#1976D2',
    marginRight: 4,
  },
  tagRemove: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#fff',
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    marginRight: 8,
  },
  addTagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // AI工具樣式
  aiToolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  aiButton: {
    backgroundColor: '#E7F5FF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B3D7FF',
  },
  aiButtonText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  // 發佈按鈕
  publishButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CED4DA',
  },
  // 圖片預覽樣式
  imagePreviewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewCloseText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  imagePreviewWrapper: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '90%',
    height: '70%',
  },
});

export default AddMemoryModalEnhanced;