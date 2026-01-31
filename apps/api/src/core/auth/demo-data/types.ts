export interface DemoContext {
  user: { id: string; email: string };
  personaKey: string;
  spaces: Array<{
    id: string;
    type: string;
    name: string;
    currency: string;
  }>;
  accounts: Array<{
    id: string;
    spaceId: string;
    name: string;
    type: string;
    subtype: string | null;
    currency: string;
    balance: number;
    provider: string;
    providerAccountId: string | null;
  }>;
  categories: Array<{
    id: string;
    budgetId: string;
    name: string;
    spaceId: string;
  }>;
  budgets: Array<{
    id: string;
    spaceId: string;
    name: string;
  }>;
}
