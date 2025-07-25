import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import AvatarService from '../lib/avatarService';
import { supabase } from '../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeFamily, loading } = useFamily();
  const [userProfile, setUserProfile] = useState<{
    display_name: string;
    avatar_url: string | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (userData) {
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('載入用戶資料失敗:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const getDisplayName = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name;
    }
    return user?.user_metadata?.display_name || user?.user_metadata?.name || user?.email || 'Allen';
  };

  const getAvatarUrl = () => {
    if (userProfile?.avatar_url) {
      return userProfile.avatar_url;
    }
    
    // 使用 AvatarService 生成默認頭像
    return AvatarService.getPlaceholderUrl(getDisplayName());
  };

  const handleBack = () => {
    router.push('/(tabs)');
  };

  const handleVIPBenefits = () => {
    // 根据用户是否有家庭来决定跳转页面
    if (activeFamily) {
      router.push('/family-management');
    } else {
      // 如果没有家族，显示选择对话框
      Alert.alert(
        t('profile.createOrJoinFamilyTitle'),
        t('profile.createOrJoinFamilyMessage'),
        [
          { text: t('profile.cancel'), style: 'cancel' },
          {
            text: t('profile.createFamily'),
            onPress: () => router.push('/create-family'),
          },
          {
            text: t('profile.joinFamily'),
            onPress: () => router.push('/join-family'),
          },
        ]
      );
    }
  };

  const handleSetting = (setting: string) => {
    // Handle different settings
    switch (setting) {
      case 'settings':
        router.push('/settings');
        break;
      case 'userAgreement':
        router.push('/user-agreement');
        break;
      case 'privacyPolicy':
        router.push('/privacy-policy');
        break;
      case 'about':
        router.push('/about');
        break;
      default:
        console.log('Setting:', setting);
    }
  };

  const handleFunction = (func: string) => {
    router.push(`/feature-settings?feature=${func}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* 顶部标题栏 - 美化版 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 用户信息部分 - 美化版 */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Image
                  source={{ uri: getAvatarUrl() }}
                  style={styles.avatarImage}
                  onError={(error) => {
                    console.warn('頭像載入失敗:', error);
                  }}
                />
                {/* 添加在線狀態指示器 */}
                <View style={styles.onlineIndicator} />
              </View>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{getDisplayName()}</Text>
                <View style={styles.vipBadge}>
                  <Ionicons name="diamond" size={12} color="#FFF" style={styles.vipBadgeIcon} />
                  <Text style={styles.vipText}>VIP</Text>
                </View>
              </View>
              <Text style={styles.userId}>ID: {user?.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* 家庭管理通知卡片 - 美化版 */}
          <View style={styles.vipCard}>
            <View style={styles.vipCardContent}>
              <Text style={styles.vipIcon}>
                {activeFamily?.id === 'meta-space' ? '🌌' : activeFamily?.tag === 'personal' ? '👤' : '🏡'}
              </Text>
              <View style={styles.vipTextContainer}>
                <Text style={styles.vipMessage}>
                  {activeFamily 
                    ? (activeFamily.tag === 'personal' ? t('space.personalSpace') : activeFamily.name)
                    : t('drawer.metaSpace')}
                </Text>
                <Text style={styles.vipSubMessage}>
                  {activeFamily?.id === 'meta-space' 
                    ? t('profile.metaSpaceView')
                    : activeFamily?.tag === 'personal' 
                      ? t('profile.personalSpace')
                      : t('profile.familySpace')
                  }
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.vipButton} onPress={handleVIPBenefits}>
              <Text style={styles.vipButtonText}>
                {loading ? t('profile.loading') : t('profile.manageFamily')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#FFF" style={styles.vipButtonIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 功能网格 - 美化版 */}
        <View style={styles.functionsGrid}>
          <View style={styles.functionsRow}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familySchedule')}>
              <View style={[styles.functionIconContainer, { backgroundColor: '#FF6B6B15' }]}>
                <Text style={styles.functionIcon}>📅</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familySchedule')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyAssistant')}>
              <View style={[styles.functionIconContainer, { backgroundColor: '#4ECDC415' }]}>
                <Text style={styles.functionIcon}>✅</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyAssistant')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('choreAssignment')}>
              <View style={[styles.functionIconContainer, { backgroundColor: '#45B7D115' }]}>
                <Text style={styles.functionIcon}>🏠</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.choreAssignment')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyActivities')}>
              <View style={[styles.functionIconContainer, { backgroundColor: '#F7DC6F15' }]}>
                <Text style={styles.functionIcon}>💪</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyActivities')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.functionsRow}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyAlbum')}>
              <View style={[styles.functionIconContainer, { backgroundColor: '#BB6BD915' }]}>
                <Text style={styles.functionIcon}>📸</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyAlbum')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('shoppingList')}>
              <View style={[styles.functionIconContainer, { backgroundColor: '#58D68D15' }]}>
                <Text style={styles.functionIcon}>🛒</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.shoppingList')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyFinance')}>
              <View style={[styles.functionIconContainer, { backgroundColor: '#F8C47115' }]}>
                <Text style={styles.functionIcon}>💰</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyFinance')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyRecipes')}>
              <View style={[styles.functionIconContainer, { backgroundColor: '#85C1E915' }]}>
                <Text style={styles.functionIcon}>👨‍🍳</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyRecipes')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 设置选项 - 美化版 */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('settings')}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="settings-outline" size={20} color="#666" />
              </View>
              <Text style={styles.settingText}>{t('profile.settings')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('userAgreement')}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="document-text-outline" size={20} color="#666" />
              </View>
              <Text style={styles.settingText}>{t('profile.userAgreement')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('privacyPolicy')}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
              </View>
              <Text style={styles.settingText}>{t('profile.privacyPolicy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('about')}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
              </View>
              <Text style={styles.settingText}>{t('profile.about')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
          </TouchableOpacity>
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
    // 添加輕微陰影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    // 添加陰影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 12,
  },
  vipBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    // 添加陰影
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  vipBadgeIcon: {
    marginRight: 4,
  },
  vipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  userId: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  vipCard: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // 增強陰影效果
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  vipCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vipIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  vipTextContainer: {
    flex: 1,
  },
  vipMessage: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  vipSubMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },
  vipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    marginRight: 4,
  },
  vipButtonIcon: {
    marginLeft: 2,
  },
  functionsGrid: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    // 增強陰影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  functionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  functionItem: {
    alignItems: 'center',
    width: (screenWidth - 88) / 4,
  },
  functionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  functionIcon: {
    fontSize: 28,
  },
  functionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  settingsSection: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    // 增強陰影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
}); 