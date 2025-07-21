import React from 'react';
import { View, StyleSheet } from 'react-native';
import ModernFinanceHome from '@/components/finance/ModernFinanceHome';

export default function ModernFinanceScreen() {
  return (
    <View style={styles.container}>
      <ModernFinanceHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});