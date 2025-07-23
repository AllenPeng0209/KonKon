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

// 空間標籤定義
const SPACE_TAGS = [
  { id: 'family', name: '家人', icon: '🏠', color: '#4CAF50', description: '一眼就確認家人們的行事。再也不會有「忘記講」的問題！' },
  { id: 'personal', name: '私人', icon: '🔒', color: '#2196F3', description: '快速地建立自己的行事。您可以將屬於不同行事層的行事放在一起確認。' },
  { id: 'couple', name: '情人', icon: '💖', color: '#E91E63', description: '建立行事與紀念日並與對方共享吧！' },
  { id: 'work', name: '工作', icon: '💼', color: '#2196F3', description: '公司會議與客人的預約將變得一目瞭然！' },
  { id: 'friend', name: '朋友', icon: '👥', color: '#4CAF50', description: '使用行事層共享下次出遊的時間。您可以使用留言功能快速地進行溝通。' },
  { id: 'course', name: '課程', icon: '🎯', color: '#2196F3', description: '課表管理將變得更確實。若有任何更新都將會通知您。' },
  { id: 'school', name: '學校活動', icon: '🏫', color: '#FF9800', description: '您可以分享學校的活動或是作業的期限。' },
  { id: 'club', name: '社團', icon: '⭐', color: '#FF5722', description: '分享社團的行事或練習的時間。您也可以在行事的備註內記錄練習的內容。' },
  { id: 'hobby', name: '興趣', icon: '💡', color: '#9C27B0', description: '與大家快樂地分享遊戲或喜歡的藝術家的行事！' },
  { id: 'other', name: '其他', icon: '👥', color: '#607D8B', description: '若沒有符合您行事層的用途請選擇這裡。' }
];

export default function CreateFamilyScreen() {
  const router = useRouter();
  const { createFamily, switchFamily, loading, error } = useFamily();
  const { user, session } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tag: 'family', // 默認為家人標籤
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
        tag: formData.tag,
      });

      if (result) {
        // 創建成功後自動切換到新創建的空間
        await switchFamily(result.id);
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('createFamily.spaceTag')}</Text>
              <Text style={styles.tagDescription}>{t('createFamily.spaceTagDescription')}</Text>
              <View style={styles.tagContainer}>
                {SPACE_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagOption,
                      formData.tag === tag.id && styles.tagOptionSelected,
                      { borderColor: tag.color }
                    ]}
                    onPress={() => setFormData({ ...formData, tag: tag.id })}
                  >
                    <Text style={styles.tagIcon}>{tag.icon}</Text>
                    <Text style={[
                      styles.tagName,
                      formData.tag === tag.id && styles.tagNameSelected
                    ]}>
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* 顯示選中標籤的描述 */}
              {formData.tag && (
                <View style={styles.tagDescriptionBox}>
                  <Text style={styles.tagDescriptionText}>
                    {SPACE_TAGS.find(tag => tag.id === formData.tag)?.description}
                  </Text>
                </View>
              )}
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
  tagDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#f9fafb',
    minWidth: 80,
  },
  tagOptionSelected: {
    backgroundColor: '#e0f2fe',
  },
  tagIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tagName: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  tagNameSelected: {
    color: '#0369a1',
    fontWeight: '600',
  },
  tagDescriptionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  tagDescriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
}); 