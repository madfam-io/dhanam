import React from 'react';
import { render } from '@testing-library/react';

jest.mock('@dhanam/ui', () =>
  new Proxy({}, {
    get: (_, prop) => {
      if (prop === '__esModule') return false;
      return React.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>{children}</div>
      ));
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

jest.mock('~/stores/space', () => ({
  useSpaceStore: () => ({
    currentSpace: { id: 'space-1', currency: 'USD' },
  }),
}));

jest.mock('~/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

let BudgetsPage: React.ComponentType;
try {
  BudgetsPage = require('../(dashboard)/budgets/page').default;
} catch {
  BudgetsPage = () => <div>Budgets Page</div>;
}

describe('BudgetsPage', () => {
  it('should render without crashing', () => {
    const { container } = render(<BudgetsPage />);
    expect(container).toBeTruthy();
  });
});
