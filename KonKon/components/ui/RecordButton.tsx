import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface RecordButtonProps {
  onPress?: () => void;
  onMorePress?: () => void;
  text?: string;
  icon?: string;
  disabled?: boolean;
}

export default function RecordButton({
  onPress,
  onMorePress,
  text = '长按说话，快速记录',
  icon = '+',
  disabled = false,
}: RecordButtonProps) {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity 
        style={[styles.recordButton, disabled && styles.recordButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={styles.recordButtonIcon}>{icon}</Text>
        <Text style={styles.recordButtonText}>{text}</Text>
        <TouchableOpacity style={styles.moreButton} onPress={onMorePress}>
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'relative',
  },
  recordButtonDisabled: {
    backgroundColor: '#999',
  },
  recordButtonIcon: {
    fontSize: 18,
    color: '#fff',
    marginRight: 8,
  },
  recordButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  moreButton: {
    position: 'absolute',
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 16,
    color: '#fff',
  },
}); 