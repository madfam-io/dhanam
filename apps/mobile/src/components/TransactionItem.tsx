import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Text, Chip } from 'react-native-paper';

import { formatCurrency } from '@/utils/currency';

interface TransactionItemProps {
  transaction: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    category: string;
    type: 'income' | 'expense' | 'transfer';
    date: string;
    pending?: boolean;
  };
  onPress?: () => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const getTransactionIcon = (type: string, category: string) => {
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
            {transaction.category}
          </Chip>
        </View>
      }
      left={(_props) => (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${getTransactionColor(transaction.type)}15` },
          ]}
        >
          <Ionicons
            name={getTransactionIcon(transaction.type, transaction.category) as any}
            size={20}
            color={getTransactionColor(transaction.type)}
          />
        </View>
      )}
      right={(_props) => (
        <View style={styles.amount}>
          <Text
            variant="titleMedium"
            style={[styles.amountText, { color: getTransactionColor(transaction.type) }]}
          >
            {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
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
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    color: '#757575',
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
