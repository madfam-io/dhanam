'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@dhanam/ui';
import { useAnalytics } from '@/hooks/useAnalytics';
import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  Globe,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle,
  Target,
  AlertTriangle,
  Sparkles,
  Users,
  Award,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const analytics = useAnalytics();

  // Redirect app.dhan.am visitors to login - landing page is only for www/apex domain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // If we're on the app subdomain, redirect to login (not the landing page)
      if (hostname === 'app.dhan.am') {
        if (isAuthenticated) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/login';
        }
        return;
      }
    }

    // For landing page domains (dhan.am, www.dhan.am), show normal behavior
    if (isAuthenticated) {
      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am';
      window.location.href = `${appUrl}/dashboard`;
    } else {
      analytics.trackPageView('Landing Page', '/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLiveDemoClick = async () => {
    analytics.track('live_demo_clicked', { source: 'hero_cta' });
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am';
    try {
      // Import authApi dynamically to avoid circular dependencies
      const { authApi } = await import('@/lib/api/auth');
      const { useAuth } = await import('@/lib/hooks/use-auth');

      const response = await authApi.loginAsGuest();
      useAuth.getState().setAuth(response.user, response.tokens);

      analytics.track('demo_session_started', {
        userId: response.user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      window.location.href = `${appUrl}/dashboard`;
    } catch (error) {
      console.error('Guest login failed:', error);
      analytics.track('demo_session_failed', { error: String(error) });
      // Fallback to calculator demo
      window.location.href = `${appUrl}/demo`;
    }
  };

  const handleSignUpClick = () => {
    analytics.track('signup_clicked', { source: 'landing_cta' });
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am';
    window.location.href = `${appUrl}/register`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Dhanam</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am'}/login`}>
              <Button variant="ghost">Sign In</Button>
            </a>
            <a href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am'}/register`}>
              <Button>Get Started</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Autonomous Family Office for Everyone</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Know Your Financial Future
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              With 95% Confidence
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Beyond budget tracking. Dhanam uses <strong>Monte Carlo simulation</strong> to show you
            the probability of achieving your goals—not just wishful thinking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={handleLiveDemoClick}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Try Live Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleSignUpClick} className="gap-2">
              Start Free Trial
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Instant access • No signup required • Explore full features for 1 hour
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="text-center p-4 rounded-lg bg-card border">
            <p className="text-3xl font-bold text-green-600">73%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-card border">
            <p className="text-3xl font-bold">$1.2M</p>
            <p className="text-xs text-muted-foreground">Nest Egg</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-card border">
            <p className="text-3xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">Scenarios</p>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="container mx-auto px-6 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Traditional Apps Tell You Where Your Money Went.
            <br />
            <span className="text-primary">Dhanam Tells You Where It's Going.</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Old Way */}
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-card p-6">
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold">Budget Trackers</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span> Static projections
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span> No probability
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span> Can't stress test
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span> Backward-looking
                </li>
              </ul>
            </div>

            {/* New Way */}
            <div className="rounded-lg border border-green-200 dark:border-green-900/50 bg-card p-6">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle className="h-5 w-5" />
                <h3 className="font-semibold">Dhanam</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />{' '}
                  <span>10,000 Monte Carlo iterations</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />{' '}
                  <span>73% success probability</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />{' '}
                  <span>12 market scenarios</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />{' '}
                  <span>Future-focused</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Features Financial Advisors Use</h2>
          <p className="text-muted-foreground">Now available to everyone for $9.99/month</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Monte Carlo Simulations</h3>
            <p className="text-sm text-muted-foreground">
              10,000 iterations model market uncertainty and show probability ranges
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Goal-Based Planning</h3>
            <p className="text-sm text-muted-foreground">
              Track multiple goals with probability analysis and on-track indicators
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Scenario Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Stress test against 12 historical events including 2008 recession
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Retirement Planning</h3>
            <p className="text-sm text-muted-foreground">
              Two-phase simulation shows probability of not running out of money
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">ESG Crypto Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Environmental, Social, Governance ratings for crypto assets
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Bank-Level Security</h3>
            <p className="text-sm text-muted-foreground">
              TOTP 2FA, AWS KMS encryption, Argon2id hashing—read-only access
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-6 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">Trusted by Mass Affluent & Gig Workers</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-3xl font-bold">5K+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="h-8 w-8 text-purple-600 mb-2" />
              <p className="text-3xl font-bold">100K+</p>
              <p className="text-sm text-muted-foreground">Simulations Run</p>
            </div>
            <div className="flex flex-col items-center">
              <Award className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-3xl font-bold">4.8★</p>
              <p className="text-sm text-muted-foreground">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground">
              Start free, upgrade when you need unlimited access
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> 3
                  simulations/day
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Basic goal
                  tracking
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Budget tracking
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={handleSignUpClick}>
                Start Free
              </Button>
            </div>

            <div className="rounded-lg border-2 border-primary bg-card p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Premium</h3>
              <p className="text-3xl font-bold mb-4">
                $9.99<span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />{' '}
                  <strong>Unlimited</strong> simulations
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Goal
                  probability
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> 12 scenarios
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Priority
                  support
                </li>
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                onClick={handleSignUpClick}
              >
                Start 30-Day Trial
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Know Your Financial Future?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands using probabilistic planning to reach their goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleLiveDemoClick}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Try Live Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleSignUpClick}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Globe className="h-5 w-5 text-primary" />
            <span className="font-semibold">Dhanam</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Dhanam. Autonomous Family Office for Everyone.
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
