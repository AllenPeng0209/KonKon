import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

// 聊天组件
import { AnimatedLogo } from '../../components/chat/AnimatedLogo';

import { BailianConfig } from '../../components/chat/BailianConfig';
import { ChatContainer } from '../../components/chat/ChatContainer';
import { ChatToolbar } from '../../components/chat/ChatToolbar';

import { FamilyChatMessage } from '../../components/chat/FamilyChatMessage';

// 自定义 Hook
import { t } from '@/lib/i18n';

import { useFamilyChat } from '../../hooks/useFamilyChat';
import { useEvents } from '../../hooks/useEvents';

export default function ExploreScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 只使用家庭群聊功能
  const {
    messages: familyMessages,
    isLoading: isFamilyLoading,
    isLoadingHistory,
    sendMessage: sendFamilyMessage,
    clearChat: clearFamilyChat,
    saveChatSession,
    hasFamily: hasFamilyChat,
    familyName,
    memberCount,
  } = useFamilyChat();

  // 获取家庭相关信息用于显示状态
  const { events } = useEvents();
  const eventsCount = events.length;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [familyMessages]);

  const handleSendMessage = async (message: string) => {
    await sendFamilyMessage(message);
  };



  const navigateToHome = () => {
    router.back();
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  // 移除清除聊天功能，因为群聊记录需要保持持久化

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('explore.loading')}</Text>
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
            <Text style={styles.headerTitle}>{t('tabs.record')}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, styles.activeTab]}>{t('tabs.explore')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.avatarButton} onPress={navigateToProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 配置检查 */}
      <BailianConfig />

      {/* 家庭群聊状态 */}
      {hasFamilyChat && (
        <View style={[styles.calendarStatus, { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800' }]}>
          <Text style={styles.calendarStatusIcon}>👥</Text>
          <Text style={[styles.calendarStatusText, { color: '#F57C00' }]}>
            {familyName} • {memberCount}名成员 • {eventsCount}個事件
          </Text>
          {isLoadingHistory && (
            <Text style={[styles.calendarStatusText, { color: '#F57C00', fontSize: 12 }]}>
               • 加载中...
            </Text>
          )}
        </View>
      )}

      {/* 聊天界面 */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ChatContainer>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContentContainer}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {familyMessages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AnimatedLogo />
                {hasFamilyChat && (
                  <Text style={styles.emptyText}>
                    欢迎来到{familyName}群聊！
                  </Text>
                )}
              </View>
            ) : (
              familyMessages.map((message) => (
                <View key={message.id} style={styles.messageWrapper}>
                  <FamilyChatMessage message={message} />
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.toolbarContainer}>
            <ChatToolbar 
              onSendMessage={handleSendMessage}
              disabled={isFamilyLoading}
            />
          </View>
        </ChatContainer>
      </KeyboardAvoidingView>
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'flex-end',
    gap: 16,
  },
  messageWrapper: {
    // 消息包装器样式
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  calendarStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  calendarStatusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  calendarStatusText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },

  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});
