import { Account } from '@dhanam/shared';
import { ComponentProps } from 'react';

import { Ionicons, View, StyleSheet, Card, PaperText as Text } from '@/lib/react-native-compat';
import { getAccountColor, surfaceColors } from '@/tokens/colors';
import { formatCurrency } from '@/utils/currency';

interface AccountCardProps {
  account: Account;
  onPress?: () => void;
}

export function AccountCard({ account, onPress }: AccountCardProps) {
  const getAccountIcon = (type: string): ComponentProps<typeof Ionicons>['name'] => {
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
              name={getAccountIcon(account.type)}
              size={24}
              color={getAccountColor(account.type)}
            />
          </View>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.name}>
              {account.name}
            </Text>
            <Text variant="bodySmall" style={styles.institution}>
              {account.provider}
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
    color: surfaceColors.light.textSecondary,
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
    color: surfaceColors.light.textSecondary,
    textTransform: 'capitalize',
  },
});
