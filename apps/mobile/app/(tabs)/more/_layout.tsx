import React from 'react';

import { Stack, useColorScheme } from '@/lib/react-native-compat';
import { theme } from '@/theme';

export default function MoreLayout() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'].colors;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.onSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'More',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
        }}
      />
      <Stack.Screen
        name="goals"
        options={{
          title: 'Goals',
        }}
      />
    </Stack>
  );
}
