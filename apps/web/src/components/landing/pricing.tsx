'use client';

import { Button } from '@dhanam/ui';
import { CheckCircle } from 'lucide-react';

interface PricingProps {
  onSignUpClick: () => void;
}

export function Pricing({ onSignUpClick }: PricingProps) {
  return (
    <section className="container mx-auto px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground">
            Start free, upgrade when you need unlimited access
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <p className="text-3xl font-bold mb-4">$0</p>
            <ul className="space-y-2 text-sm mb-6">
              {[
                'Budget tracking & zero-based budgeting',
                '3 simulations per day',
                '2 connected accounts',
                'Basic goal tracking',
                'Transaction history & search',
                'ESG crypto scores',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={onSignUpClick}>
              Start Free
            </Button>
          </div>

          {/* Premium */}
          <div className="rounded-lg border-2 border-primary bg-card p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Most Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="text-3xl font-bold mb-4">
              $9.99<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <ul className="space-y-2 text-sm mb-6">
              {[
                { text: 'Everything in Free, plus:', bold: true },
                { text: 'Unlimited simulations' },
                { text: 'Unlimited connected accounts' },
                { text: '12 historical stress scenarios' },
                { text: 'AI-powered categorization & 60-day forecast' },
                { text: 'Estate planning & Life Beat' },
                { text: 'Household views (Yours / Mine / Ours)' },
                { text: 'Gaming & metaverse portfolio' },
                { text: 'Collectibles valuation' },
                { text: 'Scheduled reports & PDF/CSV export' },
                { text: 'Priority support' },
              ].map((item) => {
                const text = typeof item === 'string' ? item : item.text;
                const bold = typeof item === 'object' && item.bold;
                return (
                  <li key={text} className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    {bold ? <strong>{text}</strong> : text}
                  </li>
                );
              })}
            </ul>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={onSignUpClick}
            >
              Start 30-Day Trial
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}
