import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LANGUAGES = [
  { code: 'zh-CN', name: t('languageSelection.languages.zh-CN') },
  { code: 'zh-TW', name: t('languageSelection.languages.zh-TW') },
  { code: 'en', name: t('languageSelection.languages.en-US') },
  { code: 'ja', name: t('languageSelection.languages.ja-JP') },
];

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { locale, setLocale } = useLanguage();

  const handleBack = () => {
    router.back();
  };

  const renderItem = ({ item }: { item: { code: string; name: string } }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={() => setLocale(item.code)}
    >
      <Text style={styles.settingText}>{item.name}</Text>
      {locale === item.code && <Ionicons name="checkmark" size={24} color="#007AFF" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('languageSelection.title')}</Text>
        <View style={styles.headerRight} />
      </View>
      
      <FlatList
        data={LANGUAGES}
        renderItem={renderItem}
        keyExtractor={item => item.code}
        style={styles.list}
        contentContainerStyle={styles.settingsGroup}
      />
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
    width: 34,
  },
  list: {
    marginTop: 35,
  },
  settingsGroup: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c6c6c8',
  },
  settingText: {
    fontSize: 17,
    color: '#000',
  },
}); 