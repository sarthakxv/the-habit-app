import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useBootLoader } from '@/src/hooks/useBootLoader';

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

const NeoBrutDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#D4C8F0',
    background: '#141225',
    card: '#141225',
    text: '#F0ECF8',
    border: '#3D3A58',
    notification: '#EF5350',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isReady, error } = useBootLoader();

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
    <ThemeProvider value={colorScheme === 'dark' ? NeoBrutDarkTheme : NeoBrutLightTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#141225' : '#EDE8F5',
          },
          headerTitleStyle: {
            fontWeight: '800',
            color: colorScheme === 'dark' ? '#F0ECF8' : '#1B1A2E',
          },
          headerShadowVisible: false,
          headerTintColor: colorScheme === 'dark' ? '#D4C8F0' : '#1B1A2E',
        }}
      >
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
