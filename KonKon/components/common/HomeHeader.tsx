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
  activeFamily?: { id: string; name: string; member_count?: number } | null;
  userFamilies?: Array<{ id: string; name: string; member_count?: number }>;
  onFamilyChange?: (familyId: string | null) => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  selectedFilter,
  onFilterChange,
  onResetSettings,
  activeFamily,
  userFamilies = [],
  onFamilyChange,
}) => {
  const router = useRouter();
  const { featureSettings } = useFeatureSettings();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);

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

  // 處理家庭選擇
  const handleFamilySelect = (family: any) => {
    setShowFamilyMenu(false);
    if (onFamilyChange) {
      onFamilyChange(family?.id || null);
    }
  };

  return (
    <>
      {/* 頂部標題欄 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.recordFilterButton} onPress={toggleFilterMenu}>
            <Text style={styles.recordFilterText}>{filterOptions.find(opt => opt.value === selectedFilter)?.label}</Text>
            <Text style={styles.recordFilterIcon}>▼</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <TouchableOpacity 
            style={styles.familyButton}
            onPress={() => setShowFamilyMenu(!showFamilyMenu)}
            activeOpacity={0.8}
          >
            <Text style={styles.familyName} numberOfLines={1}>
              {activeFamily ? activeFamily.name : '個人'}
            </Text>
            <Text style={styles.familyDropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.exploreButton} 
            onPress={navigateToExplore}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreIcon}>💡</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 過濾菜單 */}
      {showFilterMenu && (
        <View style={styles.filterMenuOverlay}>
          <TouchableOpacity style={styles.filterMenuBackground} onPress={() => setShowFilterMenu(false)} />
          <View style={styles.filterMenu}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterMenuItem,
                  selectedFilter === option.value && styles.filterMenuItemActive
                ]}
                onPress={() => handleFilterSelect(option.value)}
              >
                <View style={[styles.filterMenuIcon, { backgroundColor: option.bgColor }]}>
                  <Text style={styles.filterMenuIconText}>{option.icon}</Text>
                </View>
                <Text style={[
                  styles.filterMenuText,
                  selectedFilter === option.value && styles.filterMenuTextActive
                ]}>
                  {option.label}
                </Text>
                {selectedFilter === option.value && (
                  <Text style={styles.filterMenuCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showFamilyMenu && (
        <View style={styles.familyMenuOverlay}>
          <TouchableOpacity style={styles.familyMenuBackground} onPress={() => setShowFamilyMenu(false)} />
          <View style={styles.familyMenu}>
            {/* 個人選項 */}
            <TouchableOpacity
              style={[
                styles.familyMenuItem,
                !activeFamily && styles.familyMenuItemActive
              ]}
              onPress={() => handleFamilySelect(null)}
            >
              <View style={[styles.familyMenuIcon, { backgroundColor: '#F0F8FF' }]}>
                <Text style={styles.familyMenuIconText}>👤</Text>
              </View>
              <Text style={[
                styles.familyMenuText,
                !activeFamily && styles.familyMenuTextActive
              ]}>
                個人
              </Text>
              {!activeFamily && (
                <Text style={styles.familyMenuCheck}>✓</Text>
              )}
            </TouchableOpacity>
            
            {/* 家庭列表 */}
            {userFamilies.map((family) => (
              <TouchableOpacity
                key={family.id}
                style={[
                  styles.familyMenuItem,
                  activeFamily?.id === family.id && styles.familyMenuItemActive
                ]}
                onPress={() => handleFamilySelect(family)}
              >
                <View style={[styles.familyMenuIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={styles.familyMenuIconText}>🏠</Text>
                </View>
                <Text style={[
                  styles.familyMenuText,
                  activeFamily?.id === family.id && styles.familyMenuTextActive
                ]}>
                  {family.name}
                </Text>
                {activeFamily?.id === family.id && (
                  <Text style={styles.familyMenuCheck}>✓</Text>
                )}
              </TouchableOpacity>
                          ))}
            </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    position: 'relative',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    zIndex: 1,
  },
  recordFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  recordFilterText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
    marginRight: 8,
  },
  recordFilterIcon: {
    fontSize: 12,
    color: '#8E8E93',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
    zIndex: 1,
      },
    familyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    minWidth: 80,
    maxWidth: 150,
  },
  familyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    textAlign: 'center',
    marginRight: 8,
  },
  familyDropdownIcon: {
    fontSize: 10,
    color: '#8E8E93',
  },
  noFamilyText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  exploreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exploreIcon: {
    fontSize: 18,
  },
  filterMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  filterMenuBackground: {
    flex: 1,
  },
  filterMenu: {
    position: 'absolute',
    top: 55,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2,
  },
  filterMenuItemActive: {
    backgroundColor: '#F0F8FF',
  },
  filterMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterMenuIconText: {
    fontSize: 16,
  },
  filterMenuText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 1,
  },
  filterMenuTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  filterMenuCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  familyMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
  },
  familyMenuBackground: {
    flex: 1,
  },
  familyMenu: {
    position: 'absolute',
    top: 55,
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    maxWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  familyMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2,
  },
  familyMenuItemActive: {
    backgroundColor: '#F0F8FF',
  },
  familyMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  familyMenuIconText: {
    fontSize: 16,
  },
  familyMenuText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 1,
  },
  familyMenuTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  familyMenuCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
          marginLeft: 8,
    },
  });  