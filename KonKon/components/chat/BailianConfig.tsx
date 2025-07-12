import { BAILIAN_API_KEY, BAILIAN_ENDPOINT, BAILIAN_WORKSPACE_ID } from '@/lib/bailian';
import { t } from '@/lib/i18n';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

interface BailianConfigProps {
  onConfigError?: (error: string) => void;
}

export function BailianConfig({ onConfigError }: BailianConfigProps) {
  const checkConfig = () => {
    const errors: string[] = [];

    if (!BAILIAN_API_KEY) {
      errors.push(t('bailianConfig.apiKeyNotConfigured'));
    }

    if (!BAILIAN_ENDPOINT) {
      errors.push(t('bailianConfig.endpointNotConfigured'));
    }

    if (!BAILIAN_WORKSPACE_ID) {
      errors.push(t('bailianConfig.workspaceIdNotConfigured'));
    }

    if (errors.length > 0) {
      const errorMessage = `${t('bailianConfig.configError')}:\n${errors.join('\n')}`;
      onConfigError?.(errorMessage);
      Alert.alert(t('bailianConfig.errorTitle'), errorMessage);
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
        <Text style={styles.errorText}>⚠️ {t('bailianConfig.configError')}</Text>
        <Text style={styles.descriptionText}>
          {t('bailianConfig.errorDescription')}
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