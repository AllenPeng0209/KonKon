import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AssistantSettings {
  trackingFeatures: {
    calendar: boolean;
    album: boolean;
    tasks: boolean;
    chores: boolean;
    shopping: boolean;
    finance: boolean;
    health: boolean;
  };
  proactiveReminders: boolean;
}

const defaultSettings: AssistantSettings = {
  trackingFeatures: {
    calendar: true,
    album: false,
    tasks: true,
    chores: false,
    shopping: false,
    finance: false,
    health: false,
  },
  proactiveReminders: true,
};

export default function AssistantSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AssistantSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('assistant_settings');
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Failed to load assistant settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AssistantSettings) => {
    try {
      await AsyncStorage.setItem('assistant_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save assistant settings:', error);
      Alert.alert(t('assistantSettings.saveFailed' as any), t('assistantSettings.saveFailedMessage' as any));
    }
  };

  const updateTrackingFeature = (feature: keyof AssistantSettings['trackingFeatures'], enabled: boolean) => {
    const newSettings = {
      ...settings,
      trackingFeatures: {
        ...settings.trackingFeatures,
        [feature]: enabled,
      },
    };
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    Alert.alert(
      t('assistantSettings.resetConfirmTitle' as any),
      t('assistantSettings.resetConfirmMessage' as any),
      [
        { text: t('assistantSettings.cancel' as any), style: 'cancel' },
        {
          text: t('assistantSettings.resetButton' as any),
          style: 'destructive',
          onPress: () => saveSettings(defaultSettings),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('assistantSettings.loading' as any)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 定義功能追蹤選項的翻譯鍵映射
  const trackingOptions = [
    { key: 'calendar', icon: '📅' },
    { key: 'tasks', icon: '✅' },
    { key: 'album', icon: '📷' },
    { key: 'chores', icon: '🧹' },
    { key: 'shopping', icon: '🛒' },
    { key: 'finance', icon: '💰' },
    { key: 'health', icon: '🏥' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 標題欄 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('assistantSettings.title' as any)}</Text>
        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Text style={styles.resetButtonText}>{t('assistantSettings.reset' as any)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 追蹤功能 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('assistantSettings.trackingFeatures.title' as any)}</Text>
          <Text style={styles.sectionDescription}>{t('assistantSettings.trackingFeatures.description' as any)}</Text>
          
          {trackingOptions.map((feature) => (
            <View key={feature.key} style={styles.trackingOption}>
              <View style={styles.trackingContent}>
                <Text style={styles.trackingIcon}>{feature.icon}</Text>
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingName}>
                    {t(`assistantSettings.trackingFeatures.${feature.key}.name` as any)}
                  </Text>
                  <Text style={styles.trackingDescription}>
                    {t(`assistantSettings.trackingFeatures.${feature.key}.description` as any)}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.trackingFeatures[feature.key as keyof AssistantSettings['trackingFeatures']]}
                onValueChange={(enabled) => 
                  updateTrackingFeature(feature.key as keyof AssistantSettings['trackingFeatures'], enabled)
                }
                trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* 主動提醒 */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>{t('assistantSettings.proactiveReminders.name' as any)}</Text>
              <Text style={styles.settingDescription}>{t('assistantSettings.proactiveReminders.description' as any)}</Text>
            </View>
            <Switch
              value={settings.proactiveReminders}
              onValueChange={(enabled) => {
                const newSettings = { ...settings, proactiveReminders: enabled };
                saveSettings(newSettings);
              }}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 底部間距 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  resetButton: {
    padding: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  trackingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  trackingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  trackingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bottomSpacing: {
    height: 40,
  },
}); 