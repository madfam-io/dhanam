import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, TextInput, HelperText } from 'react-native-paper';

import { ErrorState } from '@/components/ErrorState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useSpaces } from '@/hooks/useSpaces';
import { apiClient } from '@/services/api';

export default function BitsoConnectScreen() {
  const { currentSpace } = useSpaces();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.apiKey.trim()) {
      errors.apiKey = 'API Key is required';
    } else if (formData.apiKey.length < 10) {
      errors.apiKey = 'API Key appears to be too short';
    }

    if (!formData.apiSecret.trim()) {
      errors.apiSecret = 'API Secret is required';
    } else if (formData.apiSecret.length < 20) {
      errors.apiSecret = 'API Secret appears to be too short';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConnect = async () => {
    if (!currentSpace) {
      setError('Please select a space first');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Connect to Bitso
      const response = await apiClient.post('/providers/bitso/connect', {
        spaceId: currentSpace.id,
        apiKey: formData.apiKey.trim(),
        apiSecret: formData.apiSecret.trim(),
      });

      const { accounts, message } = response.data;

      // Navigate back with success message
      router.back();
      console.log('Connected Bitso accounts:', accounts);
      console.log('Success message:', message);
    } catch (err: any) {
      console.error('Bitso connection error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to connect to Bitso';

      if (errorMessage.includes('Invalid API')) {
        setFieldErrors({
          apiKey: 'Invalid API credentials',
          apiSecret: 'Invalid API credentials',
        });
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return <LoadingScreen message="Connecting to Bitso..." />;
  }

  if (!currentSpace) {
    return (
      <ErrorState
        title="No Space Selected"
        message="Please select a space before connecting accounts"
        action={() => router.back()}
        actionLabel="Go Back"
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.providerIcon}>
            <Ionicons name="logo-bitcoin" size={40} color="#00C896" />
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            Connect Bitso Account
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Connect your Bitso exchange account to track cryptocurrency holdings
          </Text>
        </View>

        {/* API Credentials Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.formTitle}>
              API Credentials
            </Text>
            <Text variant="bodyMedium" style={styles.formSubtitle}>
              Enter your Bitso API credentials to connect your account
            </Text>

            <View style={styles.formFields}>
              <TextInput
                label="API Key"
                value={formData.apiKey}
                onChangeText={(value) => handleInputChange('apiKey', value)}
                mode="outlined"
                error={!!fieldErrors.apiKey}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your Bitso API Key"
                style={styles.textInput}
              />
              {fieldErrors.apiKey && (
                <HelperText type="error" visible={true}>
                  {fieldErrors.apiKey}
                </HelperText>
              )}

              <TextInput
                label="API Secret"
                value={formData.apiSecret}
                onChangeText={(value) => handleInputChange('apiSecret', value)}
                mode="outlined"
                error={!!fieldErrors.apiSecret}
                secureTextEntry={!showSecret}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your Bitso API Secret"
                style={styles.textInput}
                right={
                  <TextInput.Icon
                    icon={showSecret ? 'eye-off' : 'eye'}
                    onPress={() => setShowSecret(!showSecret)}
                  />
                }
              />
              {fieldErrors.apiSecret && (
                <HelperText type="error" visible={true}>
                  {fieldErrors.apiSecret}
                </HelperText>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* How to Get API Keys */}
        <Card style={styles.instructionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.instructionsTitle}>
              How to Get API Keys
            </Text>

            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text variant="bodySmall" style={styles.stepNumberText}>
                    1
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.instructionText}>
                  Log in to your Bitso account and go to API Settings
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text variant="bodySmall" style={styles.stepNumberText}>
                    2
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.instructionText}>
                  Create a new API key with &quot;Read&quot; permissions only
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text variant="bodySmall" style={styles.stepNumberText}>
                    3
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.instructionText}>
                  Copy the API Key and Secret and paste them above
                </Text>
              </View>
            </View>

            <Button
              mode="outlined"
              onPress={() => console.log('Open Bitso API settings')}
              style={styles.instructionsButton}
              contentStyle={styles.buttonContent}
            >
              Open Bitso API Settings
            </Button>
          </Card.Content>
        </Card>

        {/* Security Info */}
        <Card style={styles.securityCard}>
          <Card.Content>
            <View style={styles.securityHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              <Text variant="titleMedium" style={styles.securityTitle}>
                Your API Keys are Secure
              </Text>
            </View>

            <View style={styles.securityFeatures}>
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={16} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.securityText}>
                  Keys are encrypted and stored securely
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="eye-off" size={16} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.securityText}>
                  Read-only access (no trading permissions)
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="refresh" size={16} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.securityText}>
                  You can revoke access anytime
                </Text>
              </View>
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

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleConnect}
          style={styles.connectButton}
          contentStyle={styles.buttonContent}
          disabled={loading || !formData.apiKey.trim() || !formData.apiSecret.trim()}
        >
          Connect Bitso Account
        </Button>
        <Button mode="text" onPress={() => router.back()} disabled={loading}>
          Cancel
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  providerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#212121',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  formTitle: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 4,
  },
  formSubtitle: {
    color: '#757575',
    marginBottom: 20,
  },
  formFields: {
    gap: 8,
  },
  textInput: {
    backgroundColor: '#FAFAFA',
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
    elevation: 1,
  },
  instructionsTitle: {
    color: '#1565C0',
    fontWeight: '600',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 16,
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  instructionText: {
    color: '#1565C0',
    flex: 1,
    lineHeight: 20,
  },
  instructionsButton: {
    borderColor: '#2196F3',
  },
  securityCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
    elevation: 1,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  securityTitle: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  securityFeatures: {
    gap: 12,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityText: {
    color: '#2E7D32',
  },
  errorCard: {
    marginHorizontal: 20,
    marginBottom: 16,
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
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  connectButton: {
    backgroundColor: '#00C896',
  },
  buttonContent: {
    paddingVertical: 12,
  },
  bottomPadding: {
    height: 20,
  },
});
