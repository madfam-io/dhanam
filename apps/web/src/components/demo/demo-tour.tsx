'use client';

import { useState, useEffect } from 'react';
import { Button } from '@dhanam/ui';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '~/lib/hooks/use-auth';

const TOUR_KEY = 'dhanam-demo-tour-seen';

const steps = [
  {
    title: 'Your Financial Command Center',
    description: 'See your net worth, accounts, budgets, and cashflow forecast all in one place.',
    emoji: '📊',
  },
  {
    title: 'Switch Personas',
    description:
      'Use the persona switcher in the header to explore different financial profiles — from a young professional to a business owner.',
    emoji: '🎭',
  },
  {
    title: 'AI-Powered Categorization',
    description:
      'Dhanam automatically categorizes your transactions using machine learning. Check the Transactions page to see it in action.',
    emoji: '🤖',
  },
  {
    title: 'Track Your Net Worth',
    description:
      'Visit Analytics to see net worth trends, spending breakdowns, and portfolio allocation across all your accounts.',
    emoji: '📈',
  },
  {
    title: 'Ready to Try It?',
    description:
      'This is a live demo with real features. Sign up to connect your own accounts and start tracking your finances.',
    emoji: '🚀',
  },
];

export function DemoTour() {
  const { user } = useAuth();
  const isDemo = user?.email?.endsWith('@dhanam.demo') ?? false;
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isDemo) return;
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) setVisible(true);
  }, [isDemo]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(TOUR_KEY, '1');
  };

  const current = steps[step]!;

  return (
    <>
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={dismiss} />

      {/* Tour card */}
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
        <div className="bg-background rounded-xl shadow-2xl border p-6">
          <div className="flex items-start justify-between mb-4">
            <span className="text-3xl">{current.emoji}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <h3 className="text-lg font-semibold mb-2">{current.title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{current.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    i === step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button size="sm" onClick={() => setStep(step + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={dismiss}>
                  Get Started
                </Button>
              )}
            </div>
          </div>

          <button
            className="mt-3 text-xs text-muted-foreground hover:text-foreground w-full text-center"
            onClick={dismiss}
          >
            Skip tour
          </button>
        </div>
      </div>
    </>
  );
}
