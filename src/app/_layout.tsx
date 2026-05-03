import '@/i18n/config';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { isGoogleMobileAdsAvailable } from '@/ads/adMob';
import { AppOpenAdsController } from '@/ads/AppOpenAdsController';
import { styles } from '@/styles/layout.styles';

export default function RootLayout() {
  useEffect(() => {
    if (!isGoogleMobileAdsAvailable()) {
      return;
    }
    const adsModule = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
    adsModule.default().initialize();
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="game" />
          <Stack.Screen name="gameover" />
          <Stack.Screen name="maze" />
          <Stack.Screen name="mazeover" />
        </Stack>
        <AppOpenAdsController />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
