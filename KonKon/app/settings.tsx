import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [cacheSize, setCacheSize] = useState(12.3);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      Alert.alert('退出失败', '请稍后重试');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "确认清除缓存",
      `您确定要清除 ${cacheSize.toFixed(1)}MB 的缓存吗？`,
      [
        { text: "取消", style: "cancel" },
        { 
          text: "确认", 
          onPress: () => {
            setCacheSize(0);
            Alert.alert("缓存已清除");
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
         <Text style={styles.headerTitle}>设置</Text>
         <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>账户</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="person-circle-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>编辑个人资料</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>通用</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/notification-settings')}>
            <Ionicons name="notifications-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>通知设置</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/language-selection')}>
            <Ionicons name="language-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>语言选择</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.sectionHeader}>存储</Text>
        <View style={styles.settingsGroup}>
           <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
            <MaterialCommunityIcons name="cached" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>清除缓存</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.settingValue}>{cacheSize.toFixed(1)} MB</Text>
                <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>退出登录</Text>
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
        paddingHorizontal: 10,
        paddingVertical: 12,
        backgroundColor: '#fff',
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