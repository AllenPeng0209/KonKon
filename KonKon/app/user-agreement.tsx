import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function UserAgreementScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('userAgreement.title')}</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.title}>{t('userAgreement.title')}</Text>
        <Text style={styles.lastUpdated}>{t('userAgreement.lastUpdated')}</Text>

        <Text style={styles.paragraph}>
          {t('userAgreement.introduction')}
        </Text>

        <Text style={styles.sectionTitle}>{t('userAgreement.serviceContentTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('userAgreement.serviceContent')}
        </Text>

        <Text style={styles.sectionTitle}>{t('userAgreement.userConductTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('userAgreement.userConduct')}
        </Text>

        <Text style={styles.sectionTitle}>{t('userAgreement.intellectualPropertyTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('userAgreement.intellectualProperty')}
        </Text>

        <Text style={styles.sectionTitle}>{t('userAgreement.disclaimerTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('userAgreement.disclaimer')}
        </Text>

        <Text style={styles.sectionTitle}>{t('userAgreement.agreementChangesTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('userAgreement.agreementChanges')}
        </Text>
        
        <Text style={styles.disclaimer}>
          {t('userAgreement.legalDisclaimer')}
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