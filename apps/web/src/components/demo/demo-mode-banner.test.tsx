import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DemoModeBanner } from './demo-mode-banner';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/hooks/use-auth');
jest.mock('@/hooks/useAnalytics');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockRouterPush = jest.fn();

describe('DemoModeBanner', () => {
  const mockAnalytics = {
    track: jest.fn(),
    trackPageView: jest.fn(),
    identify: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAnalytics.mockReturnValue(mockAnalytics as any);

    // Mock useRouter
    mockUseRouter.mockReturnValue({
      push: mockRouterPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    // Clear localStorage
    localStorage.clear();
  });

  it('should not render for non-guest users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'user@example.com', name: 'User' } as any,
      isAuthenticated: true,
    } as any);

    const { container } = render(<DemoModeBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should render for guest users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'guest', email: 'guest@dhanam.demo', name: 'Guest User' } as any,
      isAuthenticated: true,
    } as any);

    render(<DemoModeBanner />);

    expect(screen.getByText(/You're exploring Dhanam in/)).toBeInTheDocument();
    expect(screen.getByText(/Demo Mode/)).toBeInTheDocument();
  });

  it('should display session countdown timer', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'guest', email: 'guest@dhanam.demo', name: 'Guest User' } as any,
      isAuthenticated: true,
    } as any);

    render(<DemoModeBanner />);

    // Should show time in format like "59m 59s"
    await waitFor(
      () => {
        const timeElement = screen.getByText(/\d+m \d+s/);
        expect(timeElement).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should show "Sign Up Free" button', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'guest', email: 'guest@dhanam.demo', name: 'Guest User' } as any,
      isAuthenticated: true,
    } as any);

    render(<DemoModeBanner />);

    const signUpButton = screen.getByRole('button', { name: /Sign Up Free/i });
    expect(signUpButton).toBeInTheDocument();
  });

  it('should handle sign up button click', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'guest', email: 'guest@dhanam.demo', name: 'Guest User' } as any,
      isAuthenticated: true,
    } as any);

    render(<DemoModeBanner />);

    const signUpButton = screen.getByRole('button', { name: /Sign Up Free/i });
    fireEvent.click(signUpButton);

    expect(mockAnalytics.track).toHaveBeenCalledWith('demo_convert_clicked', expect.any(Object));
    expect(mockRouterPush).toHaveBeenCalledWith('/register');
  });

  it('should handle dismiss button click', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'guest', email: 'guest@dhanam.demo', name: 'Guest User' } as any,
      isAuthenticated: true,
    } as any);

    const { container } = render(<DemoModeBanner />);

    const dismissButton = screen.getByRole('button', { name: /Dismiss banner/i });
    fireEvent.click(dismissButton);

    expect(mockAnalytics.track).toHaveBeenCalledWith('demo_banner_dismissed', expect.any(Object));

    // Banner should disappear
    expect(container.firstChild).toBeNull();
  });

  it('should show expired message when time runs out', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'guest', email: 'guest@dhanam.demo', name: 'Guest User' } as any,
      isAuthenticated: true,
    } as any);

    // Set session start time to 2 hours ago (past expiration)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    localStorage.setItem('demo_session_start', twoHoursAgo.toString());

    render(<DemoModeBanner />);

    await waitFor(() => {
      const signUpButton = screen.getByRole('button', { name: /Sign Up to Continue/i });
      expect(signUpButton).toBeInTheDocument();
    });
  });

  it('should display demo features description', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'guest', email: 'guest@dhanam.demo', name: 'Guest User' } as any,
      isAuthenticated: true,
    } as any);

    render(<DemoModeBanner />);

    expect(screen.getByText(/Read-only access/)).toBeInTheDocument();
    expect(screen.getByText(/Sample data/)).toBeInTheDocument();
    expect(screen.getByText(/Full features preview/)).toBeInTheDocument();
  });

  it('should track analytics on banner dismissal with time remaining', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'guest', email: 'guest@dhanam.demo', name: 'Guest User' } as any,
      isAuthenticated: true,
    } as any);

    render(<DemoModeBanner />);

    const dismissButton = screen.getByRole('button', { name: /Dismiss banner/i });
    fireEvent.click(dismissButton);

    expect(mockAnalytics.track).toHaveBeenCalledWith('demo_banner_dismissed', {
      timeRemaining: expect.stringMatching(/\d+m \d+s/),
    });
  });

  it('should initialize session start time in localStorage on first render', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'guest', email: 'guest@dhanam.demo', name: 'Guest User' } as any,
      isAuthenticated: true,
    } as any);

    expect(localStorage.getItem('demo_session_start')).toBeNull();

    render(<DemoModeBanner />);

    // Should set session start time
    const sessionStart = localStorage.getItem('demo_session_start');
    expect(sessionStart).not.toBeNull();
    expect(parseInt(sessionStart!)).toBeGreaterThan(Date.now() - 1000); // Within last second
  });
});
