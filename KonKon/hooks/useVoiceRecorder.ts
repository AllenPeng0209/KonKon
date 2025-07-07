import { useState, useCallback, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  uri: string | null;
  base64Data: string | null;
  error: string | null;
}

export interface VoiceRecorderOptions {
  maxDuration?: number; // 最大录制时长（毫秒），默认180000ms (3分钟)
  audioFormat?: 'wav' | 'mp3' | 'flac'; // 音频格式，默认wav
  bitRate?: number; // 比特率，默认128000
  sampleRate?: number; // 采样率，默认44100
}

export function useVoiceRecorder(options: VoiceRecorderOptions = {}) {
  const {
    maxDuration = 180000, // 3分钟
    audioFormat = 'wav',
    bitRate = 128000,
    sampleRate = 44100,
  } = options;

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordingState, setRecordingState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPlaying: false,
    isLoading: false,
    duration: 0,
    uri: null,
    base64Data: null,
    error: null,
  });

  // 初始化音频模式
  useEffect(() => {
    async function initializeAudio() {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('音频初始化失败:', error);
        setRecordingState(prev => ({
          ...prev,
          error: '音频初始化失败',
        }));
      }
    }
    
    initializeAudio();
  }, []);

  // 清理资源
  const cleanup = useCallback(async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
    }
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
  }, [recording, sound]);

  // 开始录制
  const startRecording = useCallback(async () => {
    if (recordingState.isRecording) return;
    
    try {
      setRecordingState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // 清理之前的录制
      await cleanup();

      // 创建录制实例
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status: any) => {
          if (status.isRecording) {
            setRecordingState(prev => ({
              ...prev,
              duration: status.durationMillis || 0,
            }));
          }
        }
      );

      setRecording(newRecording);
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isLoading: false,
        duration: 0,
        uri: null,
        base64Data: null,
      }));

      // 设置最大录制时长
      setTimeout(() => {
        if (newRecording) {
          stopRecording();
        }
      }, maxDuration);

    } catch (error) {
      console.error('开始录制失败:', error);
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isLoading: false,
        error: '开始录制失败',
      }));
    }
  }, [recordingState.isRecording, cleanup, audioFormat, bitRate, sampleRate, maxDuration]);

  // 停止录制
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recording || !recordingState.isRecording) return null;

    try {
      setRecordingState(prev => ({
        ...prev,
        isLoading: true,
      }));

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        // 读取文件并转换为Base64
        const base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setRecordingState(prev => ({
          ...prev,
          isRecording: false,
          isLoading: false,
          uri,
          base64Data,
          error: null,
        }));

        setRecording(null);
        return base64Data;
      } else {
        throw new Error('录制文件URI无效');
      }

    } catch (error) {
      console.error('停止录制失败:', error);
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isLoading: false,
        error: '停止录制失败',
      }));
      return null;
    }
  }, [recording, recordingState.isRecording]);

  // 播放录制的音频
  const playRecording = useCallback(async () => {
    if (!recordingState.uri || recordingState.isPlaying) return;

    try {
      setRecordingState(prev => ({
        ...prev,
        isLoading: true,
      }));

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingState.uri },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            setRecordingState(prev => ({
              ...prev,
              isPlaying: false,
            }));
          }
        }
      );

      setSound(newSound);
      setRecordingState(prev => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
      }));

    } catch (error) {
      console.error('播放失败:', error);
      setRecordingState(prev => ({
        ...prev,
        isLoading: false,
        error: '播放失败',
      }));
    }
  }, [recordingState.uri, recordingState.isPlaying]);

  // 停止播放
  const stopPlaying = useCallback(async () => {
    if (!sound || !recordingState.isPlaying) return;

    try {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setRecordingState(prev => ({
        ...prev,
        isPlaying: false,
      }));
    } catch (error) {
      console.error('停止播放失败:', error);
      setRecordingState(prev => ({
        ...prev,
        error: '停止播放失败',
      }));
    }
  }, [sound, recordingState.isPlaying]);

  // 清除录制
  const clearRecording = useCallback(async () => {
    try {
      await cleanup();
      
      // 删除录制文件
      if (recordingState.uri) {
        await FileSystem.deleteAsync(recordingState.uri, { idempotent: true });
      }

      setRecording(null);
      setSound(null);
      setRecordingState({
        isRecording: false,
        isPlaying: false,
        isLoading: false,
        duration: 0,
        uri: null,
        base64Data: null,
        error: null,
      });
    } catch (error) {
      console.error('清除录制失败:', error);
      setRecordingState(prev => ({
        ...prev,
        error: '清除录制失败',
      }));
    }
  }, [cleanup, recordingState.uri]);

  // 获取录制时长（秒）
  const getDurationInSeconds = useCallback(() => {
    return Math.floor(recordingState.duration / 1000);
  }, [recordingState.duration]);

  // 格式化时长显示
  const formatDuration = useCallback((duration: number = recordingState.duration) => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, [recordingState.duration]);

  // 检查是否接近最大时长
  const isNearMaxDuration = useCallback(() => {
    return recordingState.duration >= maxDuration * 0.9; // 90%时提醒
  }, [recordingState.duration, maxDuration]);

  // 清理资源
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // 状态
    state: recordingState,
    
    // 操作方法
    startRecording,
    stopRecording,
    playRecording,
    stopPlaying,
    clearRecording,
    
    // 工具方法
    getDurationInSeconds,
    formatDuration,
    isNearMaxDuration,
    
    // 配置信息
    maxDuration,
    audioFormat,
  };
} 