import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';

import { ErrorState } from '@/components/ErrorState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useSpaces } from '@/hooks/useSpaces';
import { apiClient } from '@/services/api';

export default function PlaidConnectScreen() {
  const { currentSpace } = useSpaces();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!currentSpace) {
      setError('Please select a space first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create Plaid Link token
      const linkResponse = await apiClient.post('/providers/plaid/create-link', {
        spaceId: currentSpace.id,
        userId: 'current-user', // This would come from auth context
      });

      const { linkToken } = linkResponse.data;

      // In a real app, you would use react-native-plaid-link-sdk here
      // For now, we'll simulate the process
      console.log('Opening Plaid Link with token:', linkToken);

      // Simulate Plaid Link flow
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful connection
      const mockPublicToken = 'public-sandbox-' + Math.random().toString(36).substring(7);
      const mockMetadata = {
        institution: {
          name: 'Chase',
          institution_id: 'ins_1',
        },
        accounts: [
          {
            id: 'account_1',
            name: 'Chase Checking',
            type: 'depository',
            subtype: 'checking',
          },
        ],
      };

      // Exchange public token for access token
      const exchangeResponse = await apiClient.post('/providers/plaid/exchange-token', {
        spaceId: currentSpace.id,
        publicToken: mockPublicToken,
        metadata: mockMetadata,
      });

      const { accounts } = exchangeResponse.data;

      // Navigate back with success message
      router.back();
      // You might want to show a success toast here
      console.log('Connected accounts:', accounts);
    } catch (err: any) {
      console.error('Plaid connection error:', err);
      setError(err.response?.data?.message || 'Failed to connect to Plaid');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Connecting to your bank..." />;
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
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.providerIcon}>
            <Ionicons name="card" size={40} color="#00D395" />
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            Connect US Bank Account
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Securely connect your US bank accounts through Plaid
          </Text>
        </View>

        {/* Supported Banks */}
        <Card style={styles.banksCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.banksTitle}>
              Supported Banks
            </Text>
            <Text variant="bodyMedium" style={styles.banksSubtitle}>
              Works with 11,000+ US financial institutions
            </Text>

            <View style={styles.banksList}>
              {[
                'Bank of America',
                'Chase',
                'Wells Fargo',
                'Citibank',
                'Capital One',
                'American Express',
              ].map((bank) => (
                <View key={bank} style={styles.bankItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text variant="bodyMedium" style={styles.bankText}>
                    {bank}
                  </Text>
                </View>
              ))}
              <Text variant="bodySmall" style={styles.moreBanksText}>
                + thousands more
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Security Info */}
        <Card style={styles.securityCard}>
          <Card.Content>
            <View style={styles.securityHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              <Text variant="titleMedium" style={styles.securityTitle}>
                Your Data is Secure
              </Text>
            </View>

            <View style={styles.securityFeatures}>
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={16} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.securityText}>
                  256-bit encryption
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="eye-off" size={16} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.securityText}>
                  Read-only access
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="server" size={16} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.securityText}>
                  No credentials stored
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* What We'll Import */}
        <Card style={styles.importCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.importTitle}>
              What We&apos;ll Import
            </Text>

            <View style={styles.importFeatures}>
              <View style={styles.importItem}>
                <Ionicons name="wallet" size={16} color="#2196F3" />
                <Text variant="bodyMedium" style={styles.importText}>
                  Account balances
                </Text>
              </View>
              <View style={styles.importItem}>
                <Ionicons name="receipt" size={16} color="#2196F3" />
                <Text variant="bodyMedium" style={styles.importText}>
                  Transaction history (90 days)
                </Text>
              </View>
              <View style={styles.importItem}>
                <Ionicons name="business" size={16} color="#2196F3" />
                <Text variant="bodyMedium" style={styles.importText}>
                  Account details & types
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
          disabled={loading}
        >
          Connect with Plaid
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
    backgroundColor: '#E8F5E8',
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
  banksCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  banksTitle: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 4,
  },
  banksSubtitle: {
    color: '#757575',
    marginBottom: 16,
  },
  banksList: {
    gap: 12,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankText: {
    color: '#424242',
  },
  moreBanksText: {
    color: '#757575',
    fontStyle: 'italic',
    marginTop: 8,
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
  importCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
    elevation: 1,
  },
  importTitle: {
    color: '#1565C0',
    fontWeight: '600',
    marginBottom: 16,
  },
  importFeatures: {
    gap: 12,
  },
  importItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importText: {
    color: '#1565C0',
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
    backgroundColor: '#00D395',
  },
  buttonContent: {
    paddingVertical: 12,
  },
  bottomPadding: {
    height: 20,
  },
});
