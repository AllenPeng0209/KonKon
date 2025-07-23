import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
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

import { ChatTimeStamp } from '../../components/chat/ChatTimeStamp';
import { FamilyChatMessage } from '../../components/chat/FamilyChatMessage';

// 自定义 Hook
import { t } from '@/lib/i18n';

import { useEvents } from '../../hooks/useEvents';
import { useFamilyChat } from '../../hooks/useFamilyChat';

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
    isLoadingMore,
    hasMoreMessages,
    sendMessage: sendFamilyMessage,
    loadMoreMessages,
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
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  }, [familyMessages]);

  const handleSendMessage = async (message: string) => {
    await sendFamilyMessage(message);
  };

  // 處理滾動事件，檢測是否需要加載更多消息
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // 檢測是否滑動到頂部附近
    const isNearTop = contentOffset.y <= 50;
    
    if (isNearTop && hasMoreMessages && !isLoadingMore && !isLoadingHistory) {
      console.log('[ExploreScreen] 用戶滑動到頂部，加載更多消息');
      loadMoreMessages();
    }
  };

  // 判断是否需要显示时间戳
  const shouldShowTimestamp = (currentMessage: any, previousMessage: any, index: number) => {
    if (index === 0) return true; // 第一条消息总是显示时间
    
    const currentTime = new Date(currentMessage.created_at);
    const previousTime = new Date(previousMessage.created_at);
    
    // 如果是不同的日期，显示时间戳
    if (currentTime.toDateString() !== previousTime.toDateString()) {
      return true;
    }
    
    // 如果间隔超过5分钟，显示时间戳
    const timeDiff = currentTime.getTime() - previousTime.getTime();
    return timeDiff > 5 * 60 * 1000; // 5分钟
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
      {/* 微信风格群聊标题栏 */}
      {hasFamilyChat && (
        <View style={styles.wechatHeader}>
          <TouchableOpacity style={styles.backButton} onPress={navigateToHome}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.groupTitle}>
              {familyName}（{memberCount}人）
            </Text>
            {isLoadingHistory && (
              <Text style={styles.loadingHint}>正在加载聊天记录...</Text>
            )}
          </View>

          <TouchableOpacity style={styles.moreButton} onPress={navigateToProfile}>
            <Text style={styles.moreButtonText}>•••</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 配置检查 */}
      <BailianConfig />

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
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            onScroll={handleScroll}
            scrollEventThrottle={100}
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
              <>
                {/* 加載更多消息的指示器 */}
                {isLoadingMore && (
                  <View style={styles.loadingMoreContainer}>
                    <Text style={styles.loadingMoreText}>正在加載更多消息...</Text>
                  </View>
                )}
                
                {/* 無更多消息的提示 */}
                {!hasMoreMessages && familyMessages.length > 0 && (
                  <View style={styles.loadingMoreContainer}>
                    <Text style={styles.noMoreMessagesText}>沒有更多消息了</Text>
                  </View>
                )}
                
                {familyMessages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    {shouldShowTimestamp(message, familyMessages[index - 1], index) && (
                      <ChatTimeStamp timestamp={message.created_at} />
                    )}
                    <View style={styles.messageWrapper}>
                      <FamilyChatMessage message={message} />
                    </View>
                  </React.Fragment>
                ))}
              </>
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
    backgroundColor: '#EDEDED', // 微信背景色
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDEDED',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },

  messagesContainer: {
    flex: 1,
  },
  messagesContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 0, // 移除水平padding，由消息组件自己控制
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'flex-end',
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
  // 微信风格标题栏样式
  wechatHeader: {
    backgroundColor: 'rgba(248, 248, 248, 0.98)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    height: 56,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '600',
    lineHeight: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 17,
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
    textAlign: 'center',
  },
  moreButton: {
    padding: 8,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 16,
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '400',
  },
  
  // 加載更多消息的樣式
  loadingMoreContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  noMoreMessagesText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
