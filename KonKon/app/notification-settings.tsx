import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamily } from '../contexts/FamilyContext';
import { useNotifications } from '../hooks/useNotifications';
import { t } from '../lib/i18n';

interface NotificationSetting {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettingsScreen() {
  const { activeFamily } = useFamily();
  const { notificationPreferences, updatePreferences } = useNotifications();
  
  // 動態獲取設置列表以支持多語言
  const getSettingsList = (): NotificationSetting[] => [
    {
      key: 'event_created_enabled',
      title: t('notificationSettings.eventCreatedTitle'),
      description: t('notificationSettings.eventCreatedDescription'),
      enabled: true,
    },
    {
      key: 'event_updated_enabled',
      title: t('notificationSettings.eventUpdatedTitle'),
      description: t('notificationSettings.eventUpdatedDescription'),
      enabled: true,
    },
    {
      key: 'event_deleted_enabled',
      title: t('notificationSettings.eventDeletedTitle'),
      description: t('notificationSettings.eventDeletedDescription'),
      enabled: true,
    },
    {
      key: 'event_reminder_enabled',
      title: t('notificationSettings.eventReminderTitle'),
      description: t('notificationSettings.eventReminderDescription'),
      enabled: true,
    },
    {
      key: 'family_invite_enabled',
      title: t('notificationSettings.familyInviteTitle'),
      description: t('notificationSettings.familyInviteDescription'),
      enabled: true,
    },
  ];
  
  const [settings, setSettings] = useState<NotificationSetting[]>([]);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 初始化設置並加載現有設置
  useEffect(() => {
    const initialSettings = getSettingsList();
    
    if (notificationPreferences) {
      const updatedSettings = initialSettings.map(setting => ({
        ...setting,
        enabled: notificationPreferences[setting.key] ?? setting.enabled,
      }));
      setSettings(updatedSettings);

      setPushEnabled(notificationPreferences.push_enabled ?? true);
      setQuietHoursEnabled(notificationPreferences.quiet_hours_enabled ?? true);
      setQuietStart(notificationPreferences.quiet_hours_start || '22:00');
      setQuietEnd(notificationPreferences.quiet_hours_end || '08:00');
    } else {
      setSettings(initialSettings);
    }
  }, [notificationPreferences]);

  const toggleSetting = (key: string) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key 
        ? { ...setting, enabled: !setting.enabled }
        : setting
    ));
  };

  const handleSave = async () => {
    if (!activeFamily) {
      Alert.alert('错误', '请先加入一个家庭');
      return;
    }

    setIsSaving(true);
    try {
      const newPreferences: any = {
        push_enabled: pushEnabled,
        quiet_hours_enabled: quietHoursEnabled,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
      };

      // 添加各类通知设置
      settings.forEach(setting => {
        newPreferences[setting.key] = setting.enabled;
      });

      await updatePreferences(newPreferences);
      
      Alert.alert(
        '设置已保存',
        '通知偏好设置已成功更新',
        [{ text: '确定', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('保存通知设置失败:', error);
      Alert.alert('错误', '保存设置失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingItem = (setting: NotificationSetting) => (
    <View key={setting.key} style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{setting.title}</Text>
        <Text style={styles.settingDescription}>{setting.description}</Text>
      </View>
      <Switch
        value={setting.enabled}
        onValueChange={() => toggleSetting(setting.key)}
        trackColor={{ false: '#E9ECEF', true: '#007AFF' }}
        thumbColor={setting.enabled ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  if (!activeFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notificationSettings.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#C7C7CD" />
          <Text style={styles.emptyText}>{t('notificationSettings.joinFamilyPrompt')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notificationSettings.title')}</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t('notificationSettings.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 推送通知总开关 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notificationSettings.pushNotifications')}</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t('notificationSettings.enablePushNotifications')}</Text>
              <Text style={styles.settingDescription}>
                {t('notificationSettings.pushNotificationsDescription')}
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#E9ECEF', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 通知类型设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notificationSettings.notificationTypes')}</Text>
          {settings.map(renderSettingItem)}
        </View>

        {/* 静默时间设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notificationSettings.quietHours')}</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t('notificationSettings.enableQuietHours')}</Text>
              <Text style={styles.settingDescription}>
                {t('notificationSettings.quietHoursDescription')}
              </Text>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={setQuietHoursEnabled}
              trackColor={{ false: '#E9ECEF', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {quietHoursEnabled && (
            <View style={styles.timeRangeContainer}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>{t('notificationSettings.quietHoursStart')}</Text>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={styles.timeText}>{quietStart}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>{t('notificationSettings.quietHoursEnd')}</Text>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={styles.timeText}>{quietEnd}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 说明文字 */}
        <View style={styles.section}>
          <Text style={styles.noteText}>
            {t('notificationSettings.note1')}{'\n'}
            {t('notificationSettings.note2')}{'\n'}
            {t('notificationSettings.note3')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timeRangeContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
}); 