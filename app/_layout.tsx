import React from 'react';
import { DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Text, View } from 'react-native';
import 'react-native-reanimated';

import { useBootLoader } from '@/src/hooks/useBootLoader';
import { configureNotificationHandler, requestNotificationPermissions } from '@/src/utils/notifications';
import { ToastProvider } from '@/src/components/Toast';

// Configure how notifications appear when app is foregrounded (must run at module load)
configureNotificationHandler();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

/** Neo-brutalism themed navigation — lavender background with dark navy text */
const NeoBrutLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1B1A2E',
    background: '#EDE8F5',
    card: '#EDE8F5',
    text: '#1B1A2E',
    border: '#1B1A2E',
    notification: '#E53935',
  },
};

export default function RootLayout() {
  const { isReady, isFirstLaunch, error } = useBootLoader();

  // Request notification permission after app is ready (non-blocking)
  React.useEffect(() => {
    if (isReady) {
      requestNotificationPermissions().catch(() => {});
    }
  }, [isReady]);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#EDE8F5' }}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8, color: '#1B1A2E' }}>
          Something went wrong
        </Text>
        <Text style={{ color: '#6B6880' }}>{error.message}</Text>
      </View>
    );
  }

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider value={NeoBrutLightTheme}>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#EDE8F5',
            },
            headerTitleStyle: {
              fontWeight: '800',
              color: '#1B1A2E',
            },
            headerShadowVisible: false,
            headerTintColor: '#1B1A2E',
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="habit/new"
            options={{ presentation: 'modal', title: 'New Habit' }}
          />
          <Stack.Screen
            name="habit/[id]"
            options={{ title: 'Habit Detail' }}
          />
        </Stack>
        {isFirstLaunch && <Redirect href="/onboarding" />}
      </ToastProvider>
    </ThemeProvider>
  );
}
