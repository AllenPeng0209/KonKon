import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { UIFamilyChatMessage } from '@/lib/familyChat';
import { useAuth } from '@/contexts/AuthContext';

interface FamilyChatMessageProps {
  message: UIFamilyChatMessage;
}

export function FamilyChatMessage({ message }: FamilyChatMessageProps) {
  const { user } = useAuth();
  const isOwnMessage = message.user_id === user?.id;
  const isAssistant = message.type === 'assistant';

  // 生成用户头像颜色（根据用户ID）
  const getUserAvatarColor = (userId: string) => {
    const colors = [
      '#FF6B6B', // 红色
      '#4ECDC4', // 青色
      '#45B7D1', // 蓝色
      '#96CEB4', // 绿色
      '#FFEAA7', // 黄色
      '#DDA0DD', // 紫色
      '#FF8A65', // 橙色
      '#81C784', // 浅绿色
      '#64B5F6', // 浅蓝色
      '#FFB74D'  // 浅橙色
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // 获取用户名首字母
  const getUserInitial = () => {
    if (isAssistant) return '🤖';
    const name = message.user_name || '未知';
    return name[0]?.toUpperCase() || '?';
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage && !isAssistant ? styles.ownMessage : styles.otherMessage
    ]}>
      {/* 所有消息都显示头像和用户名 */}
      <View style={[
        styles.userInfo,
        isOwnMessage && !isAssistant ? styles.ownUserInfo : styles.otherUserInfo
      ]}>
        <View style={[
          styles.avatar,
          isAssistant ? styles.assistantAvatar : {
            backgroundColor: getUserAvatarColor(message.user_id || 'default')
          }
        ]}>
          {message.user_avatar && !isAssistant ? (
            <Image 
              source={{ uri: message.user_avatar }} 
              style={styles.avatarImage}
              defaultSource={require('../../assets/images/icon.png')} // 默认头像
            />
          ) : (
            <Text style={[
              styles.avatarText,
              isAssistant ? styles.assistantAvatarText : styles.userAvatarText
            ]}>
              {getUserInitial()}
            </Text>
          )}
        </View>
        <Text style={[
          styles.userName,
          isAssistant ? styles.assistantName : 
          isOwnMessage ? styles.ownUserName : styles.otherUserName
        ]}>
          {isAssistant ? '喵萌助手' : 
           isOwnMessage ? '我' : 
           message.user_name || '未知用户'}
        </Text>
      </View>

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
        
        {/* 时间戳和状态 */}
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            isOwnMessage && !isAssistant ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {new Date(message.created_at).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          {/* 在线状态指示器（可选） */}
          {!isAssistant && (
            <View style={[styles.statusDot, { backgroundColor: getUserAvatarColor(message.user_id || 'default') }]} />
          )}
        </View>
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
  ownUserInfo: {
    flexDirection: 'row-reverse', // 自己的消息头像在右边
    alignItems: 'center',
    marginBottom: 4,
  },
  otherUserInfo: {
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    overflow: 'hidden', // 确保图片不会溢出圆形边界
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  assistantAvatar: {
    backgroundColor: '#E8F5E8',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF', // 白色文字在彩色背景上
  },
  assistantAvatarText: {
    fontSize: 16, // AI助手图标稍大
  },
  userName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  ownUserName: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  otherUserName: {
    fontSize: 12,
    color: '#333',
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
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.7,
  },
  ownTimestamp: {
    fontSize: 10,
    opacity: 0.8,
    color: '#FFFFFF',
  },
  otherTimestamp: {
    fontSize: 10,
    opacity: 0.7,
    color: '#666',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
    opacity: 0.6,
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