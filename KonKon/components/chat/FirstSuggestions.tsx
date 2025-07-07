import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface FirstSuggestionsProps {
  onSuggestionPress: (suggestion: string) => void;
}

export function FirstSuggestions({ onSuggestionPress }: FirstSuggestionsProps) {
  const suggestions = [
    '帮我安排本周的家庭活动',
    '提醒我家人的生日和重要纪念日',
    '制定家庭购物清单',
    '安排家务分工计划',
    '推荐适合家庭的周末活动',
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  suggestionButton: {
    minWidth: 140,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  suggestionText: {
    color: '#333',
    fontSize: 16,
  },
}); 