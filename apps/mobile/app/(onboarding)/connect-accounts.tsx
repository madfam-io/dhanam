import { useState, ComponentProps } from 'react';

import {
  Ionicons,
  LinearGradient,
  useRouter,
  View,
  RNText as Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from '@/lib/react-native-compat';

import { useOnboarding } from '../../src/contexts/OnboardingContext';

interface Provider {
  id: string;
  name: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  region: string;
}

const providers: Provider[] = [
  {
    id: 'belvo',
    name: 'Belvo',
    description: 'Bancos mexicanos (BBVA, Banorte, Santander, etc.)',
    icon: 'business-outline',
    color: '#00D2FF',
    region: 'MX',
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Bancos de Estados Unidos y Canada',
    icon: 'card-outline',
    color: '#00D395',
    region: 'US',
  },
  {
    id: 'bitso',
    name: 'Bitso',
    description: 'Exchange de criptomonedas',
    icon: 'logo-bitcoin',
    color: '#00C896',
    region: 'ALL',
  },
  {
    id: 'blockchain',
    name: 'Blockchain',
    description: 'Direcciones ETH, BTC o xPub (lectura publica)',
    icon: 'link-outline',
    color: '#8b5cf6',
    region: 'ALL',
  },
  {
    id: 'zapper',
    name: 'DeFi (Zapper)',
    description: 'Posiciones en Uniswap, Aave, Compound y mas',
    icon: 'layers-outline',
    color: '#7B3FE4',
    region: 'ALL',
  },
];

export default function ConnectAccountsScreen() {
  const router = useRouter();
  const { updateStep, skipStep } = useOnboarding();
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);

  const handleConnectProvider = (provider: Provider) => {
    // In a real implementation this would open the provider's OAuth flow
    // For onboarding, we mark it as selected
    setConnectedProviders((prev) =>
      prev.includes(provider.id) ? prev.filter((id) => id !== provider.id) : [...prev, provider.id]
    );
  };

  const handleContinue = async () => {
    try {
      await updateStep('first_budget', { providers: connectedProviders });
      router.push('/(onboarding)/first-budget');
    } catch (error) {
      console.error('Error saving providers:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await skipStep('connect_accounts');
      router.push('/(onboarding)/first-budget');
    } catch {
      router.push('/(onboarding)/first-budget');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="link-outline" size={36} color="white" />
          </View>
          <Text style={styles.headerTitle}>Conecta tus cuentas</Text>
          <Text style={styles.headerSubtitle}>
            Vincula tus cuentas bancarias y wallets para sincronizar automaticamente
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <Text style={styles.securityText}>
              Conexion segura y de solo lectura. Nunca podemos mover tu dinero.
            </Text>
          </View>

          {/* Provider List */}
          {providers.map((provider) => {
            const isConnected = connectedProviders.includes(provider.id);
            return (
              <TouchableOpacity
                key={provider.id}
                onPress={() => handleConnectProvider(provider)}
                style={[styles.providerCard, isConnected && styles.providerCardConnected]}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${isConnected ? 'Disconnect' : 'Connect'} ${provider.name}`}
              >
                <View style={[styles.providerIcon, { backgroundColor: `${provider.color}20` }]}>
                  <Ionicons name={provider.icon} size={24} color={provider.color} />
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <Text style={styles.providerDescription}>{provider.description}</Text>
                </View>
                <View
                  style={[
                    styles.connectBadge,
                    isConnected ? styles.connectBadgeActive : styles.connectBadgeInactive,
                  ]}
                >
                  <Ionicons
                    name={isConnected ? 'checkmark' : 'add'}
                    size={16}
                    color={isConnected ? 'white' : '#6366f1'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Manual accounts info */}
          <View style={styles.manualNote}>
            <Ionicons name="create-outline" size={18} color="#6b7280" />
            <Text style={styles.manualText}>
              Tambien puedes agregar cuentas manualmente despues desde la seccion de cuentas.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
          <Text style={styles.continueText}>
            {connectedProviders.length > 0
              ? `Continuar con ${connectedProviders.length} proveedor${connectedProviders.length > 1 ? 'es' : ''}`
              : 'Continuar'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        {connectedProviders.length === 0 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Saltar por ahora</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    padding: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#065f46',
    lineHeight: 18,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  providerCardConnected: {
    borderColor: '#6366f1',
    backgroundColor: '#f5f3ff',
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
    lineHeight: 18,
  },
  connectBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBadgeActive: {
    backgroundColor: '#6366f1',
  },
  connectBadgeInactive: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  manualNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  manualText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  actions: {
    padding: 20,
  },
  continueButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  continueText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
