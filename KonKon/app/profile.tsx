import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 頂部漸層背景 */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.headerGradient}
        locations={[0, 1]}
      >
        {/* 頂部標題欄 */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('profile.title')}</Text>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>

        {/* 用戶資訊區域 */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarOuter}>
              <Image
                source={{ uri: getAvatarUrl() }}
                style={styles.avatarImage}
                onError={(error) => {
                  console.warn('頭像載入失敗:', error);
                }}
              />
              <View style={styles.onlineIndicator} />
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{getDisplayName()}</Text>
              <View style={styles.vipBadge}>
                <Ionicons name="diamond" size={10} color="#fff" />
                <Text style={styles.vipText}>VIP</Text>
              </View>
            </View>
            <Text style={styles.userId}>ID: {user?.id.slice(0, 8).toUpperCase()}</Text>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 家庭空間卡片 */}
        <View style={styles.spaceCard}>
          <View style={styles.spaceIcon}>
            <Text style={styles.spaceEmoji}>
              {activeFamily?.id === 'meta-space' ? '🌸' : activeFamily?.tag === 'personal' ? '🏮' : '🏯'}
            </Text>
          </View>
          <View style={styles.spaceInfo}>
            <Text style={styles.spaceTitle}>
              {activeFamily 
                ? (activeFamily.tag === 'personal' ? t('space.personalSpace') : activeFamily.name)
                : t('drawer.metaSpace')}
            </Text>
            <Text style={styles.spaceSubtitle}>
              {activeFamily?.id === 'meta-space' 
                ? t('profile.metaSpaceView')
                : activeFamily?.tag === 'personal' 
                  ? t('profile.personalSpace')
                  : t('profile.familySpace')
              }
            </Text>
          </View>
          <TouchableOpacity style={styles.spaceButton} onPress={handleVIPBenefits}>
            <Text style={styles.spaceButtonText}>
              {loading ? t('profile.loading') : t('profile.manageFamily')}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {/* 功能網格 */}
        <View style={styles.functionsContainer}>
          <View style={styles.functionsGrid}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familySchedule')}>
              <View style={[styles.functionIcon, { backgroundColor: '#FFE5E5' }]}>
                <Text style={styles.functionEmoji}>📅</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familySchedule')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyAssistant')}>
              <View style={[styles.functionIcon, { backgroundColor: '#E5F9E5' }]}>
                <Text style={styles.functionEmoji}>✅</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyAssistant')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('choreAssignment')}>
              <View style={[styles.functionIcon, { backgroundColor: '#E5F3FF' }]}>
                <Text style={styles.functionEmoji}>🏠</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.choreAssignment')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyActivities')}>
              <View style={[styles.functionIcon, { backgroundColor: '#FFF5E5' }]}>
                <Text style={styles.functionEmoji}>💪</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyActivities')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.functionsGrid}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyAlbum')}>
              <View style={[styles.functionIcon, { backgroundColor: '#F0E5FF' }]}>
                <Text style={styles.functionEmoji}>📸</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyAlbum')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('shoppingList')}>
              <View style={[styles.functionIcon, { backgroundColor: '#E5FFF5' }]}>
                <Text style={styles.functionEmoji}>🛒</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.shoppingList')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyFinance')}>
              <View style={[styles.functionIcon, { backgroundColor: '#FFF9E5' }]}>
                <Text style={styles.functionEmoji}>💰</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyFinance')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyRecipes')}>
              <View style={[styles.functionIcon, { backgroundColor: '#E5F8FF' }]}>
                <Text style={styles.functionEmoji}>👨‍🍳</Text>
              </View>
              <Text style={styles.functionText}>{t('profile.familyRecipes')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 設置區域 */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('settings')}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="settings-outline" size={18} color="#8E8E93" />
              </View>
              <Text style={styles.settingText}>{t('profile.settings')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('userAgreement')}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="document-text-outline" size={18} color="#8E8E93" />
              </View>
              <Text style={styles.settingText}>{t('profile.userAgreement')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('privacyPolicy')}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#8E8E93" />
              </View>
              <Text style={styles.settingText}>{t('profile.privacyPolicy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  vipBadge: {
    backgroundColor: 'rgba(255,215,0,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 2,
  },
  userId: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20,
  },
  spaceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  spaceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  spaceEmoji: {
    fontSize: 24,
  },
  spaceInfo: {
    flex: 1,
  },
  spaceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  spaceSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
  },
  spaceButton: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginRight: 4,
  },
  functionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  functionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  functionItem: {
    alignItems: 'center',
    width: (screenWidth - 88) / 4,
  },
  functionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  functionEmoji: {
    fontSize: 24,
  },
  functionText: {
    fontSize: 11,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E5E5EA',
    marginLeft: 66,
  },
});