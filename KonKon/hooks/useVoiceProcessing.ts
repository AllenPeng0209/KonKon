import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { ParsedCalendarResult, processVoiceToCalendar } from '@/lib/bailian_omni_calendar';
import { t } from '@/lib/i18n';
import { useState } from 'react';
import { Alert } from 'react-native';

export const useVoiceProcessing = () => {
  const [loadingText, setLoadingText] = useState('');

  // 語音錄制
  const {
    state: voiceState,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder({
    maxDuration: 180000, // 3分鐘
    audioFormat: 'wav',
  });

  const handleVoicePress = async (onResult: (result: ParsedCalendarResult) => void) => {
    if (voiceState.isRecording) {
      // 停止錄制並處理語音
      try {
        const base64Data = await stopRecording();
        if (base64Data) {
          Alert.alert(
            t('home.processVoiceTitle'),
            t('home.processVoiceMessage'),
            [
              {
                text: t('home.cancel'),
                onPress: () => clearRecording(),
                style: 'cancel',
              },
              {
                text: t('home.convert'),
                onPress: () => handleVoiceToCalendar(base64Data, onResult),
              },
            ]
          );
        }
      } catch (error) {
        console.error('停止錄制失敗:', error);
        Alert.alert(t('home.error'), t('home.recordingFailed'));
      }
    } else {
      // 開始錄制
      try {
        await startRecording();
      } catch (error) {
        console.error('開始錄制失敗:', error);
        Alert.alert(t('home.error'), t('home.micPermissionError'));
      }
    }
  };

  const handleVoiceToCalendar = async (
    base64Data: string, 
    onResult: (result: ParsedCalendarResult) => void
  ) => {
    setLoadingText(t('home.processingVoice'));
    try {
      const result = await processVoiceToCalendar(base64Data);
      onResult(result);
    } catch (error) {
      console.error('語音處理失敗:', error);
      Alert.alert(t('home.error'), t('home.voiceProcessingFailed'));
    } finally {
      clearRecording();
      setLoadingText('');
    }
  };

  return {
    voiceState,
    loadingText,
    handleVoicePress,
    handleVoiceToCalendar,
  };
}; 