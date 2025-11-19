import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export enum Currency {
  USD = 'USD',
  MXN = 'MXN',
  EUR = 'EUR',
  GBP = 'GBP',
  BTC = 'BTC',
  ETH = 'ETH',
}

export enum OrderType {
  buy = 'buy',
  sell = 'sell',
  transfer = 'transfer',
  deposit = 'deposit',
  withdraw = 'withdraw',
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

export class CreateOrderDto {
  @IsUUID()
  accountId: string;

  @IsString()
  idempotencyKey: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsEnum(OrderPriority)
  @IsOptional()
  priority?: OrderPriority;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsString()
  @IsOptional()
  assetSymbol?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  targetPrice?: number;

  @IsUUID()
  @IsOptional()
  toAccountId?: string; // For transfer orders

  @IsEnum(ExecutionProvider)
  provider: ExecutionProvider;

  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  maxSlippage?: number;

  @IsUUID()
  @IsOptional()
  goalId?: string;

  @IsBoolean()
  @IsOptional()
  autoExecute?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: any;
}
