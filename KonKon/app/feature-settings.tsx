import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { FeatureSettingsState, useFeatureSettings } from '../contexts/FeatureSettingsContext';

type FeatureKey = keyof FeatureSettingsState;

interface FeatureInfo {
  name: string;
  icon: string;
  description: string;
  defaultSettings: Record<string, any>;
}

const featureInfoMap: Record<FeatureKey, FeatureInfo> = {
  familySchedule: {
    name: '家庭日程',
    icon: '📅',
    description: '管理家庭成員的日程安排和活動',
    defaultSettings: {
      syncWithSystem: true,
      enableReminders: true,
      reminderMinutes: 15,
    }
  },
  familyAssistant: {
    name: '萌咪管家',
    icon: '🐱',
    description: '智能家庭助手，提供個性化服務',
    defaultSettings: {
      voiceEnabled: true,
      autoRespond: false,
      language: 'zh-CN',
    }
  },
  choreAssignment: {
    name: '家務分配',
    icon: '🏠',
    description: '分配和追蹤家庭成員的家務任務',
    defaultSettings: {
      enableRewards: true,
      autoRotate: false,
      weeklyReset: true,
    }
  },
  familyActivities: {
    name: '親子活動',
    icon: '🎮',
    description: '規劃和記錄親子互動時光',
    defaultSettings: {
      suggestActivities: true,
      trackTime: true,
      sharePhotos: true,
    }
  },
  familyAlbum: {
    name: '家庭相簿',
    icon: '📸',
    description: '收集和整理家庭珍貴回憶',
    defaultSettings: {
      autoBackup: true,
      enableSharing: true,
      qualityLevel: 'high',
    }
  },
  shoppingList: {
    name: '購物清單',
    icon: '🛒',
    description: '共享家庭購物需求和清單',
    defaultSettings: {
      syncAcrossDevices: true,
      enableCategories: true,
      budgetTracking: false,
    }
  },
  familyFinance: {
    name: '家庭財務',
    icon: '💰',
    description: '追蹤家庭收支和預算管理',
    defaultSettings: {
      enableBudgetAlerts: true,
      monthlyBudget: 10000,
      trackCategories: true,
    }
  },
  familyRecipes: {
    name: '餐食管理',
    icon: '🍽️',
    description: 'AI智能餐食規劃，解決家庭用餐難題',
    defaultSettings: {
      enableNutritionInfo: true,
      suggestMeals: true,
      shoppingIntegration: true,
    }
  },
};

export default function FeatureSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { featureSettings, updateFeatureSetting } = useFeatureSettings();
  const featureKey = params.feature as FeatureKey;
  
  const featureInfo = featureInfoMap[featureKey];

  const [localSettings, setLocalSettings] = useState(
    featureSettings[featureKey]?.settings || featureInfo?.defaultSettings || {}
  );

  const isEnabled = featureSettings[featureKey]?.enabled || false;

  if (!featureInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>功能不存在</Text>
          <Text style={styles.errorSubtext}>參數: {featureKey || '未提供'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backToProfileButton}>
            <Text style={styles.backToProfileButtonText}>返回個人中心</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleFeature = async (enabled: boolean) => {
    await updateFeatureSetting(featureKey, enabled, localSettings);
    if (enabled) {
      Alert.alert(
        '功能已啟用',
        `${featureInfo.name}現在會出現在首頁的篩選選項中`,
        [{ text: '確定', style: 'default' }]
      );
    }
  };

  const handleSettingChange = async (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    if (isEnabled) {
      await updateFeatureSetting(featureKey, true, newSettings);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderSettingItem = (key: string, label: string, type: 'switch' | 'text' | 'number') => {
    const value = localSettings[key];
    
    return (
      <View style={styles.settingItem} key={key}>
        <Text style={styles.settingLabel}>{label}</Text>
        {type === 'switch' && (
          <Switch
            value={value}
            onValueChange={(newValue) => handleSettingChange(key, newValue)}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        )}
        {type === 'text' && (
          <TextInput
            style={styles.textInput}
            value={value?.toString() || ''}
            onChangeText={(text) => handleSettingChange(key, text)}
            placeholder={`輸入${label}`}
          />
        )}
        {type === 'number' && (
          <TextInput
            style={styles.textInput}
            value={value?.toString() || ''}
            onChangeText={(text) => handleSettingChange(key, parseInt(text) || 0)}
            placeholder={`輸入${label}`}
            keyboardType="numeric"
          />
        )}
      </View>
    );
  };

  const getSettingItems = () => {
    switch (featureKey) {
      case 'familySchedule':
        return [
          renderSettingItem('syncWithSystem', t('featureSettings.settings.syncWithSystem'), 'switch'),
          renderSettingItem('enableReminders', t('featureSettings.settings.enableReminders'), 'switch'),
          renderSettingItem('reminderMinutes', t('featureSettings.settings.reminderMinutes'), 'number'),
        ];
      case 'familyAssistant':
        return [
          renderSettingItem('voiceEnabled', t('featureSettings.settings.voiceEnabled'), 'switch'),
          renderSettingItem('autoRespond', t('featureSettings.settings.autoRespond'), 'switch'),
          renderSettingItem('language', t('featureSettings.settings.language'), 'text'),
        ];
      case 'choreAssignment':
        return [
          renderSettingItem('enableRewards', t('featureSettings.settings.enableRewards'), 'switch'),
          renderSettingItem('autoRotate', t('featureSettings.settings.autoRotate'), 'switch'),
          renderSettingItem('weeklyReset', t('featureSettings.settings.weeklyReset'), 'switch'),
        ];
      case 'familyActivities':
        return [
          renderSettingItem('suggestActivities', t('featureSettings.settings.suggestActivities'), 'switch'),
          renderSettingItem('trackTime', t('featureSettings.settings.trackTime'), 'switch'),
          renderSettingItem('sharePhotos', t('featureSettings.settings.sharePhotos'), 'switch'),
        ];
      case 'familyAlbum':
        return [
          renderSettingItem('autoBackup', t('featureSettings.settings.autoBackup'), 'switch'),
          renderSettingItem('enableSharing', t('featureSettings.settings.enableSharing'), 'switch'),
          renderSettingItem('qualityLevel', t('featureSettings.settings.qualityLevel'), 'text'),
        ];
      case 'shoppingList':
        return [
          renderSettingItem('syncAcrossDevices', t('featureSettings.settings.syncAcrossDevices'), 'switch'),
          renderSettingItem('enableCategories', t('featureSettings.settings.enableCategories'), 'switch'),
          renderSettingItem('budgetTracking', t('featureSettings.settings.budgetTracking'), 'switch'),
        ];
      case 'familyFinance':
        return [
          renderSettingItem('enableBudgetAlerts', t('featureSettings.settings.enableBudgetAlerts'), 'switch'),
          renderSettingItem('monthlyBudget', t('featureSettings.settings.monthlyBudget'), 'number'),
          renderSettingItem('trackCategories', t('featureSettings.settings.trackCategories'), 'switch'),
        ];
      case 'familyRecipes':
        return [
          renderSettingItem('enableNutritionInfo', t('featureSettings.settings.enableNutritionInfo'), 'switch'),
          renderSettingItem('suggestMeals', t('featureSettings.settings.suggestMeals'), 'switch'),
          renderSettingItem('shoppingIntegration', t('featureSettings.settings.shoppingIntegration'), 'switch'),
        ];
      default:
        return [];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 標題欄 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('featureSettings.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 功能資訊卡片 */}
        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <Text style={styles.featureIcon}>{featureInfo.icon}</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>{featureInfo.name}</Text>
              <Text style={styles.featureDescription}>{featureInfo.description}</Text>
            </View>
          </View>
          
          {/* 主開關 */}
          <View style={styles.mainToggle}>
            <Text style={styles.toggleLabel}>{t('featureSettings.enableFeature')}</Text>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleFeature}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 功能設置 */}
        {isEnabled && (
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{t('featureSettings.settingsSection')}</Text>
            {getSettingItems()}
          </View>
        )}

        {/* 功能介紹 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>{t('featureSettings.infoSection')}</Text>
          <Text style={styles.infoText}>
            {t('featureSettings.infoText', { featureName: featureInfo.name })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    paddingTop: 20,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  mainToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
    textAlign: 'right',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 30,
  },
  backToProfileButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 