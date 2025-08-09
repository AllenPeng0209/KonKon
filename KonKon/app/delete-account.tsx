import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../lib/i18n';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const callDeleteAccount = async () => {
    if (!session?.access_token) {
      Alert.alert(t('common.error') || '錯誤', t('auth.notLoggedIn') || '尚未登入');
      return;
    }

    try {
      setSubmitting(true);
      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || 'Delete failed');
      }

      Alert.alert(t('settings.accountDeleted') || '帳號已刪除', t('settings.accountDeletedDesc') || '我們已刪除您的帳號與相關資料');
      // 讓 _layout.tsx 的 Auth 流程自動處理登出後跳轉
      router.replace('/login');
    } catch (e: any) {
      Alert.alert(t('common.error') || '錯誤', e?.message || '刪除失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      t('settings.confirmDeleteAccountTitle') || '刪除帳號',
      t('settings.confirmDeleteAccountMessage') || '刪除帳號後，您的資料將被移除且無法恢復。確定要繼續嗎？',
      [
        { text: t('settings.cancel') || '取消', style: 'cancel' },
        { text: t('settings.delete') || '刪除', onPress: callDeleteAccount, style: 'destructive' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.deleteAccount') || '刪除帳號'}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('settings.deleteAccount') || '刪除帳號'}</Text>
        <Text style={styles.desc}>
          {t('settings.deleteAccountDesc') || '刪除後您的帳號與個人資料將被移除。此操作不可恢復。'}
        </Text>

        <TouchableOpacity style={[styles.deleteButton, submitting && { opacity: 0.6 }]} disabled={submitting} onPress={confirmDelete}>
          <Text style={styles.deleteButtonText}>{t('settings.deleteAccountNow') || '立即刪除帳號'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F2F2F7' },
  backButton: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  headerRight: { width: 34 },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  desc: { fontSize: 15, color: '#555', lineHeight: 22 },
  deleteButton: { marginTop: 24, backgroundColor: '#ff3b30', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontSize: 17 }
}); 