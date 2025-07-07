import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { processTextToCalendar, ParsedCalendarResult } from '../../lib/bailian_omni_calendar';

interface SmartButtonProps {
  onPress?: () => void;
  onTextInputPress?: () => void;
  onSendText?: (text: string) => void;
  onTextResult?: (result: ParsedCalendarResult) => void;
  onError?: (error: string) => void;
  onPhotoPress?: () => void;
  onAlbumPress?: () => void;
  onManualAddPress?: () => void;
  text?: string;
  icon?: string;
  disabled?: boolean;
}

export default function SmartButton({
  onPress,
  onTextInputPress,
  onSendText,
  onTextResult,
  onError,
  onPhotoPress,
  onAlbumPress,
  onManualAddPress,
  text = '长按说话，快速记录',
  icon = '+',
  disabled = false,
}: SmartButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [realTimeText, setRealTimeText] = useState('');
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
    if (onPhotoPress) {
      onPhotoPress();
    }
    setIsExpanded(false);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleAlbumPress = () => {
    if (onAlbumPress) {
      onAlbumPress();
    }
    setIsExpanded(false);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleManualAddPress = () => {
    if (onManualAddPress) {
      onManualAddPress();
    }
    setIsExpanded(false);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleTextInputPress = () => {
    if (onTextInputPress) {
      onTextInputPress();
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

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    
    const textToProcess = inputText.trim();
    
    // 如果有简单的文字回调，先调用它
    if (onSendText) {
      onSendText(textToProcess);
    }
    
    // 如果有文字转日程回调，进行AI处理
    if (onTextResult) {
      setIsProcessing(true);
      try {
        const result = await processTextToCalendar(textToProcess);
        onTextResult(result);
        setInputText('');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '处理失败';
        if (onError) {
          onError(errorMessage);
        } else {
          Alert.alert('处理失败', errorMessage);
        }
      } finally {
        setIsProcessing(false);
      }
    } else {
      // 如果没有AI处理回调，只是清空输入
      setInputText('');
    }
  };

  const handleBackToVoice = () => {
    setIsTextMode(false);
    setInputText('');
    setIsProcessing(false);
  };

  // 开始长按录音
  const handleLongPressStart = () => {
    if (!disabled && !isTextMode) {
      console.log('开始录音');
      setIsRecording(true);
      setRealTimeText('正在聆听...');
      
      // 模拟实时转录 - 需要保存录音状态引用
      let recordingRef = true;
      setTimeout(() => {
        if (recordingRef) {
          setRealTimeText('正在识别...');
        }
      }, 1000);
      
      setTimeout(() => {
        if (recordingRef) {
          setRealTimeText('明天下午三点...');
        }
      }, 2000);
    }
  };

  // 结束长按录音
  const handleLongPressEnd = async () => {
    if (isRecording) {
      console.log('结束录音');
      setIsRecording(false);
      setRealTimeText('正在处理...');
      
      // 模拟语音识别结果
      const recognizedText = realTimeText || '明天下午三点开会';
      
      // 调用文字转日程接口
      if (onTextResult) {
        try {
          setIsProcessing(true);
          const result = await processTextToCalendar(recognizedText);
          onTextResult(result);
          setRealTimeText('');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '处理失败';
          if (onError) {
            onError(errorMessage);
          }
          setRealTimeText('');
        } finally {
          setIsProcessing(false);
        }
      }
    }
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
            disabled={isProcessing}
          >
            <Text style={styles.backIcon}>🎤</Text>
          </TouchableOpacity>
          
          {/* 文字输入框 */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="输入日程描述，如：明天下午3点开会..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              autoFocus
              editable={!isProcessing}
            />
          </View>
          
          {/* 发送按钮 */}
          <TouchableOpacity 
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendText}
            disabled={!inputText.trim() || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[
                styles.sendIcon,
                inputText.trim() ? styles.sendIconActive : styles.sendIconInactive
              ]}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* 处理状态提示 */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>正在智能解析日程...</Text>
          </View>
        )}
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
          
          <TouchableOpacity 
            style={styles.functionButton}
            onPress={handleManualAddPress}
          >
            <Text style={styles.functionIcon}>✍️</Text>
            <Text style={styles.functionText}>手动添加</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 实时转录显示框 */}
      {(isRecording || realTimeText) && (
        <View style={styles.realTimeTranscriptContainer}>
          <Text style={styles.realTimeTranscriptText}>
            {realTimeText || '正在聆听...'}
          </Text>
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
          style={[
            styles.smartButton, 
            disabled && styles.smartButtonDisabled,
            isRecording && styles.smartButtonRecording
          ]}
          onPressIn={handleLongPressStart}
          onPressOut={handleLongPressEnd}
          disabled={disabled}
        >
          <Text style={[
            styles.smartButtonText,
            isRecording && styles.smartButtonTextRecording
          ]}>
            {isRecording ? '🎤 录音中...' : text}
          </Text>
        </TouchableOpacity>
        
        {/* 右侧文字输入按钮 */}
        <TouchableOpacity 
          style={styles.textInputButton} 
          onPress={handleTextInputPress}
        >
          <Text style={styles.textInputButtonText}>✏️</Text>
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
    paddingHorizontal: 20,
  },
  functionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    minWidth: 70,
    flex: 1,
    marginHorizontal: 4,
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
  smartButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartButtonDisabled: {
    backgroundColor: '#999',
  },
  smartButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  smartButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  smartButtonTextRecording: {
    fontWeight: '600',
  },
  textInputButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  textInputButtonText: {
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
    maxHeight: 120,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 24,
    maxHeight: 100,
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
  processingContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // 实时转录显示框样式
  realTimeTranscriptContainer: {
    backgroundColor: '#95EC69',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignSelf: 'center',
    minWidth: 150,
    maxWidth: '80%',
  },
  realTimeTranscriptText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 