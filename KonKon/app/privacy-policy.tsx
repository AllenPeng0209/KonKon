import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>{t('privacyPolicy.title')}</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.title}>{t('privacyPolicy.title')}</Text>
        <Text style={styles.lastUpdated}>{t('privacyPolicy.lastUpdated')}</Text>

        <Text style={styles.paragraph}>
          {t('privacyPolicy.introduction')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacyPolicy.infoWeCollectTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacyPolicy.infoWeCollectContent')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacyPolicy.howWeUseInfoTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacyPolicy.howWeUseInfoContent')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacyPolicy.sharingAndDisclosureTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacyPolicy.sharingAndDisclosureContent')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacyPolicy.yourRightsTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacyPolicy.yourRightsContent')}
        </Text>

        <Text style={styles.disclaimer}>
          {t('privacyPolicy.disclaimer')}
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