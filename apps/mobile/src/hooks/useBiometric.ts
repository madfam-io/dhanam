import { useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BiometricState {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isEnabled: boolean;
}

interface BiometricHook extends BiometricState {
  authenticate: (reason?: string) => Promise<{ success: boolean; error?: string }>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  checkBiometricStatus: () => Promise<void>;
}

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export function useBiometric(): BiometricHook {
  const [biometricState, setBiometricState] = useState<BiometricState>({
    isAvailable: false,
    isEnrolled: false,
    supportedTypes: [],
    isEnabled: false,
  });

  const checkBiometricStatus = async () => {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnabledStorage = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      const isEnabled = isEnabledStorage === 'true' && isAvailable && isEnrolled;

      setBiometricState({
        isAvailable,
        isEnrolled,
        supportedTypes,
        isEnabled,
      });
    } catch (error) {
      console.error('Error checking biometric status:', error);
      setBiometricState({
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        isEnabled: false,
      });
    }
  };

  const authenticate = async (reason = 'Authenticate to access your account'): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!biometricState.isAvailable || !biometricState.isEnrolled) {
        return {
          success: false,
          error: 'Biometric authentication is not available or not set up',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        let error = 'Authentication failed';
        if (result.error === 'user_cancel') {
          error = 'Authentication was cancelled';
        } else if (result.error === 'user_fallback') {
          error = 'User chose to use passcode';
        } else if (result.error === 'biometric_not_available') {
          error = 'Biometric authentication is not available';
        } else if (result.error === 'biometric_not_enrolled') {
          error = 'No biometric credentials are enrolled';
        }
        return { success: false, error };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during authentication',
      };
    }
  };

  const enableBiometric = async (): Promise<void> => {
    if (!biometricState.isAvailable || !biometricState.isEnrolled) {
      throw new Error('Biometric authentication is not available or not set up');
    }

    // First authenticate to confirm the user can use biometrics
    const authResult = await authenticate('Enable biometric authentication');
    if (!authResult.success) {
      throw new Error(authResult.error || 'Authentication failed');
    }

    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    setBiometricState(prev => ({ ...prev, isEnabled: true }));
  };

  const disableBiometric = async (): Promise<void> => {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    setBiometricState(prev => ({ ...prev, isEnabled: false }));
  };

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  return {
    ...biometricState,
    authenticate,
    enableBiometric,
    disableBiometric,
    checkBiometricStatus,
  };
}

export function getBiometricTypeLabel(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris';
  }
  return 'Biometric';
}