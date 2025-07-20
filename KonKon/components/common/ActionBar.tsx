import SmartButton from '@/components/ui/SmartButton';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionBarProps {
  selectedFilter: string;
  onTextResult: (text: string) => void;
  onVoicePress: () => void;
  onImageSelection: (pickerFunction: 'camera' | 'library') => void;
  onManualAdd: () => void;
  onPhotoPress: () => void;
  onAlbumPress: () => void;
  isProcessingImage: boolean;
  isProcessingText: boolean;
  loadingText: string;
  voiceState: any;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  selectedFilter,
  onTextResult,
  onVoicePress,
  onImageSelection,
  onManualAdd,
  onPhotoPress,
  onAlbumPress,
  isProcessingImage,
  isProcessingText,
  loadingText,
  voiceState,
}) => {
  // 根據當前功能顯示不同的操作按鈕
  const renderActionButtons = () => {
    if (selectedFilter === 'familyAlbum') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={onPhotoPress}>
            <Text style={styles.photoButtonText}>📷</Text>
            <Text style={styles.buttonLabel}>拍照</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.albumButton} onPress={onAlbumPress}>
            <Text style={styles.albumButtonText}>🖼️</Text>
            <Text style={styles.buttonLabel}>相簿</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addButton} onPress={onManualAdd}>
            <Text style={styles.addButtonText}>✏️</Text>
            <Text style={styles.buttonLabel}>手動</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.voiceButton} 
          onPress={onVoicePress}
          disabled={isProcessingImage || isProcessingText}
        >
          <Text style={[styles.voiceButtonText, voiceState.isRecording && styles.recordingText]}>
            {voiceState.isRecording ? '⏹️' : '🎤'}
          </Text>
          <Text style={styles.buttonLabel}>
            {voiceState.isRecording ? '停止' : '語音'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cameraButton} 
          onPress={() => onImageSelection('camera')}
          disabled={isProcessingImage || isProcessingText}
        >
          <Text style={styles.cameraButtonText}>📷</Text>
          <Text style={styles.buttonLabel}>拍照</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.galleryButton} 
          onPress={() => onImageSelection('library')}
          disabled={isProcessingImage || isProcessingText}
        >
          <Text style={styles.galleryButtonText}>🖼️</Text>
          <Text style={styles.buttonLabel}>圖片</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={onManualAdd}
          disabled={isProcessingImage || isProcessingText}
        >
          <Text style={styles.addButtonText}>✏️</Text>
          <Text style={styles.buttonLabel}>手動</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* SmartButton */}
      <SmartButton
        onTextResult={onTextResult}
        disabled={isProcessingImage || isProcessingText}
        text={(() => {
          switch (selectedFilter) {
            case 'familyFinance':
              return '記錄收支，如：買菜花了50元';
            case 'familyRecipes':
              return '記錄餐食，如：今天吃了蛋炒飯';
            case 'choreAssignment':
              return '記錄家務，如：今天洗碗了';
            case 'familyAlbum':
              return '創建相簿，如：創建寶寶成長相簿';
            case 'shoppingList':
              return '購物清單，如：需要買牛奶和麵包';
            default:
              return '智能輸入，支援語音、圖片、文字...';
          }
        })()}
      />

      {/* 操作按鈕 */}
      {renderActionButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
  },
  voiceButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
  },
  voiceButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  recordingText: {
    color: '#FF3B30',
  },
  cameraButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
  },
  cameraButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  galleryButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
  },
  galleryButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  addButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
  },
  addButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
  },
  photoButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  albumButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
  },
  albumButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  buttonLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
}); 