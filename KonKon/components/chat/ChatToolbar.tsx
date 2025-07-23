import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputSubmitEditingEventData,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface ChatToolbarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatToolbar({ onSendMessage, disabled = false }: ChatToolbarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textInput = useRef<TextInput>(null);
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();
  
  // 動畫值
  const focusAnimation = useSharedValue(0);
  const sendButtonScale = useSharedValue(1);
  const sendButtonRotation = useSharedValue(0);

  // 顏色主題
  const colors = {
    light: {
      background: '#ffffff',
      inputBackground: '#f8f9fa',
      inputBackgroundFocused: '#ffffff',
      inputBorder: '#e1e5e9',
      inputBorderFocused: '#007AFF',
      inputText: '#1a1d1f',
      placeholder: '#8e9297',
      sendButton: '#007AFF',
      sendButtonDisabled: '#c7c9cc',
      shadow: 'rgba(0, 0, 0, 0.08)',
    },
    dark: {
      background: '#1c1c1e',
      inputBackground: '#2c2c2e',
      inputBackgroundFocused: '#3a3a3c',
      inputBorder: '#48484a',
      inputBorderFocused: '#0984ff',
      inputText: '#ffffff',
      placeholder: '#8e8e93',
      sendButton: '#0984ff',
      sendButtonDisabled: '#48484a',
      shadow: 'rgba(0, 0, 0, 0.3)',
    }
  };

  const currentColors = colors[theme ?? 'light'];

  const onSubmitMessage = useCallback(
    (value: string) => {
      if (value.trim() === '') {
        textInput.current?.blur();
        return;
      }

      if (Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // 發送按鈕動畫
      sendButtonRotation.value = withSpring(360, { damping: 15 });
      setTimeout(() => {
        sendButtonRotation.value = 0;
      }, 600);

      setTimeout(() => {
        textInput.current?.clear();
      });

      onSendMessage(value);
      setInputValue('');
    },
    [textInput, onSendMessage, sendButtonRotation]
  );

  const onSubmitEditing = useCallback(
    (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      onSubmitMessage(e.nativeEvent.text);
    },
    [onSubmitMessage]
  );

  const onFocus = useCallback(() => {
    setIsFocused(true);
    focusAnimation.value = withSpring(1, { damping: 20 });
  }, [focusAnimation]);

  const onBlur = useCallback(() => {
    setIsFocused(false);
    focusAnimation.value = withSpring(0, { damping: 20 });
  }, [focusAnimation]);

  const onSendPress = useCallback(() => {
    sendButtonScale.value = withSpring(0.9, { damping: 15 }, () => {
      sendButtonScale.value = withSpring(1, { damping: 15 });
    });
    onSubmitMessage(inputValue);
  }, [inputValue, onSubmitMessage, sendButtonScale]);

  // 動畫樣式
  const inputContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        focusAnimation.value,
        [0, 1],
        [currentColors.inputBorder, currentColors.inputBorderFocused]
      ),
      backgroundColor: interpolateColor(
        focusAnimation.value,
        [0, 1],
        [currentColors.inputBackground, currentColors.inputBackgroundFocused]
      ),
      transform: [
        {
          scale: withSpring(focusAnimation.value * 0.02 + 1, { damping: 20 })
        }
      ],
      shadowOpacity: focusAnimation.value * 0.1,
    };
  });

  const sendButtonAnimatedStyle = useAnimatedStyle(() => {
    const canSend = inputValue.length > 0 && !disabled;
    return {
      transform: [
        { scale: sendButtonScale.value },
        { rotate: `${sendButtonRotation.value}deg` }
      ],
      backgroundColor: canSend ? currentColors.sendButton : currentColors.sendButtonDisabled,
      opacity: withTiming(canSend ? 1 : 0.6, { duration: 200 }),
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(focusAnimation.value * -2, { damping: 20 })
        }
      ],
    };
  });

  return (
    <Animated.View style={[
      styles.safeAreaContainer, 
      { paddingBottom: 0 },
      containerAnimatedStyle
    ]}>
      <BlurView
        tint={theme === 'light' ? 'systemUltraThinMaterial' : 'systemUltraThinMaterialDark'}
        intensity={80}
        style={styles.blurContainer}
      >
        <View style={styles.contentContainer}>
          <Animated.View style={[
            styles.inputContainer,
            inputContainerAnimatedStyle,
            {
              shadowColor: currentColors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 4,
            }
          ]}>
            <TextInput
              ref={textInput}
              onChangeText={setInputValue}
              onFocus={onFocus}
              onBlur={onBlur}
              keyboardAppearance={theme ?? 'light'}
              returnKeyType="send"
              blurOnSubmit={false}
              style={[
                styles.textInput,
                {
                  pointerEvents: disabled ? 'none' : 'auto',
                  color: currentColors.inputText,
                },
              ]}
              autoCapitalize="sentences"
              autoCorrect
              placeholderTextColor={currentColors.placeholder}
              onSubmitEditing={onSubmitEditing}
              multiline
            />

            <AnimatedTouchableOpacity
              disabled={!inputValue.length || disabled}
              onPress={onSendPress}
              style={[styles.sendButton, sendButtonAnimatedStyle]}
            >
                           <Ionicons
               name="arrow-up"
               size={20}
               color="#ffffff"
             />
            </AnimatedTouchableOpacity>
          </Animated.View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    backgroundColor: 'transparent',
  },
  blurContainer: {
    paddingTop: 6,
    paddingBottom: 2,
    paddingHorizontal: 16,
    borderTopWidth: 0,
  },
  contentContainer: {
    alignItems: 'stretch',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
    minHeight: 36,
    fontWeight: '400',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 2,
    marginBottom: 2,
    shadowColor: 'rgba(0, 122, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.8,
    elevation: 6,
  },
}); 