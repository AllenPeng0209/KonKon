import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { BAILIAN_API_KEY, BAILIAN_ENDPOINT, BAILIAN_WORKSPACE_ID } from '@/lib/bailian';

interface BailianConfigProps {
  onConfigError?: (error: string) => void;
}

export function BailianConfig({ onConfigError }: BailianConfigProps) {
  const checkConfig = () => {
    const errors: string[] = [];

    if (!BAILIAN_API_KEY) {
      errors.push('EXPO_PUBLIC_BAILIAN_API_KEY 未配置');
    }

    if (!BAILIAN_ENDPOINT) {
      errors.push('EXPO_PUBLIC_BAILIAN_ENDPOINT 未配置');
    }

    if (!BAILIAN_WORKSPACE_ID) {
      errors.push('EXPO_PUBLIC_BAILIAN_WORKSPACE_ID 未配置');
    }

    if (errors.length > 0) {
      const errorMessage = `阿里百炼配置错误：\n${errors.join('\n')}`;
      onConfigError?.(errorMessage);
      Alert.alert('配置错误', errorMessage);
      return false;
    }

    return true;
  };

  React.useEffect(() => {
    checkConfig();
  }, []);

  if (!checkConfig()) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>⚠️ 阿里百炼配置错误</Text>
        <Text style={styles.descriptionText}>
          请在 .env.local 文件中配置以下环境变量：
        </Text>
        <Text style={styles.codeText}>
          EXPO_PUBLIC_BAILIAN_API_KEY=your_api_key{'\n'}
          EXPO_PUBLIC_BAILIAN_ENDPOINT=https://dashscope.aliyuncs.com{'\n'}
          EXPO_PUBLIC_BAILIAN_WORKSPACE_ID=your_workspace_id
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    color: '#495057',
  },
}); 