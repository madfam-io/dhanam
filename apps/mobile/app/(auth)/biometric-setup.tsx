import React, { useState, ComponentProps } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useBiometric, getBiometricTypeLabel } from '@/hooks/useBiometric';
import {
  Ionicons,
  router,
  View,
  StyleSheet,
  PaperText as Text,
  Button,
  Card,
  PaperSwitch as Switch,
} from '@/lib/react-native-compat';

export default function BiometricSetupScreen() {
  const {
    isAvailable,
    isEnrolled,
    supportedTypes,
    isEnabled,
    enableBiometric,
    disableBiometric,
    checkBiometricStatus,
  } = useBiometric();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const biometricLabel = getBiometricTypeLabel(supportedTypes);

  const handleToggleBiometric = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      if (isEnabled) {
        await disableBiometric();
      } else {
        await enableBiometric();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update biometric settings');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)/dashboard');
  };

  const handleSkip = () => {
    router.replace('/(tabs)/dashboard');
  };

  const getBiometricIcon = (): ComponentProps<typeof Ionicons>['name'] => {
    if (supportedTypes.includes(1)) return 'finger-print'; // FINGERPRINT
    if (supportedTypes.includes(2)) return 'scan-outline'; // FACIAL_RECOGNITION
    return 'shield-checkmark';
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Biometric Not Available"
          message="Your device doesn't support biometric authentication or it's not set up in your device settings."
          action={() => router.replace('/(tabs)/dashboard')}
          actionLabel="Continue"
          icon="finger-print-outline"
        />
      </View>
    );
  }

  if (!isEnrolled) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Biometric Not Set Up"
          message="Please set up biometric authentication in your device settings first, then return to enable it in Dhanam."
          action={checkBiometricStatus}
          actionLabel="Retry"
          icon="finger-print-outline"
        />
        <View style={styles.skipContainer}>
          <Button mode="text" onPress={handleSkip}>
            Skip for now
          </Button>
        </View>
      </View>
    );
  }

  if (loading) {
    return <LoadingScreen message="Setting up biometric authentication..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name={getBiometricIcon()} size={64} color="#4CAF50" />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            Secure Your Account
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Enable {biometricLabel} for quick and secure access to your Dhanam account
          </Text>
        </View>

        {/* Benefits */}
        <Card style={styles.benefitsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.benefitsTitle}>
              Benefits of {biometricLabel}
            </Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="flash" size={20} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.benefitText}>
                  Quick access to your accounts
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.benefitText}>
                  Enhanced security protection
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="eye-off" size={20} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.benefitText}>
                  No need to remember passwords
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Toggle */}
        <Card style={styles.settingCard}>
          <Card.Content>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="titleMedium" style={styles.settingTitle}>
                  Enable {biometricLabel}
                </Text>
                <Text variant="bodyMedium" style={styles.settingDescription}>
                  Use your {biometricLabel.toLowerCase()} to authenticate
                </Text>
              </View>
              <Switch value={isEnabled} onValueChange={handleToggleBiometric} disabled={loading} />
            </View>
          </Card.Content>
        </Card>

        {/* Error Display */}
        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <View style={styles.errorContent}>
                <Ionicons name="alert-circle" size={20} color="#F44336" />
                <Text variant="bodyMedium" style={styles.errorText}>
                  {error}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.continueButton}
          contentStyle={styles.buttonContent}
          disabled={loading}
        >
          Continue to Dashboard
        </Button>
        <Button mode="text" onPress={handleSkip} disabled={loading}>
          Skip for now
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#212121',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  benefitsCard: {
    marginBottom: 24,
    elevation: 2,
  },
  benefitsTitle: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    color: '#424242',
    flex: 1,
  },
  settingCard: {
    marginBottom: 16,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#757575',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    elevation: 1,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#F44336',
    flex: 1,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  continueButton: {
    paddingHorizontal: 24,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  skipContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
});
