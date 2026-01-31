/**
 * English Transaction Execution Translations
 * Terms for autonomous trade execution and order management
 */
export const transactionExecution = {
  // General Terms
  transactionExecution: 'Transaction Execution',
  order: 'Order',
  orders: 'Orders',
  tradeOrder: 'Trade Order',
  tradeOrders: 'Trade Orders',
  execution: 'Execution',
  executions: 'Executions',

  // Order Types
  orderTypes: {
    buy: 'Buy',
    sell: 'Sell',
    transfer: 'Transfer',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
  },

  // Order Status
  status: {
    pending_verification: 'Pending Verification',
    pending_execution: 'Pending Execution',
    executing: 'Executing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  },

  // Order Priority
  priority: {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    critical: 'Critical',
  },

  // Execution Providers
  providers: {
    bitso: 'Bitso',
    plaid: 'Plaid',
    belvo: 'Belvo',
    manual: 'Manual',
  },

  // Actions
  createOrder: 'Create Order',
  placeOrder: 'Place Order',
  updateOrder: 'Update Order',
  cancelOrder: 'Cancel Order',
  executeOrder: 'Execute Order',
  retryOrder: 'Retry Order',
  verifyOrder: 'Verify Order',
  viewOrder: 'View Order',
  viewExecutions: 'View Executions',

  // Form Fields
  orderType: 'Order Type',
  amount: 'Amount',
  amountPlaceholder: 'e.g., 1000.00',
  currency: 'Currency',
  assetSymbol: 'Asset Symbol',
  assetSymbolPlaceholder: 'e.g., BTC, ETH',
  targetPrice: 'Target Price',
  targetPriceOptional: 'Target Price (Optional)',
  targetPricePlaceholder: 'e.g., 50000.00',

  fromAccount: 'From Account',
  toAccount: 'To Account',
  selectAccount: 'Select Account',

  provider: 'Execution Provider',
  maxSlippage: 'Max Slippage',
  maxSlippagePlaceholder: 'e.g., 3 (3%)',

  dryRunMode: 'Dry Run Mode',
  dryRunDescription: 'Simulate execution without real transactions',

  autoExecute: 'Auto Execute',
  autoExecuteDescription: 'Execute automatically after verification',

  otpCode: 'OTP Code',
  otpCodePlaceholder: '000000',

  notes: 'Notes',
  notesOptional: 'Notes (Optional)',
  notesPlaceholder: 'Additional notes about this order',

  idempotencyKey: 'Idempotency Key',
  idempotencyKeyDescription: 'Prevents duplicate orders',

  // Labels & Headers
  orderDetails: 'Order Details',
  orderSummary: 'Order Summary',
  executionDetails: 'Execution Details',
  executionHistory: 'Execution History',
  orderManagement: 'Order Management',

  orderNumber: 'Order Number',
  orderDate: 'Order Date',
  executionDate: 'Execution Date',
  executionTime: 'Execution Time',

  executedAmount: 'Executed Amount',
  executedPrice: 'Executed Price',
  executionFees: 'Execution Fees',
  totalCost: 'Total Cost',

  providerOrderId: 'Provider Order ID',
  attemptNumber: 'Attempt Number',

  // Order Limits
  orderLimits: 'Order Limits',
  dailyLimit: 'Daily Limit',
  weeklyLimit: 'Weekly Limit',
  monthlyLimit: 'Monthly Limit',
  perTransactionLimit: 'Per Transaction Limit',

  limitsRemaining: 'Limits Remaining',
  limitUsed: 'Used',
  limitAvailable: 'Available',
  limitResets: 'Resets',

  // Verification
  verificationRequired: 'Verification Required',
  verificationPending: 'Pending Verification',
  verificationComplete: 'Verification Complete',
  otpVerification: 'OTP Verification',
  enterOtpCode: 'Enter the 6-digit code from your authenticator app',

  // Execution Messages
  orderCreatedSuccess: 'Order created successfully',
  orderUpdatedSuccess: 'Order updated successfully',
  orderCancelledSuccess: 'Order cancelled successfully',
  orderVerifiedSuccess: 'Order verified successfully',
  orderExecutedSuccess: 'Order executed successfully',
  orderExecutionStarted: 'Order execution started',

  // Errors
  orderNotFound: 'Order not found',
  noAccessToOrder: 'You do not have access to this order',
  invalidOrderStatus: 'Invalid order status for this action',
  orderExpired: 'Order has expired',
  orderAlreadyExecuted: 'Order already executed',
  cannotCancelExecutingOrder: 'Cannot cancel an executing order',
  cannotUpdateExecutingOrder: 'Cannot update an executing order',

  insufficientBalance: 'Insufficient balance in account',
  exceedsOrderLimit: 'Exceeds order limit',
  exceedsDailyLimit: 'Exceeds daily limit',
  exceedsWeeklyLimit: 'Exceeds weekly limit',
  exceedsMonthlyLimit: 'Exceeds monthly limit',

  invalidOtpCode: 'Invalid OTP code',
  otpVerificationFailed: 'OTP verification failed',
  tooManyOtpAttempts: 'Too many OTP attempts. Try again later.',

  executionFailed: 'Order execution failed',
  providerUnavailable: 'Execution provider unavailable',
  marketClosed: 'Market is closed',
  priceLimitExceeded: 'Price limit exceeded',
  slippageExceeded: 'Slippage exceeded',

  idempotencyKeyConflict: 'Idempotency key already used with different request',

  // Descriptions
  createOrderDescription: 'Create a new transaction order for execution',
  highValueWarning: 'This is a high-value transaction and requires OTP verification',
  dryRunWarning: 'Dry run mode: No real transactions will be made',

  buyOrderDescription: 'Buy assets with funds from your account',
  sellOrderDescription: 'Sell assets and deposit funds to your account',
  transferOrderDescription: 'Transfer funds between your accounts',
  depositOrderDescription: 'Deposit funds from external source',
  withdrawOrderDescription: 'Withdraw funds to external account',

  // Goal-Driven Execution
  goalDrivenExecution: 'Goal-Driven Execution',
  linkedToGoal: 'Linked to Goal',
  goalName: 'Goal Name',
  goalProgress: 'Goal Progress',
  autoRebalancing: 'Auto Rebalancing',

  // Audit & Security
  auditTrail: 'Audit Trail',
  securityVerification: 'Security Verification',
  ipAddress: 'IP Address',
  userAgent: 'User Agent',
  requestTimestamp: 'Request Timestamp',
  verificationTimestamp: 'Verification Timestamp',
  executionTimestamp: 'Execution Timestamp',

  // Provider Responses
  providerResponse: 'Provider Response',
  providerRequest: 'Provider Request',
  errorCode: 'Error Code',
  errorMessage: 'Error Message',
  rawResponse: 'Raw Response',

  // Dry Run Results
  dryRunResults: 'Dry Run Results',
  simulatedExecution: 'Simulated Execution',
  simulatedPrice: 'Simulated Price',
  simulatedFees: 'Simulated Fees',
  simulatedSlippage: 'Simulated Slippage',
  estimatedTotal: 'Estimated Total',

  // Statistics
  totalOrders: 'Total Orders',
  pendingOrders: 'Pending Orders',
  completedOrders: 'Completed Orders',
  failedOrders: 'Failed Orders',
  cancelledOrders: 'Cancelled Orders',

  totalVolume: 'Total Volume',
  totalFees: 'Total Fees',
  successRate: 'Success Rate',
  averageExecutionTime: 'Average Execution Time',

  // Filters
  filterByStatus: 'Filter by Status',
  filterByType: 'Filter by Type',
  filterByAccount: 'Filter by Account',
  filterByGoal: 'Filter by Goal',
  filterByDate: 'Filter by Date',

  allOrders: 'All Orders',
  myOrders: 'My Orders',
  recentOrders: 'Recent Orders',

  // Tooltips & Help
  whatIsTransactionExecution: 'What is transaction execution?',
  transactionExecutionExplanation:
    'Transaction execution allows you to buy, sell, and transfer assets automatically through connected providers.',

  idempotencyHelp:
    'Idempotency key prevents accidental duplicate orders. Use the same key to retry a failed request.',
  slippageHelp:
    'Slippage is the difference between expected and execution price. Set a maximum to protect from price changes.',
  dryRunHelp:
    'Dry run mode simulates execution without real transactions. Use it to test your strategy.',
  autoExecuteHelp:
    'When enabled, the order will execute automatically after verification without manual action.',
  targetPriceHelp:
    'Limit price: Order will only execute at this price or better. Leave blank for market order.',

  // Premium Features
  premiumFeature: 'Premium Feature',
  premiumRequired: 'This feature requires a premium subscription',
  upgradeToExecute: 'Upgrade to Premium to execute transactions',
  upgradeToPremium: 'Upgrade to Premium',

  // Regulatory
  regulatoryDisclaimer: 'Regulatory Disclaimer',
  regulatoryDisclaimerText:
    'Transaction execution is subject to terms and conditions. Transactions may take time to process and are subject to provider fees.',
  acceptDisclaimer: 'I accept the regulatory disclaimer',

  tradingRisks: 'Trading Risks',
  tradingRisksText:
    'Trading carries risks. Values can go up or down. You may lose some or all of your investment.',

  // Notifications
  orderPending: 'Your order is pending verification',
  orderExecuting: 'Your order is executing',
  orderCompleted: 'Your order completed successfully',
  orderFailed: 'Your order failed. Check details for more information.',
  orderCancelled: 'Your order was cancelled',

  // Time & Date
  submittedAt: 'Submitted',
  verifiedAt: 'Verified',
  executedAt: 'Executed',
  completedAt: 'Completed',
  cancelledAt: 'Cancelled',
  expiresAt: 'Expires',

  // Currencies & Assets
  fiatCurrency: 'Fiat Currency',
  cryptocurrency: 'Cryptocurrency',
  stock: 'Stock',
  etf: 'ETF',
};
