import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function UserAgreementScreen() {
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
        <Text style={styles.headerTitle}>用户协议</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.title}>用户服务协议</Text>
        <Text style={styles.lastUpdated}>最后更新日期：2024年7月25日</Text>

        <Text style={styles.paragraph}>
          欢迎使用 KonKon！本协议是您与 KonKon（以下简称“本应用”）之间关于下载、安装、使用本应用，以及使用本应用提供的相关服务的法律协议。
        </Text>

        <Text style={styles.sectionTitle}>1. 服务内容</Text>
        <Text style={styles.paragraph}>
          1.1 本应用是一个家庭管理工具，旨在帮助家庭成员更好地进行沟通、协调和规划家庭事务。
          {'\n'}
          1.2 具体服务内容包括家庭日历、成员管理、家务分配、生日提醒、家庭相册、购物清单、家庭预算和紧急联系等。
          {'\n'}
          1.3 本应用有权根据业务发展调整、升级或终止部分服务内容，无需单独通知用户。
        </Text>

        <Text style={styles.sectionTitle}>2. 用户行为规范</Text>
        <Text style={styles.paragraph}>
          2.1 您在使用本应用时，必须遵守所有适用的法律法规。
          {'\n'}
          2.2 您不得利用本应用进行任何违法或不正当的活动，包括但不限于：
          {'\n'}
          - 发布、传送、传播、储存含有骚扰、中伤、辱骂、恐吓、淫秽、暴力或任何违反法律法规、公共秩序、社会公德的内容。
          {'\n'}
          - 侵犯他人的知识产权、商业秘密、肖像权、隐私权等合法权益。
          {'\n'}
          - 进行任何危害计算机网络安全的行为。
        </Text>

        <Text style={styles.sectionTitle}>3. 知识产权</Text>
        <Text style={styles.paragraph}>
          本应用的一切著作权、商标权、专利权、商业秘密等知识产权，以及与本应用相关的所有信息内容（包括但不限于文字、图片、音频、视频、图表、界面设计、版面框架、有关数据或电子文档等）均受法律保护，归本应用所有。
        </Text>

        <Text style={styles.sectionTitle}>4. 免责声明</Text>
        <Text style={styles.paragraph}>
          4.1 您理解并同意，本应用提供的服务是按照现有技术和条件所能达到的现状提供的。我们会尽最大努力向您提供服务，确保服务的连贯性和安全性；但我们不能随时预见和防范法律、技术以及其他风险，包括但不限于不可抗力、病毒、木马、黑客攻击、系统不稳定、第三方服务瑕疵、政府行为等原因可能导致的服务中断、数据丢失以及其他的损失和风险。
          {'\n'}
          4.2 对于您使用本服务所产生的任何间接、附带、衍生或惩罚性的损害或损失，我们不承担任何责任。
        </Text>

        <Text style={styles.sectionTitle}>5. 协议的变更和终止</Text>
        <Text style={styles.paragraph}>
          5.1 我们有权在必要时修改本协议条款。您可以在本应用的最新版本中查阅相关协议条款。
          {'\n'}
          5.2 在本协议条款修改后，如果您继续使用本应用，即视为您已接受修改后的协议。
        </Text>
        
        <Text style={styles.disclaimer}>
          *本协议为示例模板，不构成正式法律文件，请在专业法律人士指导下根据实际情况进行修改。
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
  disclaimer: {
    marginTop: 30,
    fontSize: 12,
    color: 'red',
    textAlign: 'center',
    paddingBottom: 20,
  }
}); 