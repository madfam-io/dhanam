import { useEffect } from 'react';

import {
  Stack,
  useRouter,
  useSegments,
  View,
  RNText as Text,
  RNActivityIndicator as ActivityIndicator,
  SafeAreaProvider,
} from '@/lib/react-native-compat';
import { useAuth } from '../../src/contexts/AuthContext';
import { OnboardingProvider } from '../../src/contexts/OnboardingContext';

export default function OnboardingLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    // Redirect to dashboard if already completed onboarding
    if (user?.onboardingCompleted) {
      router.replace('/(tabs)/dashboard');
      return;
    }
  }, [user, isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>Cargando...</Text>
      </View>
    );
  }

  if (!isAuthenticated || user?.onboardingCompleted) {
    return null; // Will redirect
  }

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="email-verification" />
          <Stack.Screen name="preferences" />
          <Stack.Screen name="space-setup" />
          <Stack.Screen name="connect-accounts" />
          <Stack.Screen name="first-budget" />
          <Stack.Screen name="feature-tour" />
          <Stack.Screen name="completion" />
        </Stack>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
