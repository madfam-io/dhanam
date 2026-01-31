/**
 * English Budget Translations
 * Budget management, categories, tracking
 */
export const budgets = {
  // Main
  budgets: 'Budgets',
  budget: 'Budget',
  newBudget: 'New budget',
  createBudget: 'Create budget',
  editBudget: 'Edit budget',
  deleteBudget: 'Delete budget',
  budgetDetails: 'Budget details',
  myBudgets: 'My budgets',

  // Fields
  budgetName: 'Budget name',
  budgetPeriod: 'Period',
  budgetAmount: 'Budget amount',
  spentAmount: 'Spent amount',
  remainingAmount: 'Remaining amount',
  startDate: 'Start date',
  endDate: 'End date',
  rolloverUnused: 'Rollover unused',

  // Periods
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  custom: 'Custom',
  currentPeriod: 'Current period',
  nextPeriod: 'Next period',
  previousPeriod: 'Previous period',

  // Categories
  categories: 'Categories',
  category: 'Category',
  newCategory: 'New category',
  addCategory: 'Add category',
  editCategory: 'Edit category',
  deleteCategory: 'Delete category',
  categoryName: 'Category name',
  categoryBudget: 'Category budget',
  categorySpent: 'Category spent',
  categoryRemaining: 'Category remaining',
  uncategorized: 'Uncategorized',
  allCategories: 'All categories',

  // Predefined categories
  groceries: 'Groceries',
  restaurants: 'Restaurants',
  transportation: 'Transportation',
  utilities: 'Utilities',
  rent: 'Rent',
  mortgage: 'Mortgage',
  entertainment: 'Entertainment',
  healthcare: 'Healthcare',
  insurance: 'Insurance',
  education: 'Education',
  shopping: 'Shopping',
  personal: 'Personal',
  gifts: 'Gifts',
  travel: 'Travel',
  savings: 'Savings',
  investments: 'Investments',
  debt: 'Debt',
  other: 'Other',

  // Status
  onTrack: 'On track',
  overBudget: 'Over budget',
  underBudget: 'Under budget',
  budgetExceeded: 'Budget exceeded',
  warningThreshold: 'Warning threshold',

  // Progress
  progress: 'Progress',
  percentUsed: '{{percent}}% used',
  percentRemaining: '{{percent}}% remaining',
  daysRemaining: '{{days}} days remaining',
  daysInPeriod: '{{days}} days in period',

  // Alerts
  budgetAlert: 'Budget alert',
  budgetAlerts: 'Budget alerts',
  enableAlerts: 'Enable alerts',
  alertThreshold: 'Alert threshold',
  alertAt80Percent: 'Alert at 80%',
  alertAt90Percent: 'Alert at 90%',
  alertAt100Percent: 'Alert at 100%',
  customThreshold: 'Custom threshold',

  // Actions
  viewBudget: 'View budget',
  adjustBudget: 'Adjust budget',
  resetBudget: 'Reset budget',
  duplicateBudget: 'Duplicate budget',
  archiveBudget: 'Archive budget',
  restoreBudget: 'Restore budget',

  // Reports
  budgetReport: 'Budget report',
  spendingBreakdown: 'Spending breakdown',
  categoryBreakdown: 'Category breakdown',
  monthlyComparison: 'Monthly comparison',
  yearlyComparison: 'Yearly comparison',
  trend: 'Trend',
  insights: 'Insights',

  // Goals
  budgetGoals: 'Budget goals',
  savingsGoal: 'Savings goal',
  spendingLimit: 'Spending limit',
  goalProgress: 'Goal progress',
  goalAchieved: 'Goal achieved',
  onTrackToGoal: 'On track to goal',

  // Messages
  noBudgets: 'You have no budgets',
  createFirstBudget: 'Create your first budget',
  budgetCreated: 'Budget created',
  budgetUpdated: 'Budget updated',
  budgetDeleted: 'Budget deleted',
  categoryAdded: 'Category added',
  categoryUpdated: 'Category updated',
  categoryDeleted: 'Category deleted',

  // Warnings
  approachingLimit: 'Approaching limit',
  exceededLimit: 'Limit exceeded',
  youHaveSpent: 'You have spent {{amount}} of {{budget}}',
  remainingForPeriod: 'You have {{amount}} remaining for this period',
  overspentBy: 'You have overspent by {{amount}}',

  // Errors
  budgetNotFound: 'Budget not found',
  categoryNotFound: 'Category not found',
  invalidBudgetAmount: 'Invalid budget amount',
  budgetNameRequired: 'Budget name is required',
  budgetAmountRequired: 'Budget amount is required',
  categoryNameRequired: 'Category name is required',
  categoryBudgetRequired: 'Category budget is required',
  periodRequired: 'Period is required',
  startDateRequired: 'Start date is required',

  // Page-level keys (used by budgets page component)
  page: {
    title: 'Budgets',
    description: 'Manage your budgets and spending categories',
    manageRules: 'Manage Rules',
    createBudget: 'Create Budget',
    addCategory: 'Add Category',
  },
  dialog: {
    create: {
      description: 'Set up a new budget to track your spending',
    },
    addCategory: {
      description: 'Add a spending category to this budget',
    },
  },
  fields: {
    budgetName: 'Budget name',
    budgetNamePlaceholder: 'e.g. Monthly Expenses',
    period: 'Period',
    selectPeriod: 'Select a period',
    startDate: 'Start date',
    ongoing: 'Ongoing',
    categories: 'Categories',
    categoryName: 'Category name',
    categoryNamePlaceholder: 'e.g. Groceries',
    budgetAmount: 'Budget amount',
  },
  periods: {
    monthly: 'Monthly',
    weekly: 'Weekly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  },
  summary: {
    totalBudget: 'Total Budget',
    spent: 'spent',
    remaining: 'remaining',
    used: 'used',
  },
  empty: {
    title: 'No budgets yet',
    description: 'Create your first budget to start tracking your spending',
    cta: 'Create Your First Budget',
  },
  toast: {
    budgetCreated: 'Budget created successfully',
    budgetCreateFailed: 'Failed to create budget',
    categoryAdded: 'Category added successfully',
    categoryAddFailed: 'Failed to add category',
  },
  zeroBased: {
    title: 'Zero-Based Budget',
    description: 'Give every dollar a job \u2022 Envelope budgeting for {{name}}',
    addIncome: 'Add Income',
    rollover: 'Rollover',
    howItWorks: 'How it works',
    loading: 'Loading your budget...',
    errorTitle: 'Failed to load budget data',
    errorFallback: 'Please try again later',
    retry: 'Retry',
    noSpace: 'Please select a space to view your budget',
  },
} as const;
