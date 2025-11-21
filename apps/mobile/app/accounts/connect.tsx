import React, { ComponentProps } from 'react';

import {
  Ionicons,
  router,
  View,
  ScrollView,
  StyleSheet,
  PaperText as Text,
  Card,
  Button,
} from '@/lib/react-native-compat';

interface Provider {
  id: string;
  name: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  type: 'bank' | 'crypto' | 'investment';
  regions: string[];
}

const PROVIDERS: Provider[] = [
  {
    id: 'plaid',
    name: 'US Banks',
    description:
      'Connect your US bank accounts via Plaid (Bank of America, Chase, Wells Fargo, etc.)',
    icon: 'card',
    color: '#00D395',
    type: 'bank',
    regions: ['US'],
  },
  {
    id: 'belvo',
    name: 'Mexican Banks',
    description: 'Connect your Mexican bank accounts via Belvo (BBVA, Santander, Banorte, etc.)',
    icon: 'card-outline',
    color: '#00D2FF',
    type: 'bank',
    regions: ['MX'],
  },
  {
    id: 'bitso',
    name: 'Bitso',
    description: 'Connect your Bitso account to track cryptocurrency holdings',
    icon: 'logo-bitcoin',
    color: '#00C896',
    type: 'crypto',
    regions: ['MX', 'US'],
  },
  {
    id: 'manual',
    name: 'Manual Entry',
    description: 'Manually add crypto wallets and other accounts',
    icon: 'create',
    color: '#9C27B0',
    type: 'investment',
    regions: ['Global'],
  },
];

export default function ConnectAccountsScreen() {
  const handleConnectProvider = (providerId: string) => {
    router.push(`/accounts/connect/${providerId}` as `/accounts/connect/${string}`);
  };

  const getTypeIcon = (type: string): ComponentProps<typeof Ionicons>['name'] => {
    switch (type) {
      case 'bank':
        return 'business';
      case 'crypto':
        return 'logo-bitcoin';
      case 'investment':
        return 'trending-up';
      default:
        return 'wallet';
    }
  };

  const groupedProviders = PROVIDERS.reduce(
    (acc, provider) => {
      if (!acc[provider.type]) {
        acc[provider.type] = [];
      }
      acc[provider.type].push(provider);
      return acc;
    },
    {} as Record<string, Provider[]>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Connect Accounts
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Connect your bank accounts and crypto exchanges to automatically track your finances
          </Text>
        </View>

        {/* Security Notice */}
        <Card style={styles.securityCard}>
          <Card.Content>
            <View style={styles.securityHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              <Text variant="titleMedium" style={styles.securityTitle}>
                Bank-Level Security
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.securityText}>
              Your credentials are encrypted and stored securely. We use read-only access and never
              store your login information.
            </Text>
          </Card.Content>
        </Card>

        {/* Provider Groups */}
        {Object.entries(groupedProviders).map(([type, providers]) => (
          <View key={type} style={styles.providerGroup}>
            <View style={styles.groupHeader}>
              <Ionicons name={getTypeIcon(type)} size={20} color="#757575" />
              <Text variant="titleMedium" style={styles.groupTitle}>
                {type === 'bank' ? 'Banking' : type === 'crypto' ? 'Cryptocurrency' : 'Other'}
              </Text>
            </View>

            <View style={styles.providersList}>
              {providers.map((provider) => (
                <Card key={provider.id} style={styles.providerCard}>
                  <Card.Content>
                    <View style={styles.providerHeader}>
                      <View style={styles.providerInfo}>
                        <View
                          style={[styles.providerIcon, { backgroundColor: `${provider.color}15` }]}
                        >
                          <Ionicons name={provider.icon} size={24} color={provider.color} />
                        </View>
                        <View style={styles.providerDetails}>
                          <Text variant="titleMedium" style={styles.providerName}>
                            {provider.name}
                          </Text>
                          <Text variant="bodyMedium" style={styles.providerDescription}>
                            {provider.description}
                          </Text>
                          <View style={styles.regionsContainer}>
                            {provider.regions.map((region) => (
                              <View key={region} style={styles.regionBadge}>
                                <Text variant="bodySmall" style={styles.regionText}>
                                  {region}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>

                    <Button
                      mode="contained"
                      onPress={() => handleConnectProvider(provider.id)}
                      style={[styles.connectButton, { backgroundColor: provider.color }]}
                      contentStyle={styles.buttonContent}
                    >
                      Connect
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </View>
        ))}

        {/* Help Section */}
        <Card style={styles.helpCard}>
          <Card.Content>
            <View style={styles.helpHeader}>
              <Ionicons name="help-circle-outline" size={24} color="#2196F3" />
              <Text variant="titleMedium" style={styles.helpTitle}>
                Need Help?
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.helpText}>
              If you don&apos;t see your bank or have trouble connecting, please contact our support
              team.
            </Text>
            <Button
              mode="outlined"
              onPress={() => router.push('/support')}
              style={styles.helpButton}
              contentStyle={styles.buttonContent}
            >
              Contact Support
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontWeight: '700',
    color: '#212121',
  },
  subtitle: {
    color: '#757575',
    marginTop: 8,
    lineHeight: 22,
  },
  securityCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#E8F5E8',
    elevation: 1,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  securityTitle: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  securityText: {
    color: '#2E7D32',
    lineHeight: 20,
  },
  providerGroup: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  groupTitle: {
    color: '#424242',
    fontWeight: '600',
  },
  providersList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  providerCard: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  providerHeader: {
    marginBottom: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 4,
  },
  providerDescription: {
    color: '#757575',
    lineHeight: 20,
    marginBottom: 8,
  },
  regionsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  regionBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  regionText: {
    color: '#1976D2',
    fontSize: 10,
    fontWeight: '600',
  },
  connectButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  helpCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
    elevation: 1,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  helpTitle: {
    color: '#2196F3',
    fontWeight: '600',
  },
  helpText: {
    color: '#1565C0',
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    borderColor: '#2196F3',
  },
  bottomPadding: {
    height: 80,
  },
});
