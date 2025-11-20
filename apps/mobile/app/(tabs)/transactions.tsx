import { useQuery } from '@tanstack/react-query';
import { ComponentProps, useState } from 'react';

import {
  Ionicons,
  router,
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  PaperText as Text,
  Card,
  Chip,
  FAB,
  SegmentedButtons,
  Button,
  Searchbar,
} from '@/lib/react-native-compat';

import { ErrorState } from '@/components/ErrorState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useSpaces } from '@/hooks/useSpaces';
import { apiClient } from '@/services/api';
import { formatCurrency } from '@/utils/currency';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  accountName: string;
  provider: string;
  pending: boolean;
  tags?: string[];
}

export default function TransactionsScreen() {
  const { currentSpace } = useSpaces();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const {
    data: transactions,
    isLoading,
    refetch,
    error,
  } = useQuery<Transaction[]>({
    queryKey: ['transactions', currentSpace?.id, filterType, searchQuery],
    queryFn: () => {
      if (!currentSpace) throw new Error('No space selected');
      const params = new URLSearchParams({
        spaceId: currentSpace.id,
        ...(filterType !== 'all' && { type: filterType }),
        ...(searchQuery && { search: searchQuery }),
      });
      return apiClient.get(`/transactions?${params}`).then((res) => res.data);
    },
    enabled: !!currentSpace,
  });

  const getTransactionIcon = (
    type: string,
    category: string
  ): ComponentProps<typeof Ionicons>['name'] => {
    if (type === 'income') return 'arrow-down-circle';
    if (type === 'transfer') return 'swap-horizontal';

    switch (category.toLowerCase()) {
      case 'food':
      case 'groceries':
        return 'restaurant';
      case 'transport':
      case 'gas':
        return 'car';
      case 'shopping':
        return 'bag';
      case 'entertainment':
        return 'musical-notes';
      case 'bills':
      case 'utilities':
        return 'receipt';
      case 'healthcare':
        return 'medical';
      case 'investment':
        return 'trending-up';
      default:
        return 'card';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income':
        return '#4CAF50';
      case 'expense':
        return '#F44336';
      case 'transfer':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  const getCategoryChipColor = (category: string) => {
    const colors = [
      '#E3F2FD',
      '#F3E5F5',
      '#E8F5E8',
      '#FFF3E0',
      '#FFEBEE',
      '#F1F8E9',
      '#FCE4EC',
      '#E0F2F1',
    ];
    const index = category.length % colors.length;
    return colors[index];
  };

  const filteredTransactions =
    transactions?.filter((transaction) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          transaction.description.toLowerCase().includes(query) ||
          transaction.category.toLowerCase().includes(query) ||
          transaction.accountName.toLowerCase().includes(query)
        );
      }
      return true;
    }) || [];

  if (isLoading) {
    return <LoadingScreen message="Loading transactions..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Transactions"
        message="Unable to fetch your transactions. Please try again."
        action={refetch}
        actionLabel="Retry"
      />
    );
  }

  if (!currentSpace) {
    return (
      <ErrorState
        title="No Space Selected"
        message="Please select a space to view transactions"
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
            Transactions
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {currentSpace.name} • {transactions?.length || 0} transactions
          </Text>
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <Searchbar
            placeholder="Search transactions..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          <SegmentedButtons
            value={filterType}
            onValueChange={setFilterType}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expenses' },
              { value: 'transfer', label: 'Transfers' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Transactions List */}
        {filteredTransactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <Card key={transaction.id} style={styles.transactionCard}>
                <Card.Content>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionInfo}>
                      <View
                        style={[
                          styles.transactionIcon,
                          { backgroundColor: `${getTransactionColor(transaction.type)}15` },
                        ]}
                      >
                        <Ionicons
                          name={getTransactionIcon(transaction.type, transaction.category)}
                          size={20}
                          color={getTransactionColor(transaction.type)}
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text variant="titleMedium" style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                        <View style={styles.transactionMeta}>
                          <Text variant="bodySmall" style={styles.transactionAccount}>
                            {transaction.accountName}
                          </Text>
                          <Text variant="bodySmall" style={styles.transactionDate}>
                            {new Date(transaction.date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.amountText,
                          {
                            color: getTransactionColor(transaction.type),
                          },
                        ]}
                      >
                        {transaction.type === 'expense'
                          ? '-'
                          : transaction.type === 'income'
                            ? '+'
                            : ''}
                        {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                      </Text>
                      {transaction.pending && (
                        <Chip
                          mode="outlined"
                          textStyle={styles.pendingChipText}
                          style={styles.pendingChip}
                        >
                          Pending
                        </Chip>
                      )}
                    </View>
                  </View>

                  {/* Category and Tags */}
                  <View style={styles.transactionFooter}>
                    <Chip
                      mode="flat"
                      textStyle={styles.categoryChipText}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: getCategoryChipColor(transaction.category) },
                      ]}
                    >
                      {transaction.category}
                    </Chip>
                    {transaction.tags && transaction.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {transaction.tags.slice(0, 2).map((tag) => (
                          <Chip
                            key={tag}
                            mode="outlined"
                            textStyle={styles.tagChipText}
                            style={styles.tagChip}
                          >
                            {tag}
                          </Chip>
                        ))}
                        {transaction.tags.length > 2 && (
                          <Text variant="bodySmall" style={styles.moreTagsText}>
                            +{transaction.tags.length - 2} more
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={80} color="#E0E0E0" style={styles.emptyIcon} />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              {searchQuery || filterType !== 'all'
                ? 'No Matching Transactions'
                : 'No Transactions Yet'}
            </Text>
            <Text variant="bodyLarge" style={styles.emptyMessage}>
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Connect your accounts to start tracking transactions'}
            </Text>
            {!searchQuery && filterType === 'all' && (
              <Button
                mode="contained"
                onPress={() => router.push('/accounts/connect')}
                style={styles.connectButton}
                contentStyle={styles.buttonContent}
              >
                Connect Account
              </Button>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FAB */}
      <FAB icon="plus" style={styles.fab} onPress={() => router.push('/transactions/add')} />
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
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#FFFFFF',
  },
  segmentedButtons: {
    backgroundColor: '#FFFFFF',
  },
  transactionsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  transactionCard: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    color: '#212121',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAccount: {
    color: '#757575',
  },
  transactionDate: {
    color: '#757575',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontWeight: '600',
  },
  pendingChip: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  pendingChipText: {
    color: '#FF9800',
    fontSize: 10,
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 16,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#424242',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  tagChip: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E0E0E0',
  },
  tagChipText: {
    fontSize: 10,
    color: '#757575',
  },
  moreTagsText: {
    color: '#757575',
    fontStyle: 'italic',
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
