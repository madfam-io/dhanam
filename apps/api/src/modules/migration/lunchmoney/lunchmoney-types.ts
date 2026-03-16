// LunchMoney API v1 response types

export interface LMCategory {
  id: number;
  name: string;
  description: string | null;
  is_income: boolean;
  exclude_from_budget: boolean;
  exclude_from_totals: boolean;
  updated_at: string;
  created_at: string;
  is_group: boolean;
  group_id: number | null;
  order: number;
  children?: LMCategory[];
}

export interface LMTag {
  id: number;
  name: string;
  description: string | null;
  archived: boolean;
}

export interface LMAsset {
  id: number;
  type_name: string; // 'cash', 'credit card', 'investment', 'cryptocurrency', 'other', 'real estate', 'vehicle', 'loan', 'employee compensation'
  subtypeName: string | null;
  name: string;
  display_name: string | null;
  balance: string; // Decimal as string
  balance_as_of: string; // ISO date
  currency: string;
  institution_name: string | null;
  closed_on: string | null;
  created_at: string;
}

export interface LMPlaidAccount {
  id: number;
  date_linked: string;
  name: string;
  display_name: string | null;
  type: string;
  subtype: string | null;
  mask: string;
  institution_name: string;
  status: string;
  balance: string;
  currency: string;
  balance_last_update: string;
  limit: number | null;
}

export interface LMCrypto {
  id: number;
  zabo_account_id: number | null;
  source: string;
  name: string;
  display_name: string | null;
  balance: string;
  balance_as_of: string;
  currency: string;
  status: string;
  institution_name: string | null;
  created_at: string;
}

export interface LMTransaction {
  id: number;
  date: string; // YYYY-MM-DD
  payee: string;
  amount: string; // Decimal as string
  currency: string;
  to_base: number; // Exchange rate to base currency
  notes: string | null;
  category_id: number | null;
  category_name: string | null;
  category_group_id: number | null;
  category_group_name: string | null;
  asset_id: number | null;
  plaid_account_id: number | null;
  status: string; // 'cleared', 'uncleared', 'recurring', 'recurring_suggested', 'pending'
  parent_id: number | null;
  is_group: boolean;
  group_id: number | null;
  tags: LMTransactionTag[] | null;
  external_id: string | null;
  original_name: string | null;
  type: string | null;
  subtype: string | null;
  fees: string | null;
  price: string | null;
  quantity: string | null;
  is_pending: boolean;
  has_children: boolean;
  recurring_id: number | null;
  recurring_payee: string | null;
  recurring_description: string | null;
  recurring_cadence: string | null;
  recurring_type: string | null;
  recurring_amount: string | null;
  recurring_currency: string | null;
}

export interface LMTransactionTag {
  id: number;
  name: string;
}

export interface LMRecurringItem {
  id: number;
  start_date: string;
  end_date: string | null;
  cadence: string; // 'monthly', 'twice a month', 'once a week', 'every 3 months', 'every year', etc.
  payee: string;
  amount: string;
  currency: string;
  description: string | null;
  billing_date: string;
  type: string; // 'cleared', 'suggested', 'dismissed'
  original_name: string | null;
  source: string;
  plaid_account_id: number | null;
  asset_id: number | null;
  transaction_id: number | null;
  category_id: number | null;
}

export interface LMBudget {
  category_name: string;
  category_id: number;
  category_group_name: string | null;
  group_id: number | null;
  is_group: boolean;
  is_income: boolean;
  exclude_from_budget: boolean;
  exclude_from_totals: boolean;
  data: Record<
    string,
    {
      budget_month: string;
      budget_to_base: number;
      budget_amount: number | null;
      budget_currency: string | null;
      spending_to_base: number;
      num_transactions: number;
    }
  >;
  order: number;
  config: any;
  recurring: any;
}
