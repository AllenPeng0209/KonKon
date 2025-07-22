import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { updatePassword, user } = useAuth();
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // 顯示/隱藏密碼
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleBack = () => {
        router.back();
    };

    const validatePassword = (password: string): { isValid: boolean; message: string } => {
        if (password.length < 6) {
            return { isValid: false, message: '密碼長度至少需要6位' };
        }
        
        if (!/(?=.*[a-z])/.test(password)) {
            return { isValid: false, message: '密碼需要包含至少一個小寫字母' };
        }
        
        if (!/(?=.*\d)/.test(password)) {
            return { isValid: false, message: '密碼需要包含至少一個數字' };
        }
        
        return { isValid: true, message: '' };
    };

    const handleChangePassword = async () => {
        // 驗證輸入        
        if (!newPassword.trim()) {
            Alert.alert('錯誤', '請輸入新密碼');
            return;
        }
        
        if (!confirmPassword.trim()) {
            Alert.alert('錯誤', '請確認新密碼');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Alert.alert('錯誤', '新密碼與確認密碼不匹配');
            return;
        }
        
        // 驗證新密碼強度
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            Alert.alert('密碼強度不足', passwordValidation.message);
            return;
        }

        setLoading(true);
        
        try {
            // 直接嘗試更新密碼，Supabase 會自動驗證當前用戶身份
            const result = await updatePassword(newPassword);
            
            if (result.error) {
                // 如果錯誤信息表明是認證問題，提供更友好的錯誤信息
                let errorMessage = result.error.message;
                if (errorMessage.toLowerCase().includes('invalid') || 
                    errorMessage.toLowerCase().includes('unauthorized')) {
                    errorMessage = '密碼更新失敗，請確認您的登錄狀態';
                }
                Alert.alert('更新失敗', errorMessage);
            } else {
                Alert.alert(
                    '更新成功', 
                    '您的密碼已成功更新。為了安全起見，請重新登錄。',
                    [
                        { 
                            text: '好的',
                                                         onPress: () => {
                                 // 清除表單
                                 setNewPassword('');
                                 setConfirmPassword('');
                                 router.back();
                             }
                        }
                    ]
                );
            }
        } catch (error: any) {
            console.error('密碼更新錯誤:', error);
            Alert.alert('更新失敗', error.message || '密碼更新時發生未知錯誤');
        } finally {
            setLoading(false);
        }
    };

    const renderPasswordInput = (
        value: string,
        onChangeText: (text: string) => void,
        placeholder: string,
        isVisible: boolean,
        onToggleVisibility: () => void
    ) => (
        <View style={styles.passwordInputContainer}>
            <TextInput
                style={styles.passwordInput}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={!isVisible}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TouchableOpacity 
                style={styles.eyeButton}
                onPress={onToggleVisibility}
            >
                <Ionicons 
                    name={isVisible ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* 頭部 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>更改密碼</Text>
                    <View style={styles.headerRight} />
                </View>

                {/* 表單內容 */}
                                 <View style={styles.content}>
                     <Text style={styles.description}>
                         請設定您的新密碼。密碼需要至少6位，包含字母和數字。
                     </Text>

                                         <View style={styles.form}>
                         <View style={styles.inputSection}>
                            <Text style={styles.label}>新密碼</Text>
                            {renderPasswordInput(
                                newPassword,
                                setNewPassword,
                                '請輸入新密碼',
                                showNewPassword,
                                () => setShowNewPassword(!showNewPassword)
                            )}
                            <Text style={styles.hint}>
                                密碼需要至少6位，包含字母和數字
                            </Text>
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={styles.label}>確認新密碼</Text>
                            {renderPasswordInput(
                                confirmPassword,
                                setConfirmPassword,
                                '請再次輸入新密碼',
                                showConfirmPassword,
                                () => setShowConfirmPassword(!showConfirmPassword)
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            <Text style={styles.submitButtonText}>
                                {loading ? '更新中...' : '更新密碼'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#c6c6c8',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
        color: '#000',
    },
    headerRight: {
        width: 34, // 與 backButton 相同寬度，保持平衡
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    form: {
        gap: 20,
    },
    inputSection: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#c6c6c8',
        paddingHorizontal: 15,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 17,
        color: '#000',
    },
    eyeButton: {
        padding: 5,
    },
    hint: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#999',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
}); 