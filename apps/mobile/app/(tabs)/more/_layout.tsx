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
      <Stack.Screen
        name="reports"
        options={{
          title: 'Reports',
        }}
      />
      <Stack.Screen
        name="recurring"
        options={{
          title: 'Recurring Transactions',
        }}
      />
      <Stack.Screen
        name="projections"
        options={{
          title: 'Projections',
        }}
      />
      <Stack.Screen
        name="retirement"
        options={{
          title: 'Retirement Planning',
        }}
      />
      <Stack.Screen
        name="scenarios"
        options={{
          title: 'Scenario Analysis',
        }}
      />
      <Stack.Screen
        name="assets"
        options={{
          title: 'Manual Assets',
        }}
      />
      <Stack.Screen
        name="households"
        options={{
          title: 'Households',
        }}
      />
      <Stack.Screen
        name="estate-planning"
        options={{
          title: 'Estate Planning',
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: 'Help & Support',
        }}
      />
      <Stack.Screen
        name="billing"
        options={{
          title: 'Premium',
        }}
      />
    </Stack>
  );
}
