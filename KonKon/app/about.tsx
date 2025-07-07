import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>关于 KonKon</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.content}>
        <Image 
          source={require('../assets/images/icon.png')} 
          style={styles.logo}
        />
        <Text style={styles.appName}>KonKon</Text>
        <Text style={styles.version}>版本 1.0.0</Text>
        <Text style={styles.description}>
          KonKon 是一款专为家庭设计的智能助手，旨在通过共享日历、任务分配、购物清单等功能，让家庭成员之间的沟通更简单，生活更有条理。
        </Text>
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 KonKon. 保留所有权利。</Text>
        </View>
      </View>
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
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    fontSize: 22,
    color: '#007AFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  version: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 8,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#bdc3c7',
  },
}); 