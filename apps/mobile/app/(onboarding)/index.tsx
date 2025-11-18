import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

import { useOnboarding } from '../../src/contexts/OnboardingContext';

export default function OnboardingIndex() {
  const router = useRouter();
  const { status, isLoading } = useOnboarding();

  useEffect(() => {
    if (isLoading) return;

    if (status?.completed) {
      router.replace('/(tabs)/dashboard');
      return;
    }

    // Navigate to current step or welcome
    const currentStep = status?.currentStep || 'welcome';
    router.replace(`/(onboarding)/${currentStep}`);
  }, [status, isLoading, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={{ marginTop: 16, color: '#6b7280' }}>Cargando configuración...</Text>
    </View>
  );
}
