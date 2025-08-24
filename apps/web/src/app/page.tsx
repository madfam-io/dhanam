'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@dhanam/ui';
import Link from 'next/link';
import {
  TrendingUp,
  PiggyBank,
  Shield,
  Globe,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: PiggyBank,
      title: 'Smart Budgeting',
      description: 'Create intelligent budgets with auto-categorization and spending insights',
    },
    {
      icon: TrendingUp,
      title: 'Wealth Tracking',
      description: 'Monitor your net worth across all accounts with real-time updates',
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your data is encrypted with AES-256 and secured with 2FA',
    },
    {
      icon: Globe,
      title: 'Multi-Currency',
      description: 'Support for MXN, USD, EUR with real-time exchange rates',
    },
    {
      icon: BarChart3,
      title: 'ESG Insights',
      description: 'Track the environmental impact of your crypto investments',
    },
    {
      icon: Zap,
      title: 'Auto-Sync',
      description: 'Connect with Belvo, Plaid, and Bitso for automatic updates',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dhanam</h1>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Your Financial Life, Unified
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Track budgets, monitor wealth, and make smarter financial decisions with Dhanam&apos;s
          comprehensive platform designed for LATAM users.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to manage your finances
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow"
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-8">Trusted by thousands in LATAM</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="flex flex-col items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
            <p className="font-semibold">99.9% Uptime</p>
            <p className="text-sm text-muted-foreground">Always available when you need it</p>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
            <p className="font-semibold">Bank-Grade Security</p>
            <p className="text-sm text-muted-foreground">Your data is always encrypted</p>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
            <p className="font-semibold">No Hidden Fees</p>
            <p className="text-sm text-muted-foreground">Transparent pricing, always</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-primary/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to take control of your finances?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already managing their money smarter with Dhanam.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">© 2024 Dhanam. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
