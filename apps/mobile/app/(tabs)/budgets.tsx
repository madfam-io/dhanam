import { useQuery } from '@tanstack/react-query';
import { ComponentProps } from 'react';

import {
  Ionicons,
  router,
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  PaperText as Text,
  Card,
  ProgressBar,
  FAB,
  Button,
  Chip,
} from '@/lib/react-native-compat';

import { ErrorState } from '@/components/ErrorState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useSpaces } from '@/hooks/useSpaces';
import { apiClient } from '@/services/api';
import { formatCurrency } from '@/utils/currency';

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  currency: string;
  period: 'monthly' | 'weekly' | 'yearly';
  categories: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'exceeded' | 'completed';
}

export default function BudgetsScreen() {
  const { currentSpace } = useSpaces();

  const {
    data: budgets,
    isLoading,
    refetch,
    error,
  } = useQuery<Budget[]>({
    queryKey: ['budgets', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No space selected');
      return apiClient.get(`/budgets?spaceId=${currentSpace.id}`).then((res) => res.data);
    },
    enabled: !!currentSpace,
  });

  const getProgressColor = (spent: number, amount: number) => {
    const percentage = (spent / amount) * 100;
    if (percentage >= 100) return '#F44336';
    if (percentage >= 80) return '#FF9800';
    if (percentage >= 60) return '#FFC107';
    return '#4CAF50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'exceeded':
        return '#F44336';
      case 'completed':
        return '#757575';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string): ComponentProps<typeof Ionicons>['name'] => {
    switch (status) {
      case 'active':
        return 'play-circle';
      case 'exceeded':
        return 'alert-circle';
      case 'completed':
        return 'checkmark-circle';
      default:
        return 'time';
    }
  };

  const getCategoryIcon = (category: string): ComponentProps<typeof Ionicons>['name'] => {
    switch (category.toLowerCase()) {
      case 'food':
      case 'groceries':
        return 'restaurant';
      case 'transport':
        return 'car';
      case 'shopping':
        return 'bag';
      case 'entertainment':
        return 'musical-notes';
      case 'bills':
        return 'receipt';
      case 'healthcare':
        return 'medical';
      default:
        return 'wallet';
    }
  };

  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading budgets..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Budgets"
        message="Unable to fetch your budgets. Please try again."
        action={refetch}
        actionLabel="Retry"
      />
    );
  }

  if (!currentSpace) {
    return (
      <ErrorState
        title="No Space Selected"
        message="Please select a space to view budgets"
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
            Budgets
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {currentSpace.name} • {budgets?.length || 0} budgets
          </Text>
        </View>

        {/* Budget Overview */}
        {budgets && budgets.length > 0 && (
          <Card style={styles.overviewCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.overviewTitle}>
                Budget Overview
              </Text>
              <View style={styles.overviewStats}>
                <View style={styles.overviewStat}>
                  <Text variant="bodySmall" style={styles.overviewLabel}>
                    Total Budget
                  </Text>
                  <Text variant="titleMedium" style={styles.overviewValue}>
                    {formatCurrency(
                      budgets.reduce((sum, budget) => sum + budget.amount, 0),
                      budgets[0]?.currency || 'USD'
                    )}
                  </Text>
                </View>
                <View style={styles.overviewStat}>
                  <Text variant="bodySmall" style={styles.overviewLabel}>
                    Total Spent
                  </Text>
                  <Text variant="titleMedium" style={[styles.overviewValue, { color: '#F44336' }]}>
                    {formatCurrency(
                      budgets.reduce((sum, budget) => sum + budget.spent, 0),
                      budgets[0]?.currency || 'USD'
                    )}
                  </Text>
                </View>
                <View style={styles.overviewStat}>
                  <Text variant="bodySmall" style={styles.overviewLabel}>
                    Remaining
                  </Text>
                  <Text variant="titleMedium" style={[styles.overviewValue, { color: '#4CAF50' }]}>
                    {formatCurrency(
                      budgets.reduce((sum, budget) => sum + budget.remaining, 0),
                      budgets[0]?.currency || 'USD'
                    )}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Budgets List */}
        {budgets && budgets.length > 0 ? (
          <View style={styles.budgetsList}>
            {budgets.map((budget) => {
              const progressPercentage = Math.min((budget.spent / budget.amount) * 100, 100);
              const daysRemaining = getDaysRemaining(budget.endDate);

              return (
                <Card key={budget.id} style={styles.budgetCard}>
                  <Card.Content>
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetInfo}>
                        <Text variant="titleMedium" style={styles.budgetName}>
                          {budget.name}
                        </Text>
                        <View style={styles.budgetMeta}>
                          <Chip
                            mode="outlined"
                            textStyle={[
                              styles.periodChipText,
                              { color: getStatusColor(budget.status) },
                            ]}
                            style={[
                              styles.periodChip,
                              { borderColor: getStatusColor(budget.status) },
                            ]}
                          >
                            {formatPeriod(budget.period)}
                          </Chip>
                          <View style={styles.statusContainer}>
                            <Ionicons
                              name={getStatusIcon(budget.status)}
                              size={16}
                              color={getStatusColor(budget.status)}
                            />
                            <Text
                              variant="bodySmall"
                              style={[styles.statusText, { color: getStatusColor(budget.status) }]}
                            >
                              {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.budgetAmount}>
                        <Text variant="titleLarge" style={styles.budgetTotal}>
                          {formatCurrency(budget.amount, budget.currency)}
                        </Text>
                        <Text variant="bodySmall" style={styles.daysRemaining}>
                          {daysRemaining} days left
                        </Text>
                      </View>
                    </View>

                    {/* Progress */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressInfo}>
                        <Text variant="bodyMedium" style={styles.spentText}>
                          Spent: {formatCurrency(budget.spent, budget.currency)}
                        </Text>
                        <Text variant="bodySmall" style={styles.progressPercentage}>
                          {progressPercentage.toFixed(0)}%
                        </Text>
                      </View>
                      <ProgressBar
                        progress={progressPercentage / 100}
                        color={getProgressColor(budget.spent, budget.amount)}
                        style={styles.progressBar}
                      />
                      <Text variant="bodySmall" style={styles.remainingText}>
                        Remaining: {formatCurrency(budget.remaining, budget.currency)}
                      </Text>
                    </View>

                    {/* Categories */}
                    <View style={styles.categoriesContainer}>
                      <Text variant="bodyMedium" style={styles.categoriesLabel}>
                        Categories:
                      </Text>
                      <View style={styles.categoriesList}>
                        {budget.categories.slice(0, 3).map((category) => (
                          <View key={category} style={styles.categoryItem}>
                            <Ionicons name={getCategoryIcon(category)} size={16} color="#757575" />
                            <Text variant="bodySmall" style={styles.categoryText}>
                              {category}
                            </Text>
                          </View>
                        ))}
                        {budget.categories.length > 3 && (
                          <Text variant="bodySmall" style={styles.moreCategoriesText}>
                            +{budget.categories.length - 3} more
                          </Text>
                        )}
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={80} color="#E0E0E0" style={styles.emptyIcon} />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Budgets Yet
            </Text>
            <Text variant="bodyLarge" style={styles.emptyMessage}>
              Create budgets to track your spending by category and stay on top of your finances
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/budgets/create')}
              style={styles.createButton}
              contentStyle={styles.buttonContent}
            >
              Create Budget
            </Button>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FAB */}
      <FAB icon="plus" style={styles.fab} onPress={() => router.push('/budgets/create')} />
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
  overviewCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  overviewTitle: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewLabel: {
    color: '#757575',
    marginBottom: 4,
  },
  overviewValue: {
    color: '#212121',
    fontWeight: '600',
  },
  budgetsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  budgetCard: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  budgetInfo: {
    flex: 1,
    marginRight: 12,
  },
  budgetName: {
    color: '#212121',
    fontWeight: '600',
    marginBottom: 8,
  },
  budgetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  periodChip: {
    backgroundColor: '#FAFAFA',
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  budgetAmount: {
    alignItems: 'flex-end',
  },
  budgetTotal: {
    color: '#212121',
    fontWeight: '700',
  },
  daysRemaining: {
    color: '#757575',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spentText: {
    color: '#212121',
    fontWeight: '500',
  },
  progressPercentage: {
    color: '#757575',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginBottom: 4,
  },
  remainingText: {
    color: '#4CAF50',
    textAlign: 'right',
  },
  categoriesContainer: {
    gap: 8,
  },
  categoriesLabel: {
    color: '#757575',
    fontWeight: '500',
  },
  categoriesList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    color: '#757575',
  },
  moreCategoriesText: {
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
  createButton: {
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
