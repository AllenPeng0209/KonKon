import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AvatarService from '../lib/avatarService';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.user_metadata?.name || user?.user_metadata?.display_name || user?.email || '');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (userData) {
        setName(userData.display_name || user.email || '');
        setAvatarUrl(userData.avatar_url);
      }
    } catch (error) {
      console.error('載入用戶資料失敗:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('錯誤', '用戶未登入');
      return;
    }
    if (!name.trim()) {
      Alert.alert('錯誤', '昵稱不能為空');
      return;
    }

    setLoading(true);
    
    try {
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          display_name: name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) {
        throw dbError;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          name: name.trim(),
          display_name: name.trim()
        }
      });

      if (authError) {
        console.warn('Auth metadata 更新失敗:', authError);
      }

      Alert.alert('成功', '您的個人資料已更新', [
        { text: '好的', onPress: () => router.back() }
      ]);

    } catch (error: any) {
      Alert.alert('保存失敗', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showAvatarOptions = () => {
    Alert.alert(
      '選擇頭像',
      '請選擇頭像來源',
      [
        {
          text: '拍照',
          onPress: handleTakePhoto
        },
        {
          text: '從相冊選擇',
          onPress: handlePickFromLibrary
        },
        ...(avatarUrl ? [{
          text: '刪除頭像',
          style: 'destructive' as const,
          onPress: handleDeleteAvatar
        }] : []),
        {
          text: '取消',
          style: 'cancel' as const
        }
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      setAvatarLoading(true);
      const imageAsset = await AvatarService.pickFromCamera();
      
      if (imageAsset) {
        const result = await AvatarService.uploadAvatar(imageAsset);
        
        if (result.success && result.avatarUrl) {
          setAvatarUrl(result.avatarUrl);
          Alert.alert('成功', '頭像更新成功');
        } else {
          Alert.alert('錯誤', result.error || '頭像更新失敗');
        }
      }
    } catch (error: any) {
      Alert.alert('錯誤', error.message || '拍照失敗');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      setAvatarLoading(true);
      const imageAsset = await AvatarService.pickFromLibrary();
      
      if (imageAsset) {
        const result = await AvatarService.uploadAvatar(imageAsset);
        
        if (result.success && result.avatarUrl) {
          setAvatarUrl(result.avatarUrl);
          Alert.alert('成功', '頭像更新成功');
        } else {
          Alert.alert('錯誤', result.error || '頭像更新失敗');
        }
      }
    } catch (error: any) {
      Alert.alert('錯誤', error.message || '選擇照片失敗');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    Alert.alert(
      '確認刪除',
      '確定要刪除頭像嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              setAvatarLoading(true);
              const result = await AvatarService.deleteUserAvatar();
              
              if (result.success) {
                setAvatarUrl(null);
                Alert.alert('成功', '頭像已刪除');
              } else {
                Alert.alert('錯誤', result.error || '刪除頭像失敗');
              }
            } catch (error: any) {
              Alert.alert('錯誤', error.message || '刪除頭像失敗');
            } finally {
              setAvatarLoading(false);
            }
          }
        }
      ]
    );
  };

  const getDisplayAvatarUrl = () => {
    if (avatarUrl) {
      return avatarUrl;
    }
    return AvatarService.getPlaceholderUrl(name || '用戶');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>編輯個人資料</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {/* 頭像區域 */}
        <View style={styles.avatarSection}>
          <Text style={styles.label}>頭像</Text>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={showAvatarOptions}
            disabled={avatarLoading}
          >
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: getDisplayAvatarUrl() }}
                style={styles.avatarImage}
              />
              {avatarLoading && (
                <View style={styles.avatarLoading}>
                  <Text style={styles.loadingText}>上傳中...</Text>
                </View>
              )}
              <View style={styles.avatarOverlay}>
                <Ionicons name="camera" size={24} color="#FFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 姓名區域 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>昵稱</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="請輸入您的昵稱"
            autoCapitalize="words"
          />
        </View>
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
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  avatarContainer: {
    marginTop: 10,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5E5',
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 12,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
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