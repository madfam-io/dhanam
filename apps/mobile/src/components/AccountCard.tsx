import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { formatCurrency } from '@/utils/currency';

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    type: string;
    institution: string;
    balance: number;
    currency: string;
  };
  onPress?: () => void;
}

export function AccountCard({ account, onPress }: AccountCardProps) {
  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
      case 'savings':
        return 'wallet';
      case 'credit':
        return 'card';
      case 'investment':
        return 'trending-up';
      case 'crypto':
        return 'logo-bitcoin';
      default:
        return 'cash';
    }
  };

  const getAccountColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
        return '#4CAF50';
      case 'savings':
        return '#2196F3';
      case 'credit':
        return '#FF9800';
      case 'investment':
        return '#9C27B0';
      case 'crypto':
        return '#FFC107';
      default:
        return '#757575';
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getAccountColor(account.type)}15` },
            ]}
          >
            <Ionicons
              name={getAccountIcon(account.type) as any}
              size={24}
              color={getAccountColor(account.type)}
            />
          </View>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.name}>
              {account.name}
            </Text>
            <Text variant="bodySmall" style={styles.institution}>
              {account.institution}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.balance}>
            {formatCurrency(account.balance, account.currency)}
          </Text>
          <Text variant="bodySmall" style={styles.type}>
            {account.type}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
  },
  institution: {
    color: '#757575',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balance: {
    fontWeight: '600',
    fontSize: 18,
  },
  type: {
    color: '#757575',
    textTransform: 'capitalize',
  },
});
