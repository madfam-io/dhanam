import React from 'react';

import { View, StyleSheet, PaperText as Text, Card, ProgressBar } from '@/lib/react-native-compat';
import { formatCurrency } from '@/utils/currency';

interface BudgetCardProps {
  name: string;
  category: string;
  spent: number;
  limit: number;
  currency?: string;
  onPress?: () => void;
}

export function BudgetCard({
  name,
  category,
  spent,
  limit,
  currency = 'USD',
  onPress,
}: BudgetCardProps) {
  const progress = Math.min(spent / limit, 1);
  const remaining = Math.max(limit - spent, 0);
  const isOver = spent > limit;

  const getProgressColor = () => {
    if (progress >= 1) return '#F44336';
    if (progress >= 0.8) return '#FF9800';
    if (progress >= 0.6) return '#FFC107';
    return '#4CAF50';
  };

  return (
    <Card
      style={styles.card}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${name} budget, ${formatCurrency(spent, currency)} of ${formatCurrency(limit, currency)} spent`}
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text variant="titleMedium" style={styles.name}>
              {name}
            </Text>
            <Text variant="bodySmall" style={styles.category}>
              {category}
            </Text>
          </View>
          <Text variant="titleMedium" style={[styles.amount, isOver && styles.amountOver]}>
            {formatCurrency(spent, currency)}
          </Text>
        </View>

        <ProgressBar progress={progress} color={getProgressColor()} style={styles.progressBar} />

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            {(progress * 100).toFixed(0)}% used
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.footerText, { color: isOver ? '#F44336' : '#4CAF50' }]}
          >
            {isOver
              ? `Over by ${formatCurrency(spent - limit, currency)}`
              : `${formatCurrency(remaining, currency)} left`}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    color: '#212121',
    fontWeight: '600',
  },
  category: {
    color: '#757575',
    marginTop: 2,
  },
  amount: {
    color: '#212121',
    fontWeight: '700',
  },
  amountOver: {
    color: '#F44336',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: '#757575',
  },
});
