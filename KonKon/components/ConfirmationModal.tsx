import { t } from '@/lib/i18n';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarEvent } from '../lib/bailian_omni_calendar';

interface ConfirmationModalProps {
  isVisible: boolean;
  event: CalendarEvent | null;
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
  event,
  onConfirm,
  onCancel,
}) => {
  if (!event) return null;

  const timeRange = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
  const confidence = Math.round(event.confidence * 100);

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
            <Text style={styles.title}>🎯 {t('home.confirmationSuccessTitle')}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.message}>{t('home.confirmationConfirmMessage')}</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>{t('home.confirmationEventLabel')}:</Text>
              <Text style={styles.infoValue}>{event.title}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>⏰</Text>
              <Text style={styles.infoLabel}>{t('home.confirmationTimeLabel')}:</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{timeRange}</Text>
            </View>

            {event.location && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoLabel}>{t('home.confirmationLocationLabel')}:</Text>
                <Text style={styles.infoValue}>{event.location}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
               <Text style={styles.infoIcon}>🎯</Text>
              <Text style={styles.infoLabel}>{t('home.confirmationConfidenceLabel')}:</Text>
              <Text style={styles.infoValue}>{confidence}%</Text>
            </View>
            
            <Text style={styles.confirmQuestion}>{t('home.confirmationConfirmQuestion')}</Text>
          </View>
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
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    gap: 15,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 18,
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
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    borderRightWidth: 1,
    borderRightColor: '#EFEFEF',
  },
  confirmButton: {
    backgroundColor: '#F0F9FF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  buttonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  confirmButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
}); 