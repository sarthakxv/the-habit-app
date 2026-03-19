import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // TODO: Replace with useBootLoader hook (Step 4)
    // Boot sequence: init SQLite -> run migrations -> load all data -> hydrate store
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="habit/new"
          options={{ presentation: 'modal', title: 'New Habit' }}
        />
        <Stack.Screen
          name="habit/[id]"
          options={{ title: 'Habit Detail' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
