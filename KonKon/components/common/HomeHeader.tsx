import { useFeatureSettings } from '@/contexts/FeatureSettingsContext';
import { t } from '@/lib/i18n';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface FilterOption {
  label: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface HomeHeaderProps {
  selectedFilter: string;
  onFilterChange: (filterValue: string) => void;
  onResetSettings: () => Promise<void>;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  selectedFilter,
  onFilterChange,
  onResetSettings,
}) => {
  const router = useRouter();
  const { featureSettings } = useFeatureSettings();
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 動態生成過濾選項，基於啟用的功能
  const filterOptions: FilterOption[] = (() => {
    const options = [
      { label: t('home.all'), value: 'all', icon: '📊', color: '#8E8E93', bgColor: '#F2F2F7' },
    ];

    // 始終保持日曆功能
    options.push({ label: t('home.calendar'), value: 'calendar', icon: '🔔', color: '#FF9500', bgColor: '#FFF3E0' });

    // 根據啟用的功能添加選項
    if (featureSettings.familyAssistant.enabled) {
      options.push({ label: t('home.assistant'), value: 'familyAssistant', icon: '🐱', color: '#007AFF', bgColor: '#E3F2FD' });
    }
    
    if (featureSettings.choreAssignment.enabled) {
      options.push({ label: t('home.chores'), value: 'choreAssignment', icon: '🏠', color: '#4CAF50', bgColor: '#E8F5E9' });
    }
    
    if (featureSettings.familyActivities.enabled) {
      options.push({ label: t('home.health'), value: 'familyActivities', icon: '🏥', color: '#FF5722', bgColor: '#FFF3E0' });
    }
    
    if (featureSettings.familyAlbum.enabled) {
      options.push({ label: t('home.album'), value: 'familyAlbum', icon: '📸', color: '#5856D6', bgColor: '#E9E9FF' });
    }
    
    if (featureSettings.shoppingList.enabled) {
      options.push({ label: t('home.shopping'), value: 'shoppingList', icon: '🛒', color: '#FF5722', bgColor: '#FFF3E0' });
    }
    
    if (featureSettings.familyFinance.enabled) {
      options.push({ label: t('home.finance'), value: 'familyFinance', icon: '💰', color: '#4CAF50', bgColor: '#E8F5E9' });
    }
    
    if (featureSettings.familyRecipes.enabled) {
      options.push({ label: t('home.recipes'), value: 'familyRecipes', icon: '🍽️', color: '#FF6B35', bgColor: '#FFF3E0' });
    }

    return options;
  })();

  const handleFilterSelect = (filterValue: string) => {
    onFilterChange(filterValue);
    setShowFilterMenu(false);
  };

  const toggleFilterMenu = () => {
    setShowFilterMenu(!showFilterMenu);
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const navigateToExplore = () => {
    router.push('/explore');
  };

  const handleResetSettings = async () => {
    Alert.alert(
      '重置功能設置',
      '確定要重置所有功能設置到默認狀態嗎？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '確定', 
          style: 'destructive',
          onPress: async () => {
            await onResetSettings();
            Alert.alert('完成', '所有功能設置已重置');
          }
        }
      ]
    );
  };

  return (
    <>
      {/* 頂部標題欄 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, styles.activeTab]}>{t('tabs.record')}</Text>
          <TouchableOpacity onPress={navigateToExplore}>
            <Text style={styles.headerTitle}>{t('tabs.explore')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.filterButton} onPress={toggleFilterMenu}>
            {/* 顯示當前選中的過濾項的標籤 */}
            <Text style={styles.filterButtonText}>{filterOptions.find(opt => opt.value === selectedFilter)?.label}</Text>
            <Text style={styles.filterIcon}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.avatarButton} 
            onPress={navigateToProfile}
            onLongPress={handleResetSettings}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 過濾菜單 */}
      {showFilterMenu && (
        <View style={styles.filterMenu}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.filterMenuItem}
              onPress={() => handleFilterSelect(option.value)}
            >
              <Text style={styles.filterMenuText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTab: {
    color: '#007AFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#1D1D1F',
    fontWeight: '500',
  },
  filterIcon: {
    fontSize: 10,
    color: '#8E8E93',
  },
  avatarButton: {
    padding: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  filterMenu: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 8,
  },
  filterMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterMenuText: {
    fontSize: 16,
    color: '#1D1D1F',
  },
}); 