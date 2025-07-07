import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 聊天组件
import { ChatContainer } from '../../components/chat/ChatContainer';
import { KeyboardFriendlyScrollView } from '../../components/chat/KeyboardFriendlyScrollView';
import { ChatToolbar } from '../../components/chat/ChatToolbar';
import { FirstSuggestions } from '../../components/chat/FirstSuggestions';
import { UserMessage } from '../../components/chat/UserMessage';
import { AssistantMessage } from '../../components/chat/AssistantMessage';
import { AnimatedLogo } from '../../components/chat/AnimatedLogo';
import { BailianConfig } from '../../components/chat/BailianConfig';

// 自定义 Hook
import { useChat } from '../../hooks/useChat';

export default function ExploreScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  
  // 聊天功能
  const { messages, isLoading, sendMessage, clearMessages } = useChat();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const navigateToHome = () => {
    router.back();
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const handleClearChat = () => {
    clearMessages();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={navigateToHome}>
            <Text style={styles.headerTitle}>记录</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, styles.activeTab]}>洞察</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.clearButtonContainer}>
            {messages.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearChat}
              >
                <Text style={styles.clearButtonText}>清空</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.avatarButton} onPress={navigateToProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 配置检查 */}
      <BailianConfig />

      {/* 聊天界面 */}
      <ChatContainer>
        {/* 消息滚动区域 */}
        <KeyboardFriendlyScrollView
          style={styles.messagesContainer}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.messagesContentContainer,
            {
              paddingTop: 24,
              paddingBottom: 40, // 进一步减少到40，让消息更贴近输入框
              flex: messages.length === 0 ? 1 : undefined,
            },
          ]}
        >
          {/* 消息列表 */}
          {messages.map((message) => (
            <View key={message.id} style={styles.messageWrapper}>
              {message.type === 'user' ? (
                <UserMessage>{message.content}</UserMessage>
              ) : (
                <AssistantMessage isLoading={message.isLoading}>
                  {message.content}
                </AssistantMessage>
              )}
            </View>
          ))}
        </KeyboardFriendlyScrollView>

        {/* 空状态 - 显示动画 Logo */}
        {messages.length === 0 && (
          <View style={{ flex: 4, justifyContent: 'center', alignItems: 'center' }}>
            <AnimatedLogo />
          </View>
        )}

        {/* 底部输入区域 */}
        <View style={styles.toolbarContainer}>
          {/* 首次建议（仅在没有消息时显示） */}
          {messages.length === 0 && (
            <FirstSuggestions onSuggestionPress={handleSuggestionPress} />
          )}
          
          {/* 输入工具栏 */}
          <ChatToolbar 
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </View>
      </ChatContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8, // 减少顶部padding
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 20,
    color: '#999',
  },
  activeTab: {
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 40, // 确保头部右侧有最小高度
  },
  clearButtonContainer: {
    minWidth: 60, // 给清空按钮预留固定空间，避免布局跳动
    alignItems: 'flex-end',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContentContainer: {
    gap: 16,
  },
  messageWrapper: {
    // 消息包装器样式
  },
  toolbarContainer: {
    // 工具栏容器样式
  },
});
