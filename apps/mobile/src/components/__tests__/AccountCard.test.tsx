import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { AccountCard } from '../AccountCard';

const mockAccount = {
  id: 'acc-1',
  spaceId: 'space-1',
  name: 'Checking Account',
  type: 'checking',
  subtype: 'personal_checking',
  provider: 'manual',
  currency: 'USD',
  balance: 5000.5,
  lastSyncedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('AccountCard', () => {
  it('should render account name', () => {
    const { getByText } = render(<AccountCard account={mockAccount as any} />);

    expect(getByText('Checking Account')).toBeTruthy();
  });

  it('should render provider', () => {
    const { getByText } = render(<AccountCard account={mockAccount as any} />);

    expect(getByText('manual')).toBeTruthy();
  });

  it('should render formatted balance', () => {
    const { getByText } = render(<AccountCard account={mockAccount as any} />);

    expect(getByText('$5000.50')).toBeTruthy();
  });

  it('should render account type', () => {
    const { getByText } = render(<AccountCard account={mockAccount as any} />);

    expect(getByText('checking')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { UNSAFE_root } = render(
      <AccountCard account={mockAccount as any} onPress={mockOnPress} />,
    );

    // The Card wraps in a TouchableOpacity when onPress is provided
    fireEvent.press(UNSAFE_root);
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('should render correct icon for crypto account type', () => {
    const cryptoAccount = { ...mockAccount, type: 'crypto' };
    const { getByTestId } = render(<AccountCard account={cryptoAccount as any} />);

    expect(getByTestId('icon-logo-bitcoin')).toBeTruthy();
  });

  it('should render correct icon for credit account type', () => {
    const creditAccount = { ...mockAccount, type: 'credit' };
    const { getByTestId } = render(<AccountCard account={creditAccount as any} />);

    expect(getByTestId('icon-card')).toBeTruthy();
  });
});
