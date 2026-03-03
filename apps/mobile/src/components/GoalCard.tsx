import React from 'react';

import {
  Ionicons,
  View,
  StyleSheet,
  PaperText as Text,
  Card,
  ProgressBar,
} from '@/lib/react-native-compat';
import { formatCurrency } from '@/utils/currency';

interface GoalCardProps {
  name: string;
  target: number;
  current: number;
  currency?: string;
  icon?: string;
  deadline?: string;
  onPress?: () => void;
}

export function GoalCard({
  name,
  target,
  current,
  currency = 'USD',
  icon = 'flag-outline',
  deadline,
  onPress,
}: GoalCardProps) {
  const progress = Math.min(current / target, 1);
  const remaining = Math.max(target - current, 0);
  const isComplete = current >= target;

  return (
    <Card
      style={styles.card}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${name} goal, ${formatCurrency(current, currency)} of ${formatCurrency(target, currency)}`}
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={[styles.iconContainer, isComplete && styles.iconContainerComplete]}>
            <Ionicons
              name={isComplete ? 'checkmark-circle' : (icon as any)}
              size={24}
              color={isComplete ? '#4CAF50' : '#6366f1'}
            />
          </View>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.name}>
              {name}
            </Text>
            {deadline && (
              <Text variant="bodySmall" style={styles.deadline}>
                Target: {new Date(deadline).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text variant="titleLarge" style={styles.current}>
            {formatCurrency(current, currency)}
          </Text>
          <Text variant="bodyMedium" style={styles.target}>
            of {formatCurrency(target, currency)}
          </Text>
        </View>

        <ProgressBar
          progress={progress}
          color={isComplete ? '#4CAF50' : '#6366f1'}
          style={styles.progressBar}
        />

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.progressText}>
            {(progress * 100).toFixed(0)}%
          </Text>
          <Text variant="bodySmall" style={styles.remainingText}>
            {isComplete
              ? 'Goal reached!'
              : `${formatCurrency(remaining, currency)} to go`}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconContainerComplete: {
    backgroundColor: '#E8F5E8',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#212121',
    fontWeight: '600',
  },
  deadline: {
    color: '#757575',
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  current: {
    fontWeight: '700',
    color: '#212121',
  },
  target: {
    color: '#757575',
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
  progressText: {
    color: '#757575',
    fontWeight: '600',
  },
  remainingText: {
    color: '#757575',
  },
});
