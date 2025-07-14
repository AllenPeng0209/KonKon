import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useEvents } from '../hooks/useEvents';
import {
    CalendarEvent,
    ParsedCalendarResult,
    testOmniConnection,
    testSpeechConnection
} from '../lib/bailian_omni_calendar';
import SmartButton from './ui/SmartButton';

interface VoiceToCalendarProps {
  isVisible: boolean;
  onClose: () => void;
  onEventsCreated?: (events: CalendarEvent[]) => void;
}

export const VoiceToCalendar: React.FC<VoiceToCalendarProps> = ({
  isVisible,
  onClose,
  onEventsCreated,
}) => {
  const [parseResult, setParseResult] = useState<ParsedCalendarResult | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isCreatingEvents, setIsCreatingEvents] = useState(false);
  
  const { createEvent } = useEvents();

  // 测试连接
  const handleTestConnection = useCallback(async () => {
    setIsConnecting(true);
    try {
      // 测试文字模型和语音识别模型
      const [textConnected, speechConnected] = await Promise.all([
        testOmniConnection(),
        testSpeechConnection()
      ]);
      
      const isConnected = textConnected && speechConnected;
      setConnectionStatus(isConnected ? 'connected' : 'failed');
      
      if (isConnected) {
        Alert.alert(t('voiceToCalendar.connectionSuccess'), t('voiceToCalendar.connectionNormal'));
      } else {
        let message = `${t('voiceToCalendar.connectionFailed')}:\n`;
        if (!textConnected) message += `${t('voiceToCalendar.textProcessingFailed')}\n`;
        if (!speechConnected) message += `${t('voiceToCalendar.speechRecognitionFailed')}\n`;
        message += t('voiceToCalendar.checkNetworkAndApiKey');
        Alert.alert(t('voiceToCalendar.connectionFailed'), message);
      }
    } catch (error) {
      console.error('连接测试失败:', error);
      setConnectionStatus('failed');
      Alert.alert(t('voiceToCalendar.connectionTestFailed'), t('voiceToCalendar.checkNetworkAndApiKey'));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // 处理语音识别结果
  const handleVoiceResult = useCallback((result: ParsedCalendarResult) => {
    setParseResult(result);
    
    // 默认选择所有事件
    const eventIds = new Set(result.events.map(event => event.id));
    setSelectedEvents(eventIds);
  }, []);

  // 处理错误
  const handleError = useCallback((error: string) => {
    console.error('语音处理错误:', error);
    Alert.alert(t('voiceToCalendar.processingFailed'), error);
  }, []);

  // 切换事件选择
  const toggleEventSelection = useCallback((eventId: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  }, []);

  // 创建选中的事件
  const handleCreateEvents = useCallback(async () => {
    if (!parseResult || selectedEvents.size === 0) return;
    
    setIsCreatingEvents(true);
    
    try {
      const eventsToCreate = parseResult.events.filter(event => 
        selectedEvents.has(event.id)
      );
      
             // 创建事件
       for (const event of eventsToCreate) {
         await createEvent({
           title: event.title,
           description: event.description || '',
           startTime: event.startTime,
           endTime: event.endTime,
           location: event.location || '',
         });
       }
      
      onEventsCreated?.(eventsToCreate);
      
      Alert.alert(
        t('voiceToCalendar.creationSuccess'),
        t('voiceToCalendar.creationSuccessMessage', { count: eventsToCreate.length }),
        [
          { text: t('voiceToCalendar.ok'), onPress: onClose }
        ]
      );
    } catch (error) {
      console.error('创建事件失败:', error);
      Alert.alert(t('voiceToCalendar.creationFailed'), t('voiceToCalendar.creationErrorMessage'));
    } finally {
      setIsCreatingEvents(false);
    }
     }, [parseResult, selectedEvents, createEvent, onEventsCreated, onClose]);

  // 格式化时间显示
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
    }).format(date);
  };

  // 重置状态
  const handleReset = useCallback(() => {
    setParseResult(null);
    setSelectedEvents(new Set());
  }, []);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('voiceToCalendar.voiceCreateSchedule')}</Text>
          <TouchableOpacity 
            onPress={handleTestConnection} 
            style={styles.testButton}
            disabled={isConnecting}
          >
            <Ionicons 
              name={
                connectionStatus === 'connected' ? 'checkmark-circle' :
                connectionStatus === 'failed' ? 'alert-circle' : 'help-circle'
              }
              size={24} 
              color={
                connectionStatus === 'connected' ? '#34C759' :
                connectionStatus === 'failed' ? '#FF3B30' : '#007AFF'
              }
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 语音输入区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('voiceToCalendar.voiceCreateSchedule')}</Text>
            <SmartButton
              onParseResult={handleVoiceResult}
              onError={handleError}
              text={t('voiceToCalendar.longPressToSpeak')}
            />
            <Text style={styles.inputHint}>
              {t('voiceToCalendar.inputHint')}
            </Text>
          </View>

          {/* 解析结果 */}
          {parseResult && (
            <View style={styles.section}>
              <View style={styles.resultHeader}>
                <Text style={styles.sectionTitle}>{t('voiceToCalendar.parsingResult')}</Text>
                <TouchableOpacity 
                  onPress={handleReset}
                  style={styles.resetButton}
                >
                  <Ionicons name="refresh" size={20} color="#007AFF" />
                  <Text style={styles.resetText}>{t('voiceToCalendar.reset')}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>{parseResult.summary}</Text>
                <Text style={styles.confidenceText}>
                  {t('voiceToCalendar.confidence', { confidence: Math.round(parseResult.confidence * 100) })}
                </Text>
              </View>

              {/* 事件列表 */}
              {parseResult.events.length > 0 && (
                <View style={styles.eventsContainer}>
                  <Text style={styles.eventsTitle}>
                    {t('voiceToCalendar.detectedEvents', { count: parseResult.events.length })}
                  </Text>
                  
                  {parseResult.events.map((event, index) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.eventItem,
                        selectedEvents.has(event.id) && styles.eventItemSelected
                      ]}
                      onPress={() => toggleEventSelection(event.id)}
                    >
                      <View style={styles.eventHeader}>
                        <View style={styles.eventTitleContainer}>
                          <Ionicons
                            name={selectedEvents.has(event.id) ? "checkmark-circle" : "ellipse-outline"}
                            size={20}
                            color={selectedEvents.has(event.id) ? "#007AFF" : "#999"}
                          />
                          <Text style={styles.eventTitle}>{event.title}</Text>
                        </View>
                        <Text style={styles.eventConfidence}>
                          {t('voiceToCalendar.confidence', { confidence: Math.round(event.confidence * 100) })}
                        </Text>
                      </View>
                      
                      <View style={styles.eventDetails}>
                        <Text style={styles.eventTime}>
                          <Ionicons name="time" size={14} color="#666" />
                          {' '}{formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </Text>
                        
                        {event.location && (
                          <Text style={styles.eventLocation}>
                            <Ionicons name="location" size={14} color="#666" />
                            {' '}{event.location}
                          </Text>
                        )}
                        
                        {event.description && (
                          <Text style={styles.eventDescription}>
                            {event.description}
                          </Text>
                        )}
                        
                        {event.isRecurring && (
                          <Text style={styles.eventRecurring}>
                            <Ionicons name="repeat" size={14} color="#666" />
                            {' '}{event.recurringPattern}
                          </Text>
                        )}
                      </View>
                      
                      {event.confidence < 0.7 && (
                        <View style={styles.lowConfidenceWarning}>
                          <Ionicons name="warning" size={14} color="#FF9500" />
                          <Text style={styles.warningText}>置信度较低，请确认</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* 底部操作栏 */}
        {parseResult && parseResult.events.length > 0 && (
          <View style={styles.bottomBar}>
            <Text style={styles.selectionText}>
              {t('voiceToCalendar.selectedEvents', { selected: selectedEvents.size, total: parseResult.events.length })}
            </Text>
            <TouchableOpacity
              style={[styles.createButton, (isCreatingEvents || selectedEvents.size === 0) && styles.createButtonDisabled]}
              onPress={handleCreateEvents}
              disabled={isCreatingEvents || selectedEvents.size === 0}
            >
              <Text style={styles.createButtonText}>
                {isCreatingEvents ? t('voiceToCalendar.processing') : `${t('voiceToCalendar.createEvents')} (${selectedEvents.size})`}
              </Text>
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  testButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetText: {
    color: '#007AFF',
    fontSize: 14,
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666666',
  },
  eventsContainer: {
    marginTop: 8,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  eventItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  eventItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  eventConfidence: {
    fontSize: 12,
    color: '#666666',
  },
  eventDetails: {
    gap: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#666666',
  },
  eventLocation: {
    fontSize: 14,
    color: '#666666',
  },
  eventDescription: {
    fontSize: 14,
    color: '#333333',
    fontStyle: 'italic',
  },
  eventRecurring: {
    fontSize: 14,
    color: '#666666',
  },
  lowConfidenceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 6,
    borderRadius: 4,
    marginTop: 8,
    gap: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  selectionText: {
    fontSize: 14,
    color: '#666666',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
}); 