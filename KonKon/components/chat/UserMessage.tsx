import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UserMessageProps {
  children: React.ReactNode;
}

export function UserMessage({ children }: UserMessageProps) {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText} selectable>
          {children}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    maxWidth: '100%',
    paddingHorizontal: 16,
    gap: 8,
  },
  messageContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  messageText: {
    backgroundColor: '#007AFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
    borderBottomRightRadius: 8,
    color: 'white',
    padding: 12,
    fontSize: 16,
    maxWidth: '85%',
  },
}); 