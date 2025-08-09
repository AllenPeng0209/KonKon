import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { clearAllFamilyChatCaches } from '../lib/familyChatCache';
import { t } from '../lib/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [cacheSize, setCacheSize] = useState(12.3);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    console.log('[Settings] 开始退出登录...');
    
    Alert.alert(
      t('settings.confirmLogoutTitle'),
      t('settings.confirmLogoutMessage'),
      [
        { text: t('settings.cancel'), style: "cancel" },
        { 
          text: t('settings.logout'),
          onPress: async () => {
            try {
              console.log('[Settings] 正在执行退出登录...');
              await signOut();
              console.log('[Settings] 退出登录成功');
              // AuthContext 会自动处理状态变化，_layout.tsx 会自动跳转
            } catch (error) {
              console.error('[Settings] 退出登录失败:', error);
              Alert.alert(t('common.error') || '错误', t('settings.logoutFailed'));
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      t('settings.confirmClearCacheTitle'),
      t('settings.confirmClearCacheMessage', { size: cacheSize.toFixed(1) }),
      [
        { text: t('settings.cancel'), style: "cancel" },
        { 
          text: t('settings.confirm'),
          onPress: async () => {
            try {
              // 清除聊天緩存
              await clearAllFamilyChatCaches();
              setCacheSize(0);
              Alert.alert(t('settings.cacheCleared'), t('settings.cacheClearedMessage'));
            } catch (error) {
              console.error('清除緩存失敗:', error);
              Alert.alert(t('settings.clearCacheFailed'), t('settings.clearCacheFailedMessage'));
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={handleBack} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color="#007AFF" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>{t('settings.title')}</Text>
         <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>{t('settings.account')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/account-security')}>
            <Ionicons name="person-circle-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>{t('settings.accountSecurity') || '帳號與安全'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>{t('settings.family')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/family-management')}>
            <Ionicons name="people-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>{t('settings.familyManagement')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>{t('settings.general')}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>{t('settings.notificationCenter')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/notification-settings')}>
            <Ionicons name="settings-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>{t('settings.notificationSettings')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/language-selection')}>
            <Ionicons name="language-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>{t('settings.languageSelection')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>{t('settings.storage')}</Text>
        <View style={styles.settingsGroup}>
           <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
            <MaterialCommunityIcons name="cached" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>{t('settings.clearCache')}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.settingValue}>{cacheSize.toFixed(1)} MB</Text>
                <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F2F2F7',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },
    headerRight: {
        width: 34, // to balance the back button
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        fontSize: 13,
        color: '#6d6d72',
        textTransform: 'uppercase',
        marginTop: 20,
        marginBottom: 8,
        marginLeft: 12,
    },
    settingsGroup: {
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#c6c6c8',
    },
    icon: {
        marginRight: 15,
    },
    settingText: {
        flex: 1,
        fontSize: 17,
        color: '#000',
    },
    settingValue: {
        fontSize: 17,
        color: '#8e8e93',
        marginRight: 5
    },
    logoutContainer: {
        marginTop: 30,
        marginBottom: 30,
    },
    logoutButton: {
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#ff3b30',
        fontSize: 17,
    },
}); 