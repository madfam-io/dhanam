import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '@/app/page';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { authApi } from '@/lib/api/auth';

// Mock dependencies
jest.mock('@/lib/hooks/use-auth');
jest.mock('@/hooks/useAnalytics');
jest.mock('@/lib/api/auth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>;
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

describe('Landing Page Demo Flow', () => {
  const mockRouterPush = jest.fn();
  const mockAnalytics = {
    track: jest.fn(),
    trackPageView: jest.fn(),
    identify: jest.fn(),
  };

  const mockGuestUser = {
    id: 'guest-123',
    email: 'guest@dhanam.demo',
    name: 'Guest User',
    locale: 'en' as const,
    timezone: 'UTC',
    emailVerified: true,
    onboardingCompleted: true,
  };

  const mockGuestTokens = {
    accessToken: 'guest-access-token',
    refreshToken: 'guest-refresh-token',
    expiresIn: 3600,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup router mock
    const { useRouter } = require('next/navigation');
    useRouter.mockReturnValue({
      push: mockRouterPush,
      replace: jest.fn(),
      refresh: jest.fn(),
    });

    // Setup analytics mock
    mockUseAnalytics.mockReturnValue(mockAnalytics as any);

    // Default: unauthenticated user
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      setAuth: jest.fn(),
    } as any);
  });

  describe('Landing Page Rendering', () => {
    it('should render the landing page with hero section', () => {
      render(<HomePage />);

      expect(screen.getByText(/Know Your Financial Future/i)).toBeInTheDocument();
      expect(screen.getByText(/With 95% Confidence/i)).toBeInTheDocument();
    });

    it('should render "Try Live Demo" button', () => {
      render(<HomePage />);

      const demoButton = screen.getByRole('button', { name: /Try Live Demo/i });
      expect(demoButton).toBeInTheDocument();
    });

    it('should render "Start Free Trial" button', () => {
      render(<HomePage />);

      const signUpButton = screen.getByRole('button', { name: /Start Free Trial/i });
      expect(signUpButton).toBeInTheDocument();
    });

    it('should show demo benefits text', () => {
      render(<HomePage />);

      expect(screen.getByText(/Instant access/i)).toBeInTheDocument();
      expect(screen.getByText(/No signup required/i)).toBeInTheDocument();
      expect(screen.getByText(/Explore full features for 1 hour/i)).toBeInTheDocument();
    });
  });

  describe('Demo Flow Interaction', () => {
    it('should track analytics when "Try Live Demo" is clicked', async () => {
      mockAuthApi.loginAsGuest.mockResolvedValue({
        user: mockGuestUser,
        tokens: mockGuestTokens,
        message: 'Guest session created',
      });

      render(<HomePage />);

      const demoButton = screen.getByRole('button', { name: /Try Live Demo/i });
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(mockAnalytics.track).toHaveBeenCalledWith('live_demo_clicked', {
          source: 'hero_cta',
        });
      });
    });

    it('should call guest authentication API when demo button is clicked', async () => {
      mockAuthApi.loginAsGuest.mockResolvedValue({
        user: mockGuestUser,
        tokens: mockGuestTokens,
        message: 'Guest session created',
      });

      render(<HomePage />);

      const demoButton = screen.getByRole('button', { name: /Try Live Demo/i });
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(mockAuthApi.loginAsGuest).toHaveBeenCalled();
      });
    });

    it('should redirect to dashboard after successful guest login', async () => {
      mockAuthApi.loginAsGuest.mockResolvedValue({
        user: mockGuestUser,
        tokens: mockGuestTokens,
        message: 'Guest session created',
      });

      render(<HomePage />);

      const demoButton = screen.getByRole('button', { name: /Try Live Demo/i });
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should track demo session start analytics', async () => {
      mockAuthApi.loginAsGuest.mockResolvedValue({
        user: mockGuestUser,
        tokens: mockGuestTokens,
        message: 'Guest session created',
      });

      render(<HomePage />);

      const demoButton = screen.getByRole('button', { name: /Try Live Demo/i });
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(mockAnalytics.track).toHaveBeenCalledWith('demo_session_started', {
          userId: mockGuestUser.id,
          expiresAt: expect.any(Date),
        });
      });
    });

    it('should fallback to calculator demo on guest login failure', async () => {
      mockAuthApi.loginAsGuest.mockRejectedValue(new Error('Guest login failed'));

      render(<HomePage />);

      const demoButton = screen.getByRole('button', { name: /Try Live Demo/i });
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(mockAnalytics.track).toHaveBeenCalledWith('demo_session_failed', {
          error: 'Error: Guest login failed',
        });
      });

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/demo');
      });
    });
  });

  describe('Sign Up Flow', () => {
    it('should navigate to registration when "Start Free Trial" is clicked', () => {
      render(<HomePage />);

      const signUpButton = screen.getByRole('button', { name: /Start Free Trial/i });
      fireEvent.click(signUpButton);

      expect(mockAnalytics.track).toHaveBeenCalledWith('signup_clicked', {
        source: 'landing_cta',
      });
      expect(mockRouterPush).toHaveBeenCalledWith('/register');
    });
  });

  describe('Authenticated User Redirect', () => {
    it('should redirect authenticated users to dashboard', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com', name: 'User' } as any,
        isAuthenticated: true,
      } as any);

      render(<HomePage />);

      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should not redirect unauthenticated users', () => {
      render(<HomePage />);

      expect(mockRouterPush).not.toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Feature Sections', () => {
    it('should render features grid', () => {
      render(<HomePage />);

      expect(screen.getByText(/Monte Carlo Simulations/i)).toBeInTheDocument();
      expect(screen.getByText(/Goal-Based Planning/i)).toBeInTheDocument();
      expect(screen.getByText(/Scenario Analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/ESG Crypto Scoring/i)).toBeInTheDocument();
    });

    it('should render pricing section', () => {
      render(<HomePage />);

      expect(screen.getByText(/Simple Pricing/i)).toBeInTheDocument();
      expect(screen.getByText(/Free/i)).toBeInTheDocument();
      expect(screen.getByText(/Premium/i)).toBeInTheDocument();
    });

    it('should render social proof section', () => {
      render(<HomePage />);

      expect(screen.getByText(/5K\+/i)).toBeInTheDocument(); // Active Users
      expect(screen.getByText(/100K\+/i)).toBeInTheDocument(); // Simulations Run
    });
  });

  describe('Multiple CTA Buttons', () => {
    it('should have multiple "Try Live Demo" CTAs throughout the page', () => {
      render(<HomePage />);

      // Should have at least 2 demo buttons (hero + bottom CTA)
      const demoButtons = screen.getAllByRole('button', { name: /Try Live Demo/i });
      expect(demoButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should have all demo buttons trigger the same flow', async () => {
      mockAuthApi.loginAsGuest.mockResolvedValue({
        user: mockGuestUser,
        tokens: mockGuestTokens,
        message: 'Guest session created',
      });

      render(<HomePage />);

      const demoButtons = screen.getAllByRole('button', { name: /Try Live Demo/i });

      // Click the second demo button (bottom CTA)
      fireEvent.click(demoButtons[1]!);

      await waitFor(() => {
        expect(mockAuthApi.loginAsGuest).toHaveBeenCalled();
      });
    });
  });

  describe('Page Analytics', () => {
    it('should track page view on mount', () => {
      render(<HomePage />);

      expect(mockAnalytics.trackPageView).toHaveBeenCalledWith('Landing Page', '/');
    });

    it('should not track page view for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com' } as any,
        isAuthenticated: true,
      } as any);

      render(<HomePage />);

      expect(mockAnalytics.trackPageView).not.toHaveBeenCalled();
    });
  });
});
