import { LogBox } from 'react-native';

// 抑制 Reanimated 警告 - 必须在最开始执行
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
]);

import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from 'expo-status-bar';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import Drawer from '../components/Drawer';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { FamilyProvider } from '../contexts/FamilyContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { registerForPushNotificationsAsync } from '../lib/notifications';

SplashScreen.preventAutoHideAsync();

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [isDrawerVisible, setDrawerVisible] = useState(false);

  const onHandlerStateChange = (event: any) => {
    const currentRoute = segments.join('/');
    if (currentRoute.includes('avatar')) {
      return;
    }
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, translationY } = event.nativeEvent;
      if (translationX > 100 && Math.abs(translationY) < 50) {
        setDrawerVisible(true);
      } else if (translationX < -100 && Math.abs(translationY) < 50) {
        router.push('/avatar');
      }
    }
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  useEffect(() => {
    if (loading) return;

    const currentPath = segments.join('/') || '';
    const inAuthFlow = currentPath.includes('login') || currentPath.includes('register');

    if (!user && !inAuthFlow) {
      router.replace('/login');
    } else if (user && inAuthFlow) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PanGestureHandler onHandlerStateChange={onHandlerStateChange}>
      <View style={{ flex: 1 }}>
        <FamilyProvider>
          <>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="create-family" options={{ headerShown: false }} />
                <Stack.Screen name="family-management" options={{ headerShown: false }} />
                <Stack.Screen name="join-family" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="user-agreement" options={{ headerShown: false }} />
                <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
                <Stack.Screen name="about" options={{ headerShown: false }} />
                <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
                <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
                <Stack.Screen name="language-selection" options={{ headerShown: false }} />
                <Stack.Screen name="calendar-settings" options={{ headerShown: false }} />
                <Stack.Screen name="avatar" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
            
            {isDrawerVisible && (
              <TouchableWithoutFeedback onPress={closeDrawer}>
                <View style={StyleSheet.absoluteFill} />
              </TouchableWithoutFeedback>
            )}
            <Drawer isVisible={isDrawerVisible} onClose={closeDrawer} />
          </>
        </FamilyProvider>
      </View>
    </PanGestureHandler>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    (async () => {
      const { status } = await requestTrackingPermissionsAsync();
      if (status === 'granted') {
        console.log('Yay! I have user permission to track an advertiser identifier!');
      }
    })();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider>
          <ProtectedLayout />
        </LanguageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
