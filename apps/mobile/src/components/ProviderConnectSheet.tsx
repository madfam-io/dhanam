import React, { ComponentProps } from 'react';

import {
  Ionicons,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  PaperText as Text,
} from '@/lib/react-native-compat';

interface Provider {
  id: string;
  name: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  region: string;
}

interface ProviderConnectSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectProvider: (providerId: string) => void;
}

const providers: Provider[] = [
  {
    id: 'belvo',
    name: 'Belvo',
    description: 'Mexican banks (BBVA, Banorte, Santander)',
    icon: 'business-outline',
    color: '#00D2FF',
    region: 'MX',
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'US and Canadian banks',
    icon: 'card-outline',
    color: '#00D395',
    region: 'US',
  },
  {
    id: 'bitso',
    name: 'Bitso',
    description: 'Crypto exchange',
    icon: 'logo-bitcoin',
    color: '#00C896',
    region: 'ALL',
  },
  {
    id: 'blockchain',
    name: 'Blockchain Address',
    description: 'Track ETH, BTC, or xPub addresses',
    icon: 'link-outline',
    color: '#8b5cf6',
    region: 'ALL',
  },
  {
    id: 'zapper',
    name: 'DeFi (Zapper)',
    description: 'DeFi positions across 7 networks',
    icon: 'layers-outline',
    color: '#7B3FE4',
    region: 'ALL',
  },
  {
    id: 'manual',
    name: 'Manual Account',
    description: 'Add cash, property, or other assets',
    icon: 'create-outline',
    color: '#6b7280',
    region: 'ALL',
  },
];

export function ProviderConnectSheet({
  visible,
  onDismiss,
  onSelectProvider,
}: ProviderConnectSheetProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onDismiss} activeOpacity={1} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Connect Account
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Choose a provider to connect your accounts
          </Text>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={18} color="#10b981" />
          <Text style={styles.securityText}>
            Read-only access. We never move your money.
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              onPress={() => {
                onSelectProvider(provider.id);
                onDismiss();
              }}
              style={styles.providerRow}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Connect ${provider.name}`}
            >
              <View
                style={[styles.providerIcon, { backgroundColor: `${provider.color}20` }]}
              >
                <Ionicons name={provider.icon} size={24} color={provider.color} />
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerDescription}>{provider.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontWeight: '700',
    color: '#212121',
  },
  subtitle: {
    color: '#757575',
    marginTop: 4,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#065f46',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  providerDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
});
