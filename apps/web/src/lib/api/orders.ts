import { apiClient } from './client';

export enum OrderType {
  buy = 'buy',
  sell = 'sell',
  transfer = 'transfer',
  deposit = 'deposit',
  withdraw = 'withdraw',
}

export enum OrderStatus {
  pending_verification = 'pending_verification',
  pending_execution = 'pending_execution',
  executing = 'executing',
  completed = 'completed',
  failed = 'failed',
  cancelled = 'cancelled',
  rejected = 'rejected',
}

export enum OrderPriority {
  low = 'low',
  normal = 'normal',
  high = 'high',
  critical = 'critical',
}

export enum ExecutionProvider {
  bitso = 'bitso',
  plaid = 'plaid',
  belvo = 'belvo',
  manual = 'manual',
}

export interface TransactionOrder {
  id: string;
  spaceId: string;
  userId: string;
  accountId: string;
  idempotencyKey: string;
  type: OrderType;
  status: OrderStatus;
  priority: OrderPriority;
  amount: number;
  currency: string;
  assetSymbol?: string;
  targetPrice?: number;
  toAccountId?: string;
  provider: ExecutionProvider;
  dryRun: boolean;
  otpVerified: boolean;
  goalId?: string;
  autoExecute: boolean;
  executedAmount?: number;
  executedPrice?: number;
  fees?: number;
  feeCurrency?: string;
  errorCode?: string;
  errorMessage?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  executedAt?: string;
}

export interface OrderExecution {
  id: string;
  orderId: string;
  attempt: number;
  status: string;
  providerOrderId?: string;
  executedAmount?: number;
  executedPrice?: number;
  fees?: number;
  feeCurrency?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  executionTime?: number;
}

export interface CreateOrderDto {
  accountId: string;
  idempotencyKey: string;
  type: OrderType;
  priority?: OrderPriority;
  amount: number;
  currency: string;
  assetSymbol?: string;
  targetPrice?: number;
  toAccountId?: string;
  provider: ExecutionProvider;
  dryRun?: boolean;
  goalId?: string;
  autoExecute?: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface VerifyOrderDto {
  otpCode: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  notes?: string;
}

export interface OrderFilterDto {
  type?: OrderType;
  status?: OrderStatus;
  provider?: ExecutionProvider;
  accountId?: string;
  goalId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  orders: TransactionOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface RebalancingSuggestion {
  goalId: string;
  goalName: string;
  actions: RebalancingAction[];
  summary: {
    totalActions: number;
    buyActions: number;
    sellActions: number;
    estimatedValue: number;
  };
}

export interface RebalancingAction {
  goalId: string;
  goalName: string;
  accountId: string;
  action: 'buy' | 'sell';
  amount: number;
  assetSymbol?: string;
  reason: string;
}

export interface GoalProgress {
  goalId: string;
  goalName: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  daysRemaining: number;
  monthsRemaining: number;
  requiredMonthlyContribution: number;
  onTrack: boolean;
  allocations: {
    accountId: string;
    accountName: string;
    targetPercentage: number;
    currentValue: number;
    targetValue: number;
  }[];
}

export const ordersApi = {
  // Order CRUD operations
  createOrder: async (spaceId: string, dto: CreateOrderDto): Promise<TransactionOrder> => {
    return apiClient.post<TransactionOrder>(`/spaces/${spaceId}/orders`, dto);
  },

  verifyOrder: async (
    spaceId: string,
    orderId: string,
    dto: VerifyOrderDto
  ): Promise<TransactionOrder> => {
    return apiClient.post<TransactionOrder>(`/spaces/${spaceId}/orders/${orderId}/verify`, dto);
  },

  executeOrder: async (spaceId: string, orderId: string): Promise<TransactionOrder> => {
    return apiClient.post<TransactionOrder>(`/spaces/${spaceId}/orders/${orderId}/execute`);
  },

  getOrders: async (spaceId: string, filters?: OrderFilterDto): Promise<OrderListResponse> => {
    return apiClient.get<OrderListResponse>(
      `/spaces/${spaceId}/orders`,
      filters as Record<string, unknown>
    );
  },

  getOrder: async (spaceId: string, orderId: string): Promise<TransactionOrder> => {
    return apiClient.get<TransactionOrder>(`/spaces/${spaceId}/orders/${orderId}`);
  },

  updateOrder: async (
    spaceId: string,
    orderId: string,
    dto: UpdateOrderDto
  ): Promise<TransactionOrder> => {
    return apiClient.patch<TransactionOrder>(`/spaces/${spaceId}/orders/${orderId}`, dto);
  },

  cancelOrder: async (spaceId: string, orderId: string): Promise<TransactionOrder> => {
    return apiClient.post<TransactionOrder>(`/spaces/${spaceId}/orders/${orderId}/cancel`);
  },

  getOrderExecutions: async (spaceId: string, orderId: string): Promise<OrderExecution[]> => {
    return apiClient.get<OrderExecution[]>(`/spaces/${spaceId}/orders/${orderId}/executions`);
  },

  // Goal rebalancing operations
  getGoalProgress: async (spaceId: string, goalId: string): Promise<GoalProgress> => {
    return apiClient.get<GoalProgress>(`/spaces/${spaceId}/goals/${goalId}/progress`);
  },

  suggestRebalancing: async (spaceId: string, goalId: string): Promise<RebalancingSuggestion> => {
    return apiClient.get<RebalancingSuggestion>(
      `/spaces/${spaceId}/goals/${goalId}/rebalancing/suggest`
    );
  },

  executeRebalancing: async (
    spaceId: string,
    goalId: string
  ): Promise<{ message: string; actions: RebalancingAction[] }> => {
    return apiClient.post<{ message: string; actions: RebalancingAction[] }>(
      `/spaces/${spaceId}/goals/${goalId}/rebalancing/execute`
    );
  },
};
