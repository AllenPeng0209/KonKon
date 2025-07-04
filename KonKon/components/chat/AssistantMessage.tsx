import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AssistantMessageProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function AssistantMessage({ children, isLoading }: AssistantMessageProps) {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText} selectable>
          {isLoading ? '正在思考...' : children}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    maxWidth: '100%',
    paddingHorizontal: 16,
    gap: 8,
  },
  messageContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  messageText: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    borderBottomLeftRadius: 8,
    color: '#333',
    padding: 12,
    fontSize: 16,
    maxWidth: '85%',
  },
}); 