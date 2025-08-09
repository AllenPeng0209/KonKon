import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../lib/i18n';

export default function AccountSecurityScreen() {
  const router = useRouter();

  const handleBack = () => router.back();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.accountSecurity') || '帳號與安全'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="person-circle-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>{t('settings.editProfile')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/change-password')}>
            <Ionicons name="key-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.settingText}>{t('settings.changePassword')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>

        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/delete-account')}>
            <Ionicons name="trash-outline" size={24} color="#ff3b30" style={styles.icon} />
            <Text style={[styles.settingText, { color: '#ff3b30' }]}>{t('settings.deleteAccount') || '刪除帳號'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F2F2F7' },
  backButton: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  headerRight: { width: 34 },
  content: { flex: 1, paddingHorizontal: 16 },
  settingsGroup: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', marginTop: 16 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#c6c6c8' },
  icon: { marginRight: 15 },
  settingText: { flex: 1, fontSize: 17, color: '#000' },
}); 