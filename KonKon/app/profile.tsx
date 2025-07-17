import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Alert,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeFamily, loading } = useFamily();

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
    switch (func) {
      case 'familySchedule':
        router.push('/calendar-settings');
        break;
      default:
        console.log('Function:', func);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 用户信息部分 */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Image
                  source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/80x80/87CEEB/FFFFFF?text=👤' }}
                  style={styles.avatarImage}
                />
              </View>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user?.user_metadata?.display_name || 'Allen'}</Text>
                <View style={styles.vipBadge}>
                  <Text style={styles.vipText}>🏆VIP</Text>
                </View>
              </View>
              <Text style={styles.userId}>ID: {user?.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.recordDays}>{t('profile.recordedDays', { days: 0 })}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>

          {/* 家庭管理通知卡片 */}
          <View style={styles.vipCard}>
            <View style={styles.vipCardContent}>
              <Text style={styles.vipIcon}>🏡</Text>
              <Text style={styles.vipMessage}>
                {activeFamily ? t('profile.family', { familyName: activeFamily.name }) : t('profile.createOrJoin')}
              </Text>
            </View>
            <TouchableOpacity style={styles.vipButton} onPress={handleVIPBenefits}>
              <Text style={styles.vipButtonText}>
                {loading ? t('profile.loading') : activeFamily ? t('profile.manageFamily') : t('profile.createFamily')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 功能网格 */}
        <View style={styles.functionsGrid}>
          <View style={styles.functionsRow}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familySchedule')}>
              <Text style={styles.functionIcon}>📅</Text>
              <Text style={styles.functionText}>{t('profile.familySchedule')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('memberManagement')}>
              <Text style={styles.functionIcon}>👥</Text>
              <Text style={styles.functionText}>{t('profile.memberManagement')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('houseworkAssignment')}>
              <Text style={styles.functionIcon}>🏠</Text>
              <Text style={styles.functionText}>{t('profile.choreAssignment')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('birthdayReminder')}>
              <Text style={styles.functionIcon}>🎂</Text>
              <Text style={styles.functionText}>{t('profile.birthdayReminder')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.functionsRow}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyAlbum')}>
              <Text style={styles.functionIcon}>📸</Text>
              <Text style={styles.functionText}>{t('profile.familyAlbum')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('shoppingList')}>
              <Text style={styles.functionIcon}>🛒</Text>
              <Text style={styles.functionText}>{t('profile.shoppingList')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyBudget')}>
              <Text style={styles.functionIcon}>💰</Text>
              <Text style={styles.functionText}>{t('profile.familyBudget')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('emergencyContact')}>
              <Text style={styles.functionIcon}>🚨</Text>
              <Text style={styles.functionText}>{t('profile.emergencyContact')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 设置选项 */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('settings')}>
            <Text style={styles.settingText}>{t('profile.settings')}</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('userAgreement')}>
            <Text style={styles.settingText}>{t('profile.userAgreement')}</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('privacyPolicy')}>
            <Text style={styles.settingText}>{t('profile.privacyPolicy')}</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('about')}>
            <Text style={styles.settingText}>{t('profile.about')}</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#007AFF',
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
  userSection: {
    marginBottom: 30,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 10,
  },
  vipBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  vipText: {
    fontSize: 12,
    color: '#FFF',
  },
  userId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  recordDays: {
    fontSize: 14,
    color: '#6b7280',
  },
  daysNumber: {
    color: '#007AFF',
    fontWeight: '600',
  },
  editButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 18,
  },
  vipCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  vipCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  vipMessage: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  vipButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vipButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  functionsGrid: {
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(135, 206, 235, 0.2)',
  },
  functionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  functionItem: {
    alignItems: 'center',
    width: (screenWidth - 80) / 4,
  },
  functionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  functionText: {
    fontSize: 13,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: 16,
    color: '#6b7280',
  },
}); 