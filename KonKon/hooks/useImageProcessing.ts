import { ParsedCalendarResult, processImageToCalendar } from '@/lib/bailian_omni_calendar';
import { t } from '@/lib/i18n';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

export const useImageProcessing = () => {
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const handleImageSelection = async (
    pickerFunction: 'camera' | 'library',
    onResult: (result: ParsedCalendarResult) => void,
    onAlbumResult?: (images: ImagePicker.ImagePickerAsset[]) => void,
    selectedFilter: string = 'calendar'
  ) => {
    let permissionResult;
    if (pickerFunction === 'camera') {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permissionResult.granted === false) {
      Alert.alert(
        t('home.permissionDenied'), 
        t('home.permissionRequired', { 
          permission: pickerFunction === 'camera' ? t('home.camera') : t('home.photoLibrary') 
        })
      );
      return;
    }

    const pickerResult = pickerFunction === 'camera'
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        });

    if (pickerResult.canceled) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      // 如果是相簿功能，直接返回圖片資產
      if (selectedFilter === 'familyAlbum' && onAlbumResult) {
        onAlbumResult(pickerResult.assets);
        return;
      }
      
      const imageUri = pickerResult.assets[0].uri;
      try {
        setIsProcessingImage(true);
        setLoadingText(t('home.processingImage'));
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const result = await processImageToCalendar(base64Image);
        onResult(result);
      } catch (error) {
        console.error('圖片處理失敗:', error);
        Alert.alert(
          t('home.error'), 
          t('home.imageProcessingFailed', { 
            error: error instanceof Error ? error.message : t('home.unknownError') 
          })
        );
      } finally {
        setIsProcessingImage(false);
        setLoadingText('');
      }
    }
  };

  const handlePhotoPress = async (onAlbumResult: (images: ImagePicker.ImagePickerAsset[]) => void) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('權限錯誤', '需要相機權限才能拍照');
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      onAlbumResult(pickerResult.assets);
    }
  };

  const handleAlbumPress = async (onAlbumResult: (images: ImagePicker.ImagePickerAsset[]) => void) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('權限錯誤', '需要相簿權限才能選取照片');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      onAlbumResult(pickerResult.assets);
    }
  };

  return {
    isProcessingImage,
    loadingText,
    handleImageSelection,
    handlePhotoPress,
    handleAlbumPress,
  };
}; 