import { render } from '@testing-library/react-native';
import React from 'react';

import { TransactionItem } from '../TransactionItem';

const mockTransaction = {
  id: 'txn-1',
  accountId: 'acc-1',
  description: 'Starbucks Coffee',
  amount: -5.75,
  currency: 'USD',
  date: new Date().toISOString(),
  pending: false,
  category: { name: 'Food' },
  merchant: 'Starbucks',
};

describe('TransactionItem', () => {
  it('should render transaction description', () => {
    const { getByText } = render(<TransactionItem transaction={mockTransaction as any} />);

    expect(getByText('Starbucks Coffee')).toBeTruthy();
  });

  it('should render category name', () => {
    const { getByText } = render(<TransactionItem transaction={mockTransaction as any} />);

    expect(getByText('Food')).toBeTruthy();
  });

  it('should render formatted amount', () => {
    const { getByText } = render(<TransactionItem transaction={mockTransaction as any} />);

    // Amount is rendered as -$5.75 for expense
    expect(getByText('-$5.75')).toBeTruthy();
  });

  it('should render "Uncategorized" when no category', () => {
    const noCategoryTxn = { ...mockTransaction, category: null };
    const { getByText } = render(<TransactionItem transaction={noCategoryTxn as any} />);

    expect(getByText('Uncategorized')).toBeTruthy();
  });

  it('should show "Pending" chip for pending transactions', () => {
    const pendingTxn = { ...mockTransaction, pending: true };
    const { getByText } = render(<TransactionItem transaction={pendingTxn as any} />);

    expect(getByText('Pending')).toBeTruthy();
  });

  it('should not show "Pending" chip for settled transactions', () => {
    const { queryByText } = render(<TransactionItem transaction={mockTransaction as any} />);

    expect(queryByText('Pending')).toBeNull();
  });

  it('should show + prefix for income transactions', () => {
    const incomeTxn = { ...mockTransaction, amount: 1000 };
    const { getByText } = render(<TransactionItem transaction={incomeTxn as any} />);

    expect(getByText('+$1000.00')).toBeTruthy();
  });

  it('should render "Today" for today date', () => {
    const { getByText } = render(<TransactionItem transaction={mockTransaction as any} />);

    expect(getByText('Today')).toBeTruthy();
  });
});
