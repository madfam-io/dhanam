import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { styles } from '@/styles/auth';
import { validateEmail } from '@/utils/validation';

export default function LoginScreen() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    totpCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && isEnrolled);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (showTwoFactor && !formData.totpCode) {
      newErrors.totpCode = '2FA code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(formData);
      router.replace('/(tabs)/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage?.includes('2FA') || errorMessage?.includes('TOTP')) {
        setShowTwoFactor(true);
      } else {
        Alert.alert('Login Failed', errorMessage || 'Please check your credentials and try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in with biometrics',
        fallbackLabel: 'Use password instead',
      });

      if (result.success) {
        // Load saved credentials from secure storage
        // This would be implemented with expo-secure-store
        Alert.alert('Success', 'Biometric authentication successful');
        router.replace('/(tabs)/dashboard');
      }
    } catch {
      Alert.alert('Authentication Failed', 'Unable to authenticate with biometrics');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <Text variant="headlineMedium" style={styles.formTitle}>
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={styles.formSubtitle}>
            Sign in to your account to continue
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              error={!!errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              left={<TextInput.Icon icon="email-outline" />}
            />
            {errors.email && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.email}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={!showPassword}
              error={!!errors.password}
              style={styles.input}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            {errors.password && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.password}
              </Text>
            )}
          </View>

          {showTwoFactor && (
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="2FA Code"
                value={formData.totpCode}
                onChangeText={(text) => setFormData({ ...formData, totpCode: text })}
                error={!!errors.totpCode}
                keyboardType="numeric"
                maxLength={6}
                style={styles.input}
                left={<TextInput.Icon icon="shield-key-outline" />}
              />
              {errors.totpCode && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.totpCode}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.helperText}>
                Enter the 6-digit code from your authenticator app
              </Text>
            </View>
          )}

          <View style={styles.optionsRow}>
            <View style={styles.checkboxRow}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text variant="bodyMedium">Remember me</Text>
            </View>

            <Button mode="text" onPress={() => router.push('/(auth)/forgot-password')} compact>
              Forgot Password?
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          {biometricAvailable && (
            <Button
              mode="outlined"
              onPress={handleBiometricLogin}
              style={styles.biometricButton}
              contentStyle={styles.buttonContent}
              icon={() => <Ionicons name="finger-print" size={20} />}
            >
              Use Biometric Authentication
            </Button>
          )}

          <View style={styles.divider}>
            <Text variant="bodyMedium" style={styles.dividerText}>
              Don&apos;t have an account?
            </Text>
            <Button mode="text" onPress={() => router.push('/(auth)/register')}>
              Sign Up
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
