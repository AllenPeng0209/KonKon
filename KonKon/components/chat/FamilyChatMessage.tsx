import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UIFamilyChatMessage } from '@/lib/familyChat';
import { useAuth } from '@/contexts/AuthContext';

interface FamilyChatMessageProps {
  message: UIFamilyChatMessage;
}

export function FamilyChatMessage({ message }: FamilyChatMessageProps) {
  const { user } = useAuth();
  const isOwnMessage = message.user_id === user?.id;
  const isAssistant = message.type === 'assistant';

  return (
    <View style={[
      styles.container,
      isOwnMessage && !isAssistant ? styles.ownMessage : styles.otherMessage
    ]}>
      {/* 头像和用户名 */}
      {!isAssistant && !isOwnMessage && (
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {message.user_avatar ? '👤' : message.user_name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{message.user_name || '未知用户'}</Text>
        </View>
      )}
      
      {/* AI 助手标识 */}
      {isAssistant && (
        <View style={styles.assistantInfo}>
          <View style={[styles.avatar, styles.assistantAvatar]}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
          <Text style={styles.assistantName}>喵萌助手</Text>
        </View>
      )}

      {/* 消息内容 */}
      <View style={[
        styles.messageContent,
        isOwnMessage && !isAssistant ? styles.ownMessageContent : 
        isAssistant ? styles.assistantMessageContent : styles.otherMessageContent
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage && !isAssistant ? styles.ownMessageText : 
          isAssistant ? styles.assistantMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>
        
        {/* 时间戳 */}
        <Text style={styles.timestamp}>
          {new Date(message.created_at).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>

      {/* 加载状态 */}
      {message.isLoading && (
        <View style={styles.loadingIndicator}>
          <Text style={styles.loadingText}>...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  assistantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  assistantAvatar: {
    backgroundColor: '#E8F5E8',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  assistantName: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  messageContent: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ownMessageContent: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageContent: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  assistantMessageContent: {
    backgroundColor: '#F0FFF0',
    borderBottomLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  assistantMessageText: {
    color: '#2E7D32',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
  loadingIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
}); 