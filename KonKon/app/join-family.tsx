import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFamily } from '../contexts/FamilyContext';

export default function JoinFamilyScreen() {
  const router = useRouter();
  const { joinFamilyByCode, loading, error } = useFamily();
  const [inviteCode, setInviteCode] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('エラー', '招待コードを入力してください');
      return;
    }

    try {
      const success = await joinFamilyByCode(inviteCode.trim());
      if (success) {
        Alert.alert(
          '成功！',
          '家族に参加しました！',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/family-management');
              },
            },
          ]
        );
      } else {
        Alert.alert('エラー', error || '家族への参加に失敗しました');
      }
    } catch (err) {
      console.error('家族参加エラー:', err);
      Alert.alert('エラー', '家族への参加に失敗しました');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* 顶部标题栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>家族に参加</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          {/* 说明文本 */}
          <View style={styles.introSection}>
            <Text style={styles.introIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.introTitle}>招待コードで家族に参加</Text>
            <Text style={styles.introText}>
              家族から共有された招待コードを入力して、{'\n'}
              家族グループに参加してください。
            </Text>
          </View>

          {/* 表单区域 */}
          <View style={styles.formSection}>
            <Text style={styles.label}>招待コード</Text>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="招待コードを入力してください"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* 说明 */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>招待コードとは？</Text>
            <Text style={styles.helpText}>
              • 家族の管理者から共有される英数字のコード{'\n'}
              • 家族グループに参加するために必要{'\n'}
              • 一度参加すると、家族のスケジュールや情報を共有できます
            </Text>
          </View>
        </View>

        {/* 底部按钮 */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.joinButton, loading && styles.joinButtonDisabled]}
            onPress={handleJoinFamily}
            disabled={loading || !inviteCode.trim()}
          >
            <Text style={styles.joinButtonText}>
              {loading ? '参加中...' : '家族に参加'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  introIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#fff',
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  helpSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
}); 