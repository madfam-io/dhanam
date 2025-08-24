import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  budgetId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  budgetedAmount: number;

  @ApiProperty({ required: false, nullable: true })
  icon: string | null;

  @ApiProperty({ required: false, nullable: true })
  color: string | null;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  _count?: {
    transactions: number;
  };
}

export class BudgetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  spaceId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  period: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty({ required: false, nullable: true })
  endDate: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ type: [CategoryResponseDto] })
  categories: CategoryResponseDto[];
}

export class CategorySummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  budgetId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  budgetedAmount: number;

  @ApiProperty({ required: false, nullable: true })
  icon: string | null;

  @ApiProperty({ required: false, nullable: true })
  color: string | null;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ required: false })
  _count?: {
    transactions: number;
  };

  @ApiProperty()
  spent: number;

  @ApiProperty()
  remaining: number;

  @ApiProperty()
  percentUsed: number;

  @ApiProperty()
  transactionCount: number;
}

export class BudgetSummaryDto extends BudgetResponseDto {
  @ApiProperty({ type: [CategorySummaryDto] })
  declare categories: CategorySummaryDto[];

  @ApiProperty()
  summary: {
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    totalPercentUsed: number;
  };
}
