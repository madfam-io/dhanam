import React, { useState } from 'react';

import {
  View,
  StyleSheet,
  PaperText as Text,
  Card,
  SegmentedButtons,
} from '@/lib/react-native-compat';

interface ChartCardProps {
  title: string;
  periods?: Array<{ value: string; label: string }>;
  defaultPeriod?: string;
  onPeriodChange?: (period: string) => void;
  children: React.ReactNode;
}

const defaultPeriods = [
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '1y', label: '1Y' },
];

export function ChartCard({
  title,
  periods = defaultPeriods,
  defaultPeriod,
  onPeriodChange,
  children,
}: ChartCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(
    defaultPeriod || periods[0]?.value || '1m'
  );

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            {title}
          </Text>
        </View>

        {periods.length > 0 && (
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={handlePeriodChange}
            buttons={periods}
            style={styles.periodSelector}
          />
        )}

        <View style={styles.chartContainer}>{children}</View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    color: '#212121',
    fontWeight: '600',
  },
  periodSelector: {
    marginBottom: 16,
  },
  chartContainer: {
    marginVertical: 8,
  },
});
