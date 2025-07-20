import { t } from '@/lib/i18n';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarEvent } from '../../lib/bailian_omni_calendar';

interface ConfirmationModalProps {
  isVisible: boolean;
  events: CalendarEvent[];
  userInput: string | null;
  summary: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isVisible,
  events,
  userInput,
  summary,
  onConfirm,
  onCancel,
}) => {
  if (!events || events.length === 0) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t(events.length > 1 ? 'home.confirmationTitleMultiple' : 'home.confirmationTitleSingle')}</Text>
          </View>
          <ScrollView style={styles.contentContainer} contentContainerStyle={styles.content}>
            {userInput && (
              <View style={styles.dialogueBox}>
                <Text style={styles.userMessage}>“{userInput}”</Text>
                <Text style={styles.aiMessage}>
                  🦝 {summary || t('home.confirmationConfirmMessage')}
                </Text>
              </View>
            )}
            
            {events.map((event, index) => {
              const timeRange = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
              return (
                <View key={index} style={[styles.infoCard, index > 0 && { marginTop: 15 }]}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📅</Text>
                    <Text style={styles.infoLabel}>{t('home.confirmationEventLabel')}:</Text>
                    <Text style={styles.infoValue}>{event.title}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>⏰</Text>
                    <Text style={styles.infoLabel}>{t('home.confirmationTimeLabel')}:</Text>
                    <Text style={styles.infoValue}>{timeRange}</Text>
                  </View>

                  {event.location && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>📍</Text>
                      <Text style={styles.infoLabel}>{t('home.confirmationLocationLabel')}:</Text>
                      <Text style={styles.infoValue}>{event.location}</Text>
                    </View>
                  )}
                </View>
              );
            })}
            
            <Text style={styles.confirmQuestion}>{t('home.confirmationConfirmQuestion')}</Text>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>{t('home.confirmationCancelButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={[styles.buttonText, styles.confirmButtonText]}>✓ {t('home.confirmationCreateButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 320,
    maxHeight: '80%',
    backgroundColor: '#F7F9FC', // 更改背景色
    borderRadius: 20, // 增加圆角
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    padding: 16,
    backgroundColor: '#E6F4FF', // 柔和的蓝色
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#005A9C', // 深蓝色字体
  },
  contentContainer: {
    // flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  dialogueBox: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  userMessage: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 12,
  },
  aiMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  infoCard: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#000',
    flex: 1,
  },
  confirmQuestion: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  button: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#D6EFFF',
  },
  buttonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  confirmButtonText: {
    color: '#005A9C',
    fontWeight: 'bold',
  },
}); 