import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface ChatToolbarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatToolbar({ onSendMessage, disabled = false }: ChatToolbarProps) {
  const [inputValue, setInputValue] = useState('');
  const textInput = useRef<TextInput>(null);
  const theme = useColorScheme();

  const onSubmitMessage = useCallback(
    (value: string) => {
      if (value.trim() === '') {
        textInput.current?.blur();
        return;
      }

      if (Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setTimeout(() => {
        textInput.current?.clear();
      });

      onSendMessage(value);
      setInputValue('');
    },
    [textInput, onSendMessage]
  );

  const onSubmitEditing = useCallback(
    (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      onSubmitMessage(e.nativeEvent.text);
    },
    [onSubmitMessage]
  );

  return (
    <BlurView
      tint={theme === 'light' ? 'systemChromeMaterial' : 'systemChromeMaterialDark'}
      style={styles.blurContainer}
    >
      <View style={styles.inputContainer}>
        <TextInput
          ref={textInput}
          onChangeText={setInputValue}
          keyboardAppearance={theme ?? 'light'}
          returnKeyType="send"
          blurOnSubmit={false}
          style={[
            styles.textInput,
            {
              pointerEvents: disabled ? 'none' : 'auto',
              color: theme === 'light' ? '#000' : '#fff',
            },
          ]}
          placeholder="有什么想问我的吗？"
          autoCapitalize="sentences"
          autoCorrect
          placeholderTextColor={theme === 'light' ? '#999' : '#666'}
          onSubmitEditing={onSubmitEditing}
          multiline
        />

        <TouchableOpacity
          disabled={!inputValue.length || disabled}
          onPress={() => onSubmitMessage(inputValue)}
          style={[
            styles.sendButton,
            (!inputValue.length || disabled) && styles.sendButtonDisabled,
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={inputValue.length && !disabled ? '#fff' : '#999'}
          />
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    paddingTop: 4,
    paddingBottom: 0,
    paddingHorizontal: 16,
    alignItems: 'stretch',
    marginBottom: 0, // 确保没有额外的底部margin
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    padding: 16,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    width: 44,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 22,
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
}); 