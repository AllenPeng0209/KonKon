import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>隐私政策</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.title}>隐私政策</Text>
        <Text style={styles.lastUpdated}>最后更新日期：2024年7月25日</Text>

        <Text style={styles.paragraph}>
          KonKon（“我们”）非常重视您的隐私。本隐私政策旨在说明我们如何收集、使用、存储、共享和保护您的个人信息。
        </Text>

        <Text style={styles.sectionTitle}>1. 我们收集的信息</Text>
        <Text style={styles.paragraph}>
          为了向您提供服务，我们可能会收集以下信息：
          {'\n'}
          - <Text style={styles.bold}>账户信息：</Text>您在注册时提供的电子邮件地址、昵称、密码。
          {'\n'}
          - <Text style={styles.bold}>家庭信息：</Text>您在创建或加入家庭时主动输入的家庭名称、家庭成员关系以及其他家庭成员的信息。
          {'\n'}
          - <Text style={styles.bold}>用户内容：</Text>您在使用家庭日历、相册、购物清单等功能时上传的文本、图片和其他内容。
          {'\n'}
          - <Text style={styles.bold}>设备信息：</Text>我们可能会收集您的设备型号、操作系统版本、唯一设备标识符等信息。
        </Text>

        <Text style={styles.sectionTitle}>2. 我们如何使用信息</Text>
        <Text style={styles.paragraph}>
          我们严格遵守法律法规的规定及与用户的约定，将收集的信息用于以下用途：
          {'\n'}
          - 向您提供各项服务功能。
          {'\n'}
          - 维护、改进、优化我们的服务。
          {'\n'}
          - 用于身份验证、客户服务、安全防范、诈骗监测等。
          {'\n'}
          - 向您推荐您可能感兴趣的内容。
        </Text>

        <Text style={styles.sectionTitle}>3. 信息的共享与披露</Text>
        <Text style={styles.paragraph}>
          我们不会与任何第三方公司、组织和个人分享您的个人信息，但以下情况除外：
          {'\n'}
          - 事先获得您的明确同意或授权。
          {'\n'}
          - 根据法律法规的规定或行政、司法机关的要求。
          {'\n'}
          - 在法律法规允许的范围内，为维护本应用、其他用户或社会公众利益、财产或安全免遭损害而有必要提供。
        </Text>

        <Text style={styles.sectionTitle}>4. 您的权利</Text>
        <Text style={styles.paragraph}>
          您有权访问、更正、删除您的个人信息。您可以通过应用内的设置功能或联系我们来行使这些权利。
        </Text>

        <Text style={styles.disclaimer}>
          *本隐私政策为示例模板，不构成正式法律文件，请在专业法律人士指导下根据实际情况进行修改。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
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
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  disclaimer: {
    marginTop: 30,
    fontSize: 12,
    color: 'red',
    textAlign: 'center',
    paddingBottom: 20,
  }
}); 