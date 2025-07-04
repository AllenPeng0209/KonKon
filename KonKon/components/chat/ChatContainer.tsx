import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ChatContainerProps {
  children: React.ReactNode;
  style?: any;
}

export function ChatContainer({ children, style }: ChatContainerProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
  },
  content: {
    flex: 1,
    flexGrow: 1,
  },
}); 