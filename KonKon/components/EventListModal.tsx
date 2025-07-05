import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Database } from '@/lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];

interface EventListModalProps {
  visible: boolean;
  onClose: () => void;
  events: Event[];
  date: Date;
  onDeleteEvent?: (eventId: string) => Promise<void>;
}

export default function EventListModal({
  visible,
  onClose,
  events,
  date,
  onDeleteEvent,
}: EventListModalProps) {
  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    Alert.alert(
      '删除事件',
      `确定要删除"${eventTitle}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            if (onDeleteEvent) {
              await onDeleteEvent(eventId);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* 标题栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>关闭</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{formatDate(date)}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {events.length > 0 ? (
            <View style={styles.eventsContainer}>
              <Text style={styles.eventsTitle}>共 {events.length} 个事件</Text>
              {events.map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <View style={[styles.eventColor, { backgroundColor: event.color || '#007AFF' }]} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.description && (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    )}
                    <View style={styles.eventMeta}>
                      <Text style={styles.eventTime}>
                        {formatTime(event.start_ts)} - {formatTime(event.end_ts)}
                      </Text>
                      {event.location && (
                        <Text style={styles.eventLocation}>📍 {event.location}</Text>
                      )}
                    </View>
                  </View>
                  {onDeleteEvent && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEvent(event.id, event.title)}
                    >
                      <Text style={styles.deleteButtonText}>删除</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>这天没有事件</Text>
              <Text style={styles.emptyDescription}>
                点击日历上的日期来查看或添加事件
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  closeButton: {
    fontSize: 17,
    color: '#3b82f6',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventsContainer: {
    marginBottom: 20,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  eventColor: {
    width: 6,
    height: 70,
    borderRadius: 3,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  eventDescription: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  eventMeta: {
    flexDirection: 'column',
    gap: 4,
  },
  eventTime: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  eventLocation: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    alignSelf: 'flex-start',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 