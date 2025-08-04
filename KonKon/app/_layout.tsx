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
import { ActivityIndicator, Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import Drawer from '../components/common/Drawer';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { DrawerProvider } from '../contexts/DrawerContext';
import { FamilyProvider } from '../contexts/FamilyContext';
import { FeatureSettingsProvider } from '../contexts/FeatureSettingsContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { registerForPushNotificationsAsync } from '../lib/notifications';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);
  const translateX = useSharedValue(-width);

  // 移除了 ATT 權限請求，現在在 RootLayout 中處理

  useEffect(() => {
    if (isDrawerVisible) {
      translateX.value = withTiming(0, { duration: 300 });
    } else {
      translateX.value = withTiming(-width, { duration: 300 });
    }
  }, [isDrawerVisible]);

  // 监听路由变化，在转换期间禁用手势
  useEffect(() => {
    setIsRouteTransitioning(true);
    const timer = setTimeout(() => {
      setIsRouteTransitioning(false);
    }, 500); // 500ms 后认为路由转换完成
    
    return () => clearTimeout(timer);
  }, [segments]);

  const onHandlerStateChange = (event: any) => {
    const currentRoute = segments.join('/');
    
    // 如果正在路由转换中，不处理手势
    if (isRouteTransitioning) {
      return;
    }
    
    // 只在主页（tabs 路由）时才启用手势
    const isOnHomePage = currentRoute === '' || currentRoute === '(tabs)' || currentRoute === '(tabs)/index';
    
    // 如果不在主页，或者在特定页面，则不处理手势
    if (!isOnHomePage || 
        currentRoute.includes('avatar') || 
        currentRoute.includes('profile') ||
        currentRoute.includes('settings') ||
        currentRoute.includes('notifications') ||
        currentRoute.includes('create-family') ||
        currentRoute.includes('family-management') ||
        currentRoute.includes('join-family')) {
      console.log('Gesture disabled on route:', currentRoute);
      return;
    }
    
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, translationY, x, velocityX } = event.nativeEvent;
      
      // 計算手勢開始位置：當前位置減去移動距離
      const startX = x - translationX;
      
      // 擴大觸發區域，提高靈敏度 - 從60px增加到100px
      const isFromLeftEdge = startX <= 100;
      
      console.log('Gesture detected:', { startX, translationX, translationY, velocityX, isFromLeftEdge });
      
      // 更靈敏的觸發條件：
      // 1. 滑動距離從100px降到40px
      // 2. 垂直容忍度從50px增加到80px  
      // 3. 或者滑動速度足夠快時，距離要求更低
      const isValidSwipe = (translationX > 40 && Math.abs(translationY) < 80) || 
                          (translationX > 20 && velocityX > 500); // 快速滑動時只需20px
      
      if (isFromLeftEdge && isValidSwipe) {
        console.log('Opening drawer with enhanced sensitivity');
        setDrawerVisible(true);
      }
    }
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const openDrawer = () => {
    setDrawerVisible(true);
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
        <FeatureSettingsProvider>
          <FamilyProvider>
            <DrawerProvider openDrawer={openDrawer}>
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
                  <Stack.Screen name="notifications" options={{ headerShown: false }} />
                  <Stack.Screen name="user-agreement" options={{ headerShown: false }} />
                  <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
                  <Stack.Screen name="about" options={{ headerShown: false }} />
                  <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
                  <Stack.Screen name="change-password" options={{ headerShown: false }} />
                  <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
                  <Stack.Screen name="language-selection" options={{ headerShown: false }} />
                  <Stack.Screen name="calendar-settings" options={{ headerShown: false }} />
                  <Stack.Screen name="feature-settings" options={{ headerShown: false }} />
                  <Stack.Screen name="calendar-style-selection" options={{ headerShown: false }} />
                  <Stack.Screen name="finance-management" options={{ headerShown: false }} />
                  <Stack.Screen name="assistant-settings" options={{ headerShown: false }} />
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
              <Drawer onClose={closeDrawer} translateX={translateX} />
            </DrawerProvider>
          </FamilyProvider>
        </FeatureSettingsProvider>
      </View>
    </PanGestureHandler>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [trackingPermissionRequested, setTrackingPermissionRequested] = useState(false);

  // 在應用最開始就請求 ATT 權限
  useEffect(() => {
    const requestTrackingPermission = async () => {
      try {
        const { status } = await requestTrackingPermissionsAsync();
        console.log('App Tracking Transparency permission status:', status);
        setTrackingPermissionRequested(true);
      } catch (error) {
        console.error('Error requesting tracking permission:', error);
        setTrackingPermissionRequested(true); // 即使出錯也繼續
      }
    };

    // 只有在字體載入完成後才請求權限
    if (loaded) {
      requestTrackingPermission();
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded && trackingPermissionRequested) {
      SplashScreen.hideAsync();
    }
  }, [loaded, trackingPermissionRequested]);

  useEffect(() => {
    // 只有在 ATT 權限請求完成後才註冊推送通知
    if (trackingPermissionRequested) {
      registerForPushNotificationsAsync();
    }
  }, [trackingPermissionRequested]);

  // 在 ATT 權限請求完成之前顯示載入畫面
  if (!loaded || !trackingPermissionRequested) {
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
