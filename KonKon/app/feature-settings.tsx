import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useFeatureSettings, FeatureSettingsState } from '../contexts/FeatureSettingsContext';
import { useState } from 'react';

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
    name: '家庭食譜',
    icon: '👨‍🍳',
    description: '記錄和分享家庭美食食譜',
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
          renderSettingItem('syncWithSystem', '與系統日曆同步', 'switch'),
          renderSettingItem('enableReminders', '啟用提醒', 'switch'),
          renderSettingItem('reminderMinutes', '提前提醒時間（分鐘）', 'number'),
        ];
      case 'familyAssistant':
        return [
          renderSettingItem('voiceEnabled', '語音功能', 'switch'),
          renderSettingItem('autoRespond', '自動回應', 'switch'),
          renderSettingItem('language', '語言設置', 'text'),
        ];
      case 'choreAssignment':
        return [
          renderSettingItem('enableRewards', '啟用獎勵系統', 'switch'),
          renderSettingItem('autoRotate', '自動輪換任務', 'switch'),
          renderSettingItem('weeklyReset', '每週重置', 'switch'),
        ];
      case 'familyActivities':
        return [
          renderSettingItem('suggestActivities', '建議活動', 'switch'),
          renderSettingItem('trackTime', '追蹤活動時間', 'switch'),
          renderSettingItem('sharePhotos', '分享照片', 'switch'),
        ];
      case 'familyAlbum':
        return [
          renderSettingItem('autoBackup', '自動備份', 'switch'),
          renderSettingItem('enableSharing', '啟用分享', 'switch'),
          renderSettingItem('qualityLevel', '圖片品質', 'text'),
        ];
      case 'shoppingList':
        return [
          renderSettingItem('syncAcrossDevices', '跨設備同步', 'switch'),
          renderSettingItem('enableCategories', '啟用分類', 'switch'),
          renderSettingItem('budgetTracking', '預算追蹤', 'switch'),
        ];
      case 'familyFinance':
        return [
          renderSettingItem('enableBudgetAlerts', '預算提醒', 'switch'),
          renderSettingItem('monthlyBudget', '月度預算', 'number'),
          renderSettingItem('trackCategories', '分類追蹤', 'switch'),
        ];
      case 'familyRecipes':
        return [
          renderSettingItem('enableNutritionInfo', '營養資訊', 'switch'),
          renderSettingItem('suggestMeals', '餐點建議', 'switch'),
          renderSettingItem('shoppingIntegration', '購物清單整合', 'switch'),
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
        <Text style={styles.headerTitle}>功能設置</Text>
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
            <Text style={styles.toggleLabel}>啟用此功能</Text>
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
            <Text style={styles.sectionTitle}>功能設置</Text>
            {getSettingItems()}
          </View>
        )}

        {/* 功能介紹 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>功能說明</Text>
          <Text style={styles.infoText}>
            啟用此功能後，您將在首頁的篩選選項中看到 "{featureInfo.name}" 選項，
            可以快速查看相關的內容和活動。
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