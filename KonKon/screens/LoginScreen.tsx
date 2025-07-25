import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useAuth } from '../contexts/AuthContext'

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请输入邮箱和密码')
      return
    }

    console.log('开始登录:', { email, password: '***' })
    setLoading(true)
    try {
      const { data, error } = await signIn(email, password)
      console.log('登录结果:', { data: data?.user?.email, error: error?.message })
      
      if (error) {
        console.error('登录错误:', error)
        Alert.alert('登录失败', error.message)
      } else {
        console.log('登录成功!')
      }
    } catch (error) {
      console.error('登录异常:', error)
      Alert.alert('登录失败', '发生未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>KonKon</Text>
          <Text style={styles.subtitle}>家庭共享日历</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="邮箱"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="密码"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '登录中...' : '登录'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>还没有账户？</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>注册</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    color: '#666',
  },
  form: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
}) 