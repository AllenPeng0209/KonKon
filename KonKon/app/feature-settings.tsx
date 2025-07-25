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

const getFeatureInfoMap = (): Record<FeatureKey, FeatureInfo> => ({
  familySchedule: {
    name: t('featureSettings.features.familySchedule.name'),
    icon: '📅',
    description: t('featureSettings.features.familySchedule.description'),
    defaultSettings: {
      syncWithSystem: true,
      enableReminders: true,
      reminderMinutes: 15,
      selectedStyle: t('featureSettings.labels.gridMonthView'),
    }
  },
  familyAssistant: {
    name: t('featureSettings.features.familyAssistant.name'),
    icon: '✓',
    description: t('featureSettings.features.familyAssistant.description'),
    defaultSettings: {
      voiceEnabled: true,
      autoRespond: false,
      language: 'zh-CN',
    }
  },
  choreAssignment: {
    name: t('featureSettings.features.choreAssignment.name'),
    icon: '🏠',
    description: t('featureSettings.features.choreAssignment.description'),
    defaultSettings: {
      enableRewards: true,
      autoRotate: false,
      weeklyReset: true,
      selectedStyle: t('featureSettings.labels.taskBoard'),
    }
  },
  familyActivities: {
    name: t('featureSettings.features.familyActivities.name'),
    icon: '🏥',
    description: t('featureSettings.features.familyActivities.description'),
    defaultSettings: {
      trackHealth: true,
      medicineReminders: true,
      healthReports: true,
    }
  },
  familyAlbum: {
    name: t('featureSettings.features.familyAlbum.name'),
    icon: '📸',
    description: t('featureSettings.features.familyAlbum.description'),
    defaultSettings: {
      autoBackup: true,
      enableSharing: true,
      qualityLevel: 'high',
    }
  },
  shoppingList: {
    name: t('featureSettings.features.shoppingList.name'),
    icon: '🛒',
    description: t('featureSettings.features.shoppingList.description'),
    defaultSettings: {
      syncAcrossDevices: true,
      enableCategories: true,
      budgetTracking: false,
    }
  },
  familyFinance: {
    name: t('featureSettings.features.familyFinance.name'),
    icon: '💰',
    description: t('featureSettings.features.familyFinance.description'),
    defaultSettings: {
      enableBudgetAlerts: true,
      monthlyBudget: 10000,
      trackCategories: true,
    }
  },
  familyRecipes: {
    name: t('featureSettings.features.familyRecipes.name'),
    icon: '🍽️',
    description: t('featureSettings.features.familyRecipes.description'),
    defaultSettings: {
      enableNutritionInfo: true,
      suggestMeals: true,
      shoppingIntegration: true,
      selectedStyle: t('featureSettings.labels.dailyRecords'),
    }
  },
});

export default function FeatureSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { featureSettings, updateFeatureSetting } = useFeatureSettings();
  const featureKey = params.feature as FeatureKey;
  
  const featureInfoMap = getFeatureInfoMap();
  const featureInfo = featureInfoMap[featureKey];

  const [localSettings, setLocalSettings] = useState(
    featureSettings[featureKey]?.settings || featureInfo?.defaultSettings || {}
  );

  const isEnabled = featureSettings[featureKey]?.enabled || false;

  if (!featureInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{t('featureSettings.errors.featureNotFound')}</Text>
        <Text style={styles.errorSubtext}>{t('featureSettings.errors.parameterNotProvided', { param: featureKey || '未提供' })}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backToProfileButton}>
          <Text style={styles.backToProfileButtonText}>{t('featureSettings.errors.backToProfile')}</Text>
        </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleFeature = async (enabled: boolean) => {
    await updateFeatureSetting(featureKey, enabled, localSettings);
    if (enabled) {
      Alert.alert(
        t('featureSettings.alerts.featureEnabled'),
        t('featureSettings.alerts.featureEnabledMessage', { featureName: featureInfo.name }),
        [{ text: t('featureSettings.alerts.ok'), style: 'default' }]
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

  // 樣式值翻譯映射
  const getStyleDisplayValue = (key: string, value: any) => {
    if (key !== 'selectedStyle' || !value) return value;
    
    const styleMap: Record<string, string> = {
      // 繁體中文
      '網格月視圖': t('featureSettings.labels.gridMonthView'),
      '每日記錄': t('featureSettings.labels.dailyRecords'),
      '週間概覽': t('featureSettings.labels.weeklyOverview'),
      '營養圖表': t('featureSettings.labels.nutritionChart'),
      '任務看板': t('featureSettings.labels.taskBoard'),
      // 簡體中文
      '网格月视图': t('featureSettings.labels.gridMonthView'),
      '每日记录': t('featureSettings.labels.dailyRecords'),
      '周间概览': t('featureSettings.labels.weeklyOverview'),
      '营养图表': t('featureSettings.labels.nutritionChart'),
      '任务看板': t('featureSettings.labels.taskBoard'),
      // 英文
      'Grid Month View': t('featureSettings.labels.gridMonthView'),
      'Daily Records': t('featureSettings.labels.dailyRecords'),
      'Weekly Overview': t('featureSettings.labels.weeklyOverview'),
      'Nutrition Chart': t('featureSettings.labels.nutritionChart'),
      'Task Board': t('featureSettings.labels.taskBoard'),
      // 日文
      'グリッド月表示': t('featureSettings.labels.gridMonthView'),
      '毎日の記録': t('featureSettings.labels.dailyRecords'),
      '週間概要': t('featureSettings.labels.weeklyOverview'),
      '栄養チャート': t('featureSettings.labels.nutritionChart'),
      'タスクボード': t('featureSettings.labels.taskBoard'),
    };
    
    return styleMap[value] || value;
  };

  const renderSettingItem = (key: string, label: string, type: 'switch' | 'text' | 'number' | 'navigation', onPress?: () => void) => {
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
            placeholder={t('featureSettings.labels.inputPlaceholder', { label })}
          />
        )}
        {type === 'number' && (
          <TextInput
            style={styles.textInput}
            value={value?.toString() || ''}
            onChangeText={(text) => handleSettingChange(key, parseInt(text) || 0)}
            placeholder={t('featureSettings.labels.inputPlaceholder', { label })}
            keyboardType="numeric"
          />
        )}
        {type === 'navigation' && (
          <TouchableOpacity onPress={onPress} style={styles.navigationButton}>
            <Text style={styles.navigationButtonText}>
              {getStyleDisplayValue(key, value) || t('featureSettings.labels.chooseStyle')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleStyleSelection = () => {
    Alert.alert(
      t('featureSettings.alerts.selectMealViewStyle'),
      t('featureSettings.alerts.selectMealViewMessage'),
      [
        {
          text: t('featureSettings.labels.dailyRecords'),
          onPress: () => handleSettingChange('selectedStyle', t('featureSettings.labels.dailyRecords'))
        },
        {
          text: t('featureSettings.labels.weeklyOverview'), 
          onPress: () => handleSettingChange('selectedStyle', t('featureSettings.labels.weeklyOverview'))
        },
        {
          text: t('featureSettings.labels.nutritionChart'),
          onPress: () => handleSettingChange('selectedStyle', t('featureSettings.labels.nutritionChart'))
        },
        {
          text: t('featureSettings.alerts.cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  const handleCalendarStyleSelection = () => {
    router.push('/calendar-style-selection');
  };

  const handleChoreStyleSelection = () => {
    router.push('/chore-style-selection');
  };

  const getSettingItems = () => {
    switch (featureKey) {
      case 'familySchedule':
        return [
          renderSettingItem('syncWithSystem', t('featureSettings.settings.syncWithSystem'), 'switch'),
          renderSettingItem('enableReminders', t('featureSettings.settings.enableReminders'), 'switch'),
          renderSettingItem('reminderMinutes', t('featureSettings.settings.reminderMinutes'), 'number'),
          renderSettingItem('selectedStyle', t('featureSettings.labels.chooseStyle'), 'navigation', handleCalendarStyleSelection),
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
          renderSettingItem('selectedStyle', t('featureSettings.labels.chooseStyle'), 'navigation', handleChoreStyleSelection),
        ];
      case 'familyActivities':
        return [
          renderSettingItem('trackHealth', t('featureSettings.settings.trackHealth'), 'switch'),
          renderSettingItem('medicineReminders', t('featureSettings.settings.medicineReminders'), 'switch'),
          renderSettingItem('healthReports', t('featureSettings.settings.healthReports'), 'switch'),
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
          renderSettingItem('selectedStyle', t('featureSettings.labels.chooseStyle'), 'navigation', handleStyleSelection),
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
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  navigationButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
}); 