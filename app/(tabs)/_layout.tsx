import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: isDark ? '#1F1D35' : '#FFFFFF',
          borderTopWidth: 2,
          borderTopColor: isDark ? '#3D3A58' : '#1B1A2E',
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: isDark ? '#141225' : '#EDE8F5',
          borderBottomWidth: 2,
          borderBottomColor: isDark ? '#3D3A58' : '#1B1A2E',
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: isDark ? '#F0ECF8' : '#1B1A2E',
        },
        headerShadowVisible: false,
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
