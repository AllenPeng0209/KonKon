import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface FirstSuggestionsProps {
  onSuggestionPress: (suggestion: string) => void;
}

export function FirstSuggestions({ onSuggestionPress }: FirstSuggestionsProps) {
  const suggestions = [
    '分析一下我的消费习惯',
    '今天的天气怎么样？',
    '推荐几部好看的电影',
    '帮我制定一个理财计划',
    '解释一下什么是 MBTI',
  ];

  return (
    <View style={styles.container}>
      {suggestions.map((suggestion, index) => (
        <Animated.View
          entering={FadeInDown.delay((suggestions.length - index) * 100)}
          key={index}
        >
          <TouchableOpacity
            style={styles.suggestionButton}
            onPress={() => onSuggestionPress(suggestion)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  suggestionButton: {
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionText: {
    color: '#333',
    fontSize: 16,
  },
}); 