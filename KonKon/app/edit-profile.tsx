import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AvatarService from '../lib/avatarService';
import { supabase } from '../lib/supabase';

// 生成年份數組 (1950-2024)
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1950; year--) {
    years.push(year.toString());
  }
  return years;
};

// 生成月份數組
const months = Array.from({ length: 12 }, (_, i) => {
  const month = (i + 1).toString().padStart(2, '0');
  return month;
});

// 生成日期數組
const generateDays = (year: string, month: string) => {
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.user_metadata?.name || user?.user_metadata?.display_name || user?.email || '');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // 模態狀態
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);

  const years = generateYears();
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    // 更新日期選項當年月改變時
    if (birthYear && birthMonth) {
      setDays(generateDays(birthYear, birthMonth));
    }
  }, [birthYear, birthMonth]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select(`
          display_name, 
          avatar_url, 
          phone, 
          gender, 
          birth_date, 
          interests
        `)
        .eq('id', user.id)
        .single();

      if (userData) {
        setName(userData.display_name || user.email || '');
        setAvatarUrl(userData.avatar_url);
        setPhone(userData.phone || '');
        setGender(userData.gender || '');
        setInterests(userData.interests || '');
        
        // 解析生日
        if (userData.birth_date) {
          const [year, month, day] = userData.birth_date.split('-');
          setBirthYear(year);
          setBirthMonth(month);
          setBirthDay(day);
        }
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
      // 組合生日
      const birthDate = birthYear && birthMonth && birthDay 
        ? `${birthYear}-${birthMonth}-${birthDay}` 
        : null;

      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          display_name: name.trim(),
          phone: phone.trim() || null,
          gender: gender || null,
          birth_date: birthDate,
          interests: interests.trim() || null,
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

  const getGenderLabel = (value: string) => {
    const genderOptions = {
      'male': '男',
      'female': '女',
      'other': '其他',
      'prefer_not_to_say': '不願透露'
    };
    return genderOptions[value as keyof typeof genderOptions] || '請選擇';
  };

  const getBirthDateLabel = () => {
    if (birthYear && birthMonth && birthDay) {
      return `${birthYear}年${birthMonth}月${birthDay}日`;
    }
    return '請選擇生日';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部導航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>編輯個人資料</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? '保存中' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 頭像區域 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={showAvatarOptions}
            disabled={avatarLoading}
          >
            <Image
              source={{ uri: getDisplayAvatarUrl() }}
              style={styles.avatarImage}
            />
            {avatarLoading && (
              <View style={styles.avatarOverlay}>
                <Text style={styles.loadingText}>上傳中...</Text>
              </View>
            )}
            <View style={styles.avatarEditIcon}>
              <Ionicons name="camera" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>點擊更換頭像</Text>
        </View>

        {/* 表單區域 */}
        <View style={styles.formContainer}>
          {/* 昵稱 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>昵稱</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="請輸入您的昵稱"
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* 手機號碼 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>手機號碼</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="請輸入手機號碼"
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
            />
          </View>

          {/* 性別 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>性別</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowGenderPicker(true)}
            >
              <Text style={[styles.pickerButtonText, !gender && styles.placeholderText]}>
                {getGenderLabel(gender)}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* 生日 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>生日</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowBirthDatePicker(true)}
            >
              <Text style={[styles.pickerButtonText, !birthYear && styles.placeholderText]}>
                {getBirthDateLabel()}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* 興趣愛好 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>興趣愛好</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={interests}
              onChangeText={setInterests}
              placeholder="分享一下您的興趣愛好"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* 性別選擇器 */}
      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Text style={styles.pickerCancel}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>選擇性別</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Text style={styles.pickerDone}>完成</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => setGender(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="請選擇" value="" />
              <Picker.Item label="男" value="male" />
              <Picker.Item label="女" value="female" />
              <Picker.Item label="其他" value="other" />
              <Picker.Item label="不願透露" value="prefer_not_to_say" />
            </Picker>
          </View>
        </View>
      </Modal>

      {/* 生日選擇器 */}
      <Modal
        visible={showBirthDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBirthDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowBirthDatePicker(false)}>
                <Text style={styles.pickerCancel}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>選擇生日</Text>
              <TouchableOpacity onPress={() => setShowBirthDatePicker(false)}>
                <Text style={styles.pickerDone}>完成</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.multiPickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>年</Text>
                <Picker
                  selectedValue={birthYear}
                  onValueChange={(itemValue) => setBirthYear(itemValue)}
                  style={styles.columnPicker}
                >
                  <Picker.Item label="年" value="" />
                  {years.map(year => (
                    <Picker.Item key={year} label={year} value={year} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>月</Text>
                <Picker
                  selectedValue={birthMonth}
                  onValueChange={(itemValue) => setBirthMonth(itemValue)}
                  style={styles.columnPicker}
                >
                  <Picker.Item label="月" value="" />
                  {months.map(month => (
                    <Picker.Item key={month} label={month} value={month} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>日</Text>
                <Picker
                  selectedValue={birthDay}
                  onValueChange={(itemValue) => setBirthDay(itemValue)}
                  style={styles.columnPicker}
                >
                  <Picker.Item label="日" value="" />
                  {days.map(day => (
                    <Picker.Item key={day} label={day} value={day} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  headerButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveTextDisabled: {
    color: '#8E8E93',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E5EA',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  formContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  pickerCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  picker: {
    height: 200,
  },
  multiPickerContainer: {
    flexDirection: 'row',
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerColumnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    paddingVertical: 8,
  },
  columnPicker: {
    flex: 1,
    width: '100%',
  },
}); 