import { useQuery } from '@tanstack/react-query';
import { ComponentProps } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useSpaces } from '@/hooks/useSpaces';
import {
  Ionicons,
  router,
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  PaperText as Text,
  Card,
  FAB,
  Button,
} from '@/lib/react-native-compat';
import { apiClient } from '@/services/api';
import { formatCurrency } from '@/utils/currency';

interface Account {
  id: string;
  name: string;
  type: string;
  provider: string;
  currency: string;
  balance: number;
  lastSyncedAt: string;
}

export default function AccountsScreen() {
  const { currentSpace } = useSpaces();

  const {
    data: accounts,
    isLoading,
    refetch,
    error,
  } = useQuery<Account[]>({
    queryKey: ['accounts', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No space selected');
      return apiClient.get(`/accounts?spaceId=${currentSpace.id}`).then((res) => res.data);
    },
    enabled: !!currentSpace,
  });

  const getAccountIcon = (type: string): ComponentProps<typeof Ionicons>['name'] => {
    switch (type) {
      case 'checking':
      case 'savings':
        return 'card-outline';
      case 'credit':
        return 'card';
      case 'crypto':
        return 'logo-bitcoin';
      case 'investment':
        return 'trending-up';
      default:
        return 'wallet-outline';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'belvo':
        return '#00D2FF';
      case 'plaid':
        return '#00D395';
      case 'bitso':
        return '#00C896';
      default:
        return '#757575';
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading accounts..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Accounts"
        message="Unable to fetch your accounts. Please try again."
        action={refetch}
        actionLabel="Retry"
      />
    );
  }

  if (!currentSpace) {
    return (
      <ErrorState
        title="No Space Selected"
        message="Please select a space to view accounts"
        action={() => router.push('/spaces')}
        actionLabel="Select Space"
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Accounts
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {currentSpace.name} • {accounts?.length || 0} accounts
          </Text>
        </View>

        {/* Accounts List */}
        {accounts && accounts.length > 0 ? (
          <View style={styles.accountsList}>
            {accounts.map((account) => (
              <Card key={account.id} style={styles.accountCard}>
                <Card.Content>
                  <View style={styles.accountHeader}>
                    <View style={styles.accountInfo}>
                      <View style={styles.accountIconContainer}>
                        <Ionicons name={getAccountIcon(account.type)} size={24} color="#4CAF50" />
                      </View>
                      <View style={styles.accountDetails}>
                        <Text variant="titleMedium" style={styles.accountName}>
                          {account.name}
                        </Text>
                        <View style={styles.accountMeta}>
                          <Text variant="bodySmall" style={styles.accountType}>
                            {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                          </Text>
                          <View
                            style={[
                              styles.providerBadge,
                              { backgroundColor: getProviderColor(account.provider) },
                            ]}
                          >
                            <Text variant="bodySmall" style={styles.providerText}>
                              {account.provider.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.accountBalance}>
                      <Text variant="titleLarge" style={styles.balanceAmount}>
                        {formatCurrency(account.balance, account.currency)}
                      </Text>
                      <Text variant="bodySmall" style={styles.lastSync}>
                        Last sync: {new Date(account.lastSyncedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={80} color="#E0E0E0" style={styles.emptyIcon} />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Accounts Yet
            </Text>
            <Text variant="bodyLarge" style={styles.emptyMessage}>
              Connect your bank accounts and crypto exchanges to start tracking your finances
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/accounts/connect')}
              style={styles.connectButton}
              contentStyle={styles.buttonContent}
            >
              Connect Account
            </Button>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FAB */}
      <FAB icon="plus" style={styles.fab} onPress={() => router.push('/accounts/connect')} />
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
    marginTop: 4,
  },
  accountsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  accountCard: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    color: '#212121',
    marginBottom: 4,
  },
  accountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountType: {
    color: '#757575',
  },
  providerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  providerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontWeight: '700',
    color: '#212121',
  },
  lastSync: {
    color: '#757575',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#212121',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#757575',
    marginBottom: 32,
    lineHeight: 24,
  },
  connectButton: {
    paddingHorizontal: 24,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
