import { t } from '@/lib/i18n';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface FirstSuggestionsProps {
  onSuggestionPress: (suggestion: string) => void;
}

export function FirstSuggestions({ onSuggestionPress }: FirstSuggestionsProps) {
  const suggestions = [
    t('firstSuggestions.suggestion1'),
    t('firstSuggestions.suggestion2'),
    t('firstSuggestions.suggestion3'),
    t('firstSuggestions.suggestion4'),
    t('firstSuggestions.suggestion5'),
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
    paddingVertical: 8, // 使用垂直内边距替代固定的底部内边距
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