import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@dhanam/ui', () =>
  new Proxy({}, {
    get: (_, prop) => {
      if (prop === '__esModule') return false;
      return ({ children, ...props }: any) => <div {...props}>{children}</div>;
    },
  }),
);

jest.mock('@dhanam/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
    hasKey: () => true,
    getNamespace: () => ({}),
  }),
  AccountType: {},
  Currency: {},
  Provider: {},
}));

jest.mock('lucide-react', () =>
  new Proxy({}, {
    get: () => (props: any) => <span {...props} />,
  }),
);

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('@/stores/space', () => ({
  useSpaceStore: () => ({
    currentSpace: { id: 'space-1', currency: 'USD' },
  }),
}));

jest.mock('@/lib/api/accounts', () => ({
  accountsApi: { getAccounts: jest.fn(), createAccount: jest.fn() },
}));

jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/components/providers/belvo-connect', () => ({
  BelvoConnect: () => <div data-testid="belvo-connect" />,
}));

jest.mock('@/components/providers/plaid-connect', () => ({
  PlaidConnect: () => <div data-testid="plaid-connect" />,
}));

jest.mock('@/components/providers/bitso-connect', () => ({
  BitsoConnect: () => <div data-testid="bitso-connect" />,
}));

import AccountsPage from '../(dashboard)/accounts/page';

describe('AccountsPage', () => {
  it('should render without crashing', () => {
    const { container } = render(<AccountsPage />);
    expect(container).toBeTruthy();
  });
});
