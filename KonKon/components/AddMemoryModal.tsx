import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
  onSave: () => void; // Callback to refresh the memory list
  initialImages?: ImagePicker.ImagePickerAsset[];
}

const AddMemoryModal: React.FC<AddMemoryModalProps> = ({ isVisible, onClose, onSave, initialImages }) => {
  const { user, userFamilyDetails } = useAuth();
  const [story, setStory] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
        setImages(initialImages);
    }
  }, [initialImages]);

  const handleSelectImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('addMemory.permissionDenied'));
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true, // We need base64 to upload to Supabase storage
    });

    if (!pickerResult.canceled) {
      setImages(pickerResult.assets);
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
        const familyId = userFamilyDetails[0].family_id; // Corrected: use family_id instead of id
        const imageUrls: string[] = [];

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

        const { error: insertError } = await supabase.from('family_memories').insert({
            family_id: familyId,
            user_id: user.id,
            story: story,
            image_urls: imageUrls,
        });

        if (insertError) throw insertError;
        
        Alert.alert(t('addMemory.success'), t('addMemory.publishSuccess'));
        resetState();
        onSave(); // Refresh list
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
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={resetState}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('addMemory.title')}</Text>
          <TouchableOpacity onPress={resetState} disabled={isUploading}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.imageSelectionContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((img, index) => (
                <Image key={index} source={{ uri: img.uri }} style={styles.thumbnail} />
              ))}
              <TouchableOpacity style={styles.addButton} onPress={handleSelectImages}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          <TextInput
            style={styles.storyInput}
            multiline
            placeholder={t('addMemory.storyPlaceholder')}
            value={story}
            onChangeText={setStory}
          />
          
          <View style={styles.aiToolsContainer}>
             <TouchableOpacity style={styles.aiButton}>
                <Text>✨ {t('addMemory.aiWriteStory')}</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.aiButton}>
                <Text>🎨 {t('addMemory.aiEditPhoto')}</Text>
             </TouchableOpacity>
          </View>

        </ScrollView>
        
        <TouchableOpacity style={[styles.publishButton, isUploading && styles.disabledButton]} onPress={handlePublish} disabled={isUploading}>
            {isUploading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.publishButtonText}>{t('addMemory.publish')}</Text>
            )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8F9FA',
      paddingTop: 50, // For notch
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
    imageSelectionContainer: {
        marginBottom: 16,
    },
    addButton: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 40,
        color: '#ADB5BD',
    },
    thumbnail: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 8,
    },
    storyInput: {
        backgroundColor: '#fff',
        minHeight: 120,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#DEE2E6',
        marginBottom: 16,
    },
    aiToolsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    aiButton: {
        backgroundColor: '#E7F5FF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#B3D7FF'
    },
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
        backgroundColor: '#a0c8ff'
    }
  });

export default AddMemoryModal; 