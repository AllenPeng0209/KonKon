import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
} from 'react-native';

interface RecordButtonProps {
  onPress?: () => void;
  onMorePress?: () => void;
  onSendText?: (text: string) => void;
  text?: string;
  icon?: string;
  disabled?: boolean;
}

export default function RecordButton({
  onPress,
  onMorePress,
  onSendText,
  text = '长按说话，快速记录',
  icon = '+',
  disabled = false,
}: RecordButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [rotateAnim] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.timing(rotateAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePhotoPress = () => {
    console.log('拍照');
    setIsExpanded(false);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleAlbumPress = () => {
    console.log('相簿');
    setIsExpanded(false);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleMorePress = () => {
    if (onMorePress) {
      onMorePress();
    }
    setIsTextMode(!isTextMode);
    // 如果切换到文字模式，先关闭展开的功能按钮
    if (!isTextMode && isExpanded) {
      setIsExpanded(false);
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSendText = () => {
    if (inputText.trim() && onSendText) {
      onSendText(inputText.trim());
      setInputText('');
    }
  };

  const handleBackToVoice = () => {
    setIsTextMode(false);
    setInputText('');
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // 文字输入模式
  if (isTextMode) {
    return (
      <View style={styles.bottomBar}>
        <View style={styles.textModeContainer}>
          {/* 返回语音模式按钮 */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToVoice}
          >
            <Text style={styles.backIcon}>🎤</Text>
          </TouchableOpacity>
          
          {/* 文字输入框 */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="输入文字..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              autoFocus
            />
          </View>
          
          {/* 发送按钮 */}
          <TouchableOpacity 
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendText}
            disabled={!inputText.trim()}
          >
            <Text style={[
              styles.sendIcon,
              inputText.trim() ? styles.sendIconActive : styles.sendIconInactive
            ]}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 语音录制模式
  return (
    <View style={styles.bottomBar}>
      {/* 展开的功能按钮 */}
      {isExpanded && (
        <View style={styles.expandedButtons}>
          <TouchableOpacity 
            style={styles.functionButton}
            onPress={handlePhotoPress}
          >
            <Text style={styles.functionIcon}>📷</Text>
            <Text style={styles.functionText}>拍照</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.functionButton}
            onPress={handleAlbumPress}
          >
            <Text style={styles.functionIcon}>🖼️</Text>
            <Text style={styles.functionText}>相簿</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 主按钮区域 */}
      <View style={styles.mainButtonContainer}>
        {/* 左侧加号按钮 */}
        <TouchableOpacity 
          style={styles.plusButton}
          onPress={toggleExpanded}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Text style={styles.plusIcon}>{icon}</Text>
          </Animated.View>
        </TouchableOpacity>
        
        {/* 中间录音按钮 */}
        <TouchableOpacity 
          style={[styles.recordButton, disabled && styles.recordButtonDisabled]}
          onPress={onPress}
          disabled={disabled}
        >
          <Text style={styles.recordButtonText}>{text}</Text>
        </TouchableOpacity>
        
        {/* 右侧更多按钮 */}
        <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  expandedButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 40,
  },
  functionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    minWidth: 80,
  },
  functionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  functionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  mainButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  plusIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  recordButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonDisabled: {
    backgroundColor: '#999',
  },
  recordButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  moreButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  // 文字模式样式
  textModeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 20,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 24,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonInactive: {
    backgroundColor: '#e0e0e0',
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  sendIconActive: {
    color: '#fff',
  },
  sendIconInactive: {
    color: '#999',
  },
}); 