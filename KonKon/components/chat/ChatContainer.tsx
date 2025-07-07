import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ChatContainerProps {
  children: React.ReactNode;
  style?: any;
}

export function ChatContainer({ children, style }: ChatContainerProps) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
}); 