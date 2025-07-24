import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
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
      Alert.alert(t('joinFamily.errorTitle'), t('joinFamily.errorCodeRequired'));
      return;
    }

    try {
      const success = await joinFamilyByCode(inviteCode.trim());
      if (success) {
        Alert.alert(
          t('joinFamily.successTitle'),
          t('joinFamily.successMessage'),
          [
            {
              text: t('joinFamily.ok'),
              onPress: () => {
                router.replace('/family-management');
              },
            },
          ]
        );
      } else {
        Alert.alert(t('joinFamily.errorTitle'), error || t('joinFamily.joinFailed'));
      }
    } catch (err) {
      console.error('家族参加エラー:', err);
      Alert.alert(t('joinFamily.errorTitle'), t('joinFamily.joinFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('joinFamily.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* 说明文本 */}
            <View style={styles.introSection}>
              <Text style={styles.introIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.introTitle}>{t('joinFamily.introTitle')}</Text>
              <Text style={styles.introText}>
                {t('joinFamily.introText')}
              </Text>
            </View>

            {/* 表单区域 */}
            <View style={styles.formSection}>
              <Text style={styles.label}>{t('joinFamily.inviteCode')}</Text>
              <TextInput
                style={styles.input}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder={t('joinFamily.inviteCodePlaceholder')}
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
              <Text style={styles.helpTitle}>{t('joinFamily.helpTitle')}</Text>
              <Text style={styles.helpText}>
                {t('joinFamily.helpText1')}{'\n'}
                {t('joinFamily.helpText2')}{'\n'}
                {t('joinFamily.helpText3')}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.joinButton, loading && styles.joinButtonDisabled]}
            onPress={handleJoinFamily}
            disabled={loading || !inviteCode.trim()}
          >
            <Text style={styles.joinButtonText}>
              {loading ? t('joinFamily.joiningButton') : t('joinFamily.joinButton')}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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