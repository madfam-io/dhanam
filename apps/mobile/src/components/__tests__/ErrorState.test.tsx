import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('should render title and message', () => {
    const { getByText } = render(
      <ErrorState title="Something went wrong" message="Please try again later." />
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Please try again later.')).toBeTruthy();
  });

  it('should render action button when action provided', () => {
    const mockAction = jest.fn();
    const { getByText } = render(
      <ErrorState title="Error" message="Failed to load" action={mockAction} actionLabel="Retry" />
    );

    expect(getByText('Retry')).toBeTruthy();
  });

  it('should call action when button is pressed', () => {
    const mockAction = jest.fn();
    const { getByTestId } = render(
      <ErrorState title="Error" message="Failed to load" action={mockAction} actionLabel="Retry" />
    );

    fireEvent.press(getByTestId('paper-button'));
    expect(mockAction).toHaveBeenCalled();
  });

  it('should not render action button when no action provided', () => {
    const { queryByTestId } = render(<ErrorState title="Error" message="Something failed" />);

    expect(queryByTestId('paper-button')).toBeNull();
  });

  it('should use default action label "Try Again"', () => {
    const { getByText } = render(<ErrorState title="Error" message="Failed" action={jest.fn()} />);

    expect(getByText('Try Again')).toBeTruthy();
  });
});
