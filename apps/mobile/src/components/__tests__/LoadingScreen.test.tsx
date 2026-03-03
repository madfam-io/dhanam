import React from 'react';
import { render } from '@testing-library/react-native';

import { LoadingScreen } from '../LoadingScreen';

describe('LoadingScreen', () => {
  it('should render with default message', () => {
    const { getByText } = render(<LoadingScreen />);

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should render with custom message', () => {
    const { getByText } = render(<LoadingScreen message="Please wait..." />);

    expect(getByText('Please wait...')).toBeTruthy();
  });

  it('should render activity indicator', () => {
    const { getByTestId } = render(<LoadingScreen />);

    expect(getByTestId('activity-indicator')).toBeTruthy();
  });
});
