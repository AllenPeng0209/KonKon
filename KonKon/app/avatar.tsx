import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function AvatarScreen() {
  const router = useRouter();
  const animation = useRef<LottieView>(null);

  return (
    <ThemedView style={styles.container}>
      <LottieView
        ref={animation}
        style={styles.lottie}
        source={require('@/assets/avatar/CatPookie.lottie')}
        autoPlay
        loop
      />
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ThemedText type="link">返回</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '90%',
    aspectRatio: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 10,
  },
}); 