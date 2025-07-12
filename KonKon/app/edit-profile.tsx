import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // The user's display name might be in user_metadata, common practice
  const [name, setName] = useState(user?.user_metadata?.name || user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert(t('editProfile.error'), t('editProfile.notLoggedIn'));
      return;
    }
    if (!name.trim()) {
      Alert.alert(t('editProfile.error'), t('editProfile.nicknameRequired'));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({
      data: { name: name.trim() }
    });

    setLoading(false);

    if (error) {
      Alert.alert(t('editProfile.saveFailed'), error.message);
    } else {
      Alert.alert(t('editProfile.success'), t('editProfile.profileUpdated'), [
        { text: t('editProfile.ok'), onPress: () => router.back() }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? t('editProfile.saving') : t('editProfile.save')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>{t('editProfile.nickname')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('editProfile.nicknamePlaceholder')}
          autoCapitalize="words"
        />
      </View>
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
  saveButton: {
    padding: 5,
  },
  saveButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  form: {
    marginTop: 35,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#c6c6c8',
  },
}); 