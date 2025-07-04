import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import RecordButton from '@/components/ui/RecordButton';

export default function ExploreScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // 返回记录页面
  const navigateToHome = () => {
    router.back();
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
          <TouchableOpacity style={styles.avatarButton}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
          {/* 用户消息 */}
          <View style={styles.userMessageContainer}>
            <View style={styles.userMessage}>
              <Text style={styles.userMessageText}>
                帮我分析一下上周/本周的账单情况
              </Text>
            </View>
          </View>

          {/* AI回复 */}
          <View style={styles.aiMessageContainer}>
            <Text style={styles.aiMessageText}>
              未找到相关记账记录，可以试着告诉我更多细节，我会尽力帮你的！
            </Text>
            
            {/* 操作按钮 */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonIcon}>💭</Text>
                <Text style={styles.actionButtonText}>刷新</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonIcon}>🔄</Text>
                <Text style={styles.actionButtonText}>重新生成</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 功能推荐按钮 */}
          <View style={styles.recommendedActions}>
            <TouchableOpacity style={styles.recommendedButton}>
              <Text style={styles.recommendedIcon}>🧠</Text>
              <Text style={styles.recommendedText}>MBTI分析</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.recommendedButton}>
              <Text style={styles.recommendedIcon}>📊</Text>
              <Text style={styles.recommendedText}>消费性格测试</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.recommendedButton}>
              <Text style={styles.recommendedIcon}>📈</Text>
              <Text style={styles.recommendedText}>本月账单分析</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* 底部输入区域 */}
        <RecordButton 
          onPress={() => console.log('Record pressed')}
          onMorePress={() => console.log('More pressed')}
          text="有什么想问我的吗？"
          icon="🎤"
        />
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
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
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
  content: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  aiMessageText: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
  },
  recommendedActions: {
    gap: 12,
    marginBottom: 20,
  },
  recommendedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  recommendedIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  recommendedText: {
    fontSize: 16,
    color: '#333',
  },

});
