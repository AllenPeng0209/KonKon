import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';

export default function CreateFamilyScreen() {
  const router = useRouter();
  const { createFamily, loading, error } = useFamily();
  const { user, session } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleBack = () => {
    router.back();
  };

  const handleCreateFamily = async () => {
    if (!formData.name.trim()) {
      Alert.alert(t('createFamily.errorTitle'), t('createFamily.errorNameRequired'));
      return;
    }

    try {
      const result = await createFamily({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      if (result) {
        // 直接跳转，不显示弹窗
        router.replace('/family-management');
      } else {
        Alert.alert(t('createFamily.errorTitle'), error || t('createFamily.errorCreateFailed'));
      }
    } catch (err) {
      console.error('家族作成エラー:', err);
      Alert.alert(t('createFamily.errorTitle'), t('createFamily.errorCreateFailed'));
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
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('createFamily.title')}</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 说明文本 */}
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>{t('createFamily.introTitle')}</Text>
            <Text style={styles.introText}>
              {t('createFamily.introText')}
            </Text>
          </View>

          {/* 表单区域 */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('createFamily.familyName')} <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t('createFamily.familyNamePlaceholder')}
                placeholderTextColor="#9CA3AF"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('createFamily.description')} <Text style={styles.optional}>{t('createFamily.optional')}</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder={t('createFamily.descriptionPlaceholder')}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
          </View>

          {/* 功能说明 */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>{t('createFamily.featuresTitle')}</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📅</Text>
                <Text style={styles.featureText}>{t('createFamily.featureSharedCalendar')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>👥</Text>
                <Text style={styles.featureText}>{t('createFamily.featureShareSchedules')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📝</Text>
                <Text style={styles.featureText}>{t('createFamily.featureManageTasks')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💬</Text>
                <Text style={styles.featureText}>{t('createFamily.featureCommunication')}</Text>
              </View>
            </View>
          </View>

          {/* 错误提示 */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateFamily}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? t('createFamily.creatingButton') : t('createFamily.createButton')}
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
    paddingVertical: 32,
    alignItems: 'center',
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  optional: {
    color: '#9CA3AF',
    fontSize: 14,
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
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  featuresSection: {
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
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#4b5563',
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  createButton: {
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
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  debugContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
}); 