import { Transaction } from '@dhanam/shared';
import { ComponentProps } from 'react';

import {
  Ionicons,
  View,
  StyleSheet,
  List,
  PaperText as Text,
  Chip,
} from '@/lib/react-native-compat';
import { formatCurrency } from '@/utils/currency';
import { getTransactionColor, surfaceColors } from '@/tokens/colors';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  // Determine transaction type based on amount (positive = income, negative = expense)
  const transactionType = transaction.amount > 0 ? 'income' : 'expense';
  const categoryName = transaction.category?.name || 'Uncategorized';

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
        return 'cart';
      case 'utilities':
        return 'bulb';
      case 'entertainment':
        return 'game-controller';
      case 'health':
        return 'medical';
      default:
        return 'cash';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <List.Item
      title={transaction.description}
      description={
        <View style={styles.description}>
          <Text variant="bodySmall" style={styles.date}>
            {formatDate(transaction.date)}
          </Text>
          <Chip mode="flat" textStyle={styles.categoryText} style={styles.category}>
            {categoryName}
          </Chip>
        </View>
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      left={(_props: any) => (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${getTransactionColor(transactionType)}15` },
          ]}
        >
          <Ionicons
            name={getTransactionIcon(transactionType, categoryName)}
            size={20}
            color={getTransactionColor(transactionType)}
          />
        </View>
      )}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      right={(_props: any) => (
        <View style={styles.amount}>
          <Text
            variant="titleMedium"
            style={[styles.amountText, { color: getTransactionColor(transactionType) }]}
          >
            {transactionType === 'expense' ? '-' : transactionType === 'income' ? '+' : ''}
            {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
          </Text>
          {transaction.pending && (
            <Chip mode="outlined" textStyle={styles.pendingText} style={styles.pending}>
              Pending
            </Chip>
          )}
        </View>
      )}
      onPress={onPress}
      style={styles.item}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: surfaceColors.light.surface,
    paddingVertical: 8,
  },
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    color: surfaceColors.light.textSecondary,
    marginRight: 8,
  },
  category: {
    height: 20,
    backgroundColor: '#E3F2FD',
  },
  categoryText: {
    fontSize: 10,
    lineHeight: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  amount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 16,
  },
  amountText: {
    fontWeight: '600',
  },
  pending: {
    marginTop: 4,
    height: 20,
  },
  pendingText: {
    fontSize: 10,
    lineHeight: 10,
  },
});
