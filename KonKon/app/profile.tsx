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
    router.back();
  };

  const handleVIPBenefits = () => {
    // Handle VIP benefits
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

          {/* VIP通知卡片 */}
          <View style={styles.vipCard}>
            <View style={styles.vipCardContent}>
              <Text style={styles.vipIcon}>🦝</Text>
              <Text style={styles.vipMessage}>你已是唯皮VIP尊享会员啦</Text>
            </View>
            <TouchableOpacity style={styles.vipButton} onPress={handleVIPBenefits}>
              <Text style={styles.vipButtonText}>查看权益</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 功能网格 */}
        <View style={styles.functionsGrid}>
          <View style={styles.functionsRow}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('autoRecord')}>
              <Text style={styles.functionIcon}>🐶</Text>
              <Text style={styles.functionText}>自动记账</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('billImport')}>
              <Text style={styles.functionIcon}>📊</Text>
              <Text style={styles.functionText}>账单导入</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('assetManagement')}>
              <Text style={styles.functionIcon}>✨</Text>
              <Text style={styles.functionText}>资产管理</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('cardPocket')}>
              <Text style={styles.functionIcon}>🎒</Text>
              <Text style={styles.functionText}>卡片口袋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.functionsRow}>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('widget')}>
              <Text style={styles.functionIcon}>🐹</Text>
              <Text style={styles.functionText}>小组件</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => handleFunction('categoryManagement')}>
              <Text style={styles.functionIcon}>🦫</Text>
              <Text style={styles.functionText}>分类管理</Text>
            </TouchableOpacity>
            <View style={styles.functionItem} />
            <View style={styles.functionItem} />
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
    backgroundColor: '#FFF8E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FFF8E7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    color: '#333',
    marginRight: 10,
  },
  vipBadge: {
    backgroundColor: '#FFE4B5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  vipText: {
    fontSize: 12,
    color: '#D2691E',
  },
  userId: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  recordDays: {
    fontSize: 14,
    color: '#666',
  },
  daysNumber: {
    color: '#4A90E2',
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
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#FFE4B5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vipButtonText: {
    fontSize: 14,
    color: '#D2691E',
    fontWeight: '600',
  },
  functionsGrid: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
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
    color: '#333',
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 16,
    color: '#999',
  },
}); 