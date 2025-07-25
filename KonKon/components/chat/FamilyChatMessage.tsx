import { useAuth } from '@/contexts/AuthContext';
import { UIFamilyChatMessage } from '@/lib/familyChat';
import { Image, StyleSheet, Text, View } from 'react-native';

interface FamilyChatMessageProps {
  message: UIFamilyChatMessage;
}

export function FamilyChatMessage({ message }: FamilyChatMessageProps) {
  const { user } = useAuth();
  const isOwnMessage = message.user_id === user?.id;
  const isAssistant = message.type === 'assistant';

  // 生成用户头像颜色（基于用户ID哈希）
  const getUserAvatarColor = (userId: string) => {
    const colors = [
      '#4A90E2', // 蓝色
      '#7ED321', // 绿色
      '#F5A623', // 橙色
      '#D0021B', // 红色
      '#9013FE', // 紫色
      '#50E3C2', // 青色
      '#F8E71C', // 黄色
      '#BD10E0', // 粉紫色
      '#B8E986', // 浅绿色
      '#FF6900'  // 橙红色
    ];
    
    // 简单哈希函数
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    return colors[hash % colors.length];
  };

  // 渲染头像
  const renderAvatar = () => {
    if (isAssistant) {
      return (
        <Image 
          source={require('../../assets/images/cat-avatar.png')} 
          style={[styles.avatar, styles.assistantAvatarImage]}
          defaultSource={require('../../assets/images/icon.png')}
        />
      );
    }

    // 如果有头像URL，优先显示图片
    if (message.user_avatar) {
      return (
        <Image 
          source={{ uri: message.user_avatar }} 
          style={styles.avatar}
          defaultSource={require('../../assets/images/icon.png')}
        />
      );
    }

    // 否则显示彩色字母头像
    const avatarColor = getUserAvatarColor(message.user_id || 'default');
    const userInitial = message.user_name?.[0]?.toUpperCase() || '?';

    return (
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{userInitial}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isOwnMessage && !isAssistant ? (
        // 自己的消息：右侧蓝色气泡，无头像
        <View style={styles.ownMessageWrapper}>
          <View style={styles.ownMessageBubble}>
            <Text style={styles.ownMessageText}>{message.content}</Text>
            {message.isLoading && <Text style={styles.loadingDots}>...</Text>}
          </View>
        </View>
      ) : (
        // 他人的消息：左侧白色气泡，带头像和用户名
        <View style={styles.otherMessageWrapper}>
          <View style={styles.avatarContainer}>
            {renderAvatar()}
          </View>
          
          <View style={styles.messageColumn}>
            <Text style={styles.senderName}>
              {isAssistant ? '喵萌助手' : message.user_name || '未知用户'}
            </Text>
            
            <View style={styles.otherMessageBubble}>
              <Text style={styles.otherMessageText}>{message.content}</Text>
              {message.isLoading && <Text style={styles.loadingDots}>...</Text>}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 12,
  },
  // 自己的消息样式
  ownMessageWrapper: {
    alignItems: 'flex-end',
    marginBottom: 4,
    paddingLeft: 40, // 為了平衡左右間距
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF', // iOS蓝色
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderTopRightRadius: 4, // 微信特色的小角
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    alignSelf: 'flex-end',
  },
  ownMessageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF', // 白色文字在蓝色背景上更清晰
  },
  // 他人的消息样式
  otherMessageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingRight: 40, // 為了平衡左右間距
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 0, // 与顶部对齐
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 6, // 稍微圓潤一點
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatar: {
    backgroundColor: '#C0C0C0',
  },
  assistantAvatar: {
    backgroundColor: '#E8F5E8',
  },
  assistantAvatarImage: {
    backgroundColor: '#FFF5F5', // 淡粉色背景突出猫咪
    borderRadius: 6,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF', // 白色文字在彩色背景上
  },
  assistantAvatarText: {
    fontSize: 18,
    fontWeight: '500',
  },
  messageColumn: {
    flex: 1,
    maxWidth: '85%',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '400',
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderTopLeftRadius: 4, // 微信特色的小角
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    alignSelf: 'flex-start',
  },
  otherMessageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
  },
  loadingDots: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
}); 
; 