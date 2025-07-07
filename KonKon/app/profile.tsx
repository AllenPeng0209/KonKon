import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    router.push('/(tabs)');
  };

  const handleVIPBenefits = () => {
    // Handle family management
  };

  const handleSetting = (setting: string) => {
    // Handle different settings
    console.log('Setting:', setting);
  };

  const handleFunction = (func: string) => {
    // Handle different functions
    console.log('Function:', func);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>个人中心</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 用户信息部分 */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Image
                  source={{ uri: 'https://via.placeholder.com/80x80/87CEEB/FFFFFF?text=👤' }}
                  style={styles.avatarImage}
                />
              </View>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>彭彦纶 Allen</Text>
                <View style={styles.vipBadge}>
                  <Text style={styles.vipText}>🏆VIP</Text>
                </View>
              </View>
              <Text style={styles.userId}>ID: TC7JNV34</Text>
              <Text style={styles.recordDays}>你已经记录了<Text style={styles.daysNumber}>0</Text>天</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>

          {/* 家庭管理通知卡片 */}
          <View style={styles.vipCard}>
            <View style={styles.vipCardContent}>
              <Text style={styles.vipIcon}>🏡</Text>
              <Text style={styles.vipMessage}>欢迎使用家庭管理中心</Text>
            </View>
            <TouchableOpacity style={styles.vipButton} onPress={handleVIPBenefits}>
              <Text style={styles.vipButtonText}>管理家庭</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 功能网格 */}
        <View style={styles.functionsGrid}>
          <View style={styles.functionsRow}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familySchedule')}>
              <Text style={styles.functionIcon}>📅</Text>
              <Text style={styles.functionText}>家庭日程</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('memberManagement')}>
              <Text style={styles.functionIcon}>👥</Text>
              <Text style={styles.functionText}>成员管理</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('houseworkAssignment')}>
              <Text style={styles.functionIcon}>🏠</Text>
              <Text style={styles.functionText}>家务分配</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('birthdayReminder')}>
              <Text style={styles.functionIcon}>🎂</Text>
              <Text style={styles.functionText}>生日提醒</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.functionsRow}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyAlbum')}>
              <Text style={styles.functionIcon}>📸</Text>
              <Text style={styles.functionText}>家庭相册</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('shoppingList')}>
              <Text style={styles.functionIcon}>🛒</Text>
              <Text style={styles.functionText}>购物清单</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('familyBudget')}>
              <Text style={styles.functionIcon}>💰</Text>
              <Text style={styles.functionText}>家庭预算</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('emergencyContact')}>
              <Text style={styles.functionIcon}>🚨</Text>
              <Text style={styles.functionText}>紧急联系</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 设置选项 */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('settings')}>
            <Text style={styles.settingText}>设置</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('userAgreement')}>
            <Text style={styles.settingText}>用户协议</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('privacyPolicy')}>
            <Text style={styles.settingText}>隐私政策</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => handleSetting('about')}>
            <Text style={styles.settingText}>关于</Text>
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