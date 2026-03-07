import React, { useState } from 'react';

import {
  Ionicons,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  PaperText as Text,
  Button,
  Chip,
  Divider,
} from '@/lib/react-native-compat';

export interface TransactionFilterValues {
  dateRange: 'week' | 'month' | '3months' | 'year' | 'custom';
  categories: string[];
  amountMin: string;
  amountMax: string;
  type: 'all' | 'income' | 'expense' | 'transfer';
}

interface TransactionFilterProps {
  visible: boolean;
  onDismiss: () => void;
  onApply: (filters: TransactionFilterValues) => void;
  initialValues?: Partial<TransactionFilterValues>;
}

const dateRanges = [
  { value: 'week' as const, label: 'This Week' },
  { value: 'month' as const, label: 'This Month' },
  { value: '3months' as const, label: '3 Months' },
  { value: 'year' as const, label: 'This Year' },
];

const defaultCategories = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Healthcare',
  'Investment',
  'Other',
];

const transactionTypes = [
  { value: 'all' as const, label: 'All' },
  { value: 'income' as const, label: 'Income' },
  { value: 'expense' as const, label: 'Expenses' },
  { value: 'transfer' as const, label: 'Transfers' },
];

export function TransactionFilter({
  visible,
  onDismiss,
  onApply,
  initialValues,
}: TransactionFilterProps) {
  const [dateRange, setDateRange] = useState<TransactionFilterValues['dateRange']>(
    initialValues?.dateRange || 'month'
  );
  const [categories, setCategories] = useState<string[]>(initialValues?.categories || []);
  const [type, setType] = useState<TransactionFilterValues['type']>(initialValues?.type || 'all');
  const [amountMin, setAmountMin] = useState(initialValues?.amountMin || '');
  const [amountMax, setAmountMax] = useState(initialValues?.amountMax || '');

  if (!visible) return null;

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const handleReset = () => {
    setDateRange('month');
    setCategories([]);
    setType('all');
    setAmountMin('');
    setAmountMax('');
  };

  const handleApply = () => {
    onApply({ dateRange, categories, amountMin, amountMax, type });
    onDismiss();
  };

  const activeFilterCount = [
    dateRange !== 'month',
    categories.length > 0,
    type !== 'all',
    amountMin !== '',
    amountMax !== '',
  ].filter(Boolean).length;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onDismiss} activeOpacity={1} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Filters
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset ({activeFilterCount})</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Transaction Type */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Type
            </Text>
            <View style={styles.chipRow}>
              {transactionTypes.map((t) => (
                <Chip
                  key={t.value}
                  selected={type === t.value}
                  onPress={() => setType(t.value)}
                  mode={type === t.value ? 'flat' : 'outlined'}
                  style={[styles.chip, type === t.value && styles.chipSelected]}
                  textStyle={type === t.value ? styles.chipTextSelected : undefined}
                >
                  {t.label}
                </Chip>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Date Range */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Date Range
            </Text>
            <View style={styles.chipRow}>
              {dateRanges.map((dr) => (
                <Chip
                  key={dr.value}
                  selected={dateRange === dr.value}
                  onPress={() => setDateRange(dr.value)}
                  mode={dateRange === dr.value ? 'flat' : 'outlined'}
                  style={[styles.chip, dateRange === dr.value && styles.chipSelected]}
                  textStyle={dateRange === dr.value ? styles.chipTextSelected : undefined}
                >
                  {dr.label}
                </Chip>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Categories */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Categories
            </Text>
            <View style={styles.chipRow}>
              {defaultCategories.map((cat) => (
                <Chip
                  key={cat}
                  selected={categories.includes(cat)}
                  onPress={() => toggleCategory(cat)}
                  mode={categories.includes(cat) ? 'flat' : 'outlined'}
                  style={[styles.chip, categories.includes(cat) && styles.chipSelected]}
                  textStyle={categories.includes(cat) ? styles.chipTextSelected : undefined}
                >
                  {cat}
                </Chip>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <Button mode="outlined" onPress={onDismiss} style={styles.cancelButton}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleApply} style={styles.applyButton}>
            Apply Filters
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontWeight: '700',
    color: '#212121',
  },
  resetText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FAFAFA',
  },
  chipSelected: {
    backgroundColor: '#6366f1',
  },
  chipTextSelected: {
    color: 'white',
  },
  divider: {
    marginHorizontal: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
});
