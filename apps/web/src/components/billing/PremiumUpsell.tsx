'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PremiumUpsellProps {
  feature?: string;
  context?: 'limit_reached' | 'feature_locked' | 'generic';
}

export function PremiumUpsell({ feature, context = 'generic' }: PremiumUpsellProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/billing/upgrade');
  };

  const getTitle = () => {
    switch (context) {
      case 'limit_reached':
        return 'Daily Limit Reached';
      case 'feature_locked':
        return `Unlock ${feature || 'Premium Features'}`;
      default:
        return 'Upgrade to Premium';
    }
  };

  const getDescription = () => {
    switch (context) {
      case 'limit_reached':
        return `You've used your daily free simulations. Upgrade for unlimited access.`;
      case 'feature_locked':
        return `${feature || 'This feature'} is available exclusively for Premium members.`;
      default:
        return 'Get unlimited access to all features and unlock your financial potential.';
    }
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>{getTitle()}</CardTitle>
          <Badge className="ml-auto bg-gradient-to-r from-blue-600 to-purple-600">
            Premium
          </Badge>
        </div>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Features List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Premium Benefits:</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong>Unlimited Monte Carlo Simulations</strong>
                <br />
                <span className="text-muted-foreground">
                  Run as many financial projections as you need
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong>Advanced Goal Probability Tracking</strong>
                <br />
                <span className="text-muted-foreground">
                  Calculate success probability for all your financial goals
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong>Retirement Planning Tools</strong>
                <br />
                <span className="text-muted-foreground">
                  Two-phase simulation with withdrawal projections
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong>Scenario Analysis</strong>
                <br />
                <span className="text-muted-foreground">
                  Stress test your portfolio against market crashes
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong>Advanced Visualizations</strong>
                <br />
                <span className="text-muted-foreground">
                  Interactive charts and confidence intervals
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong>Priority Support</strong>
                <br />
                <span className="text-muted-foreground">
                  Get help from our team within 24 hours
                </span>
              </span>
            </li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">$9.99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleUpgrade}
          size="lg"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Zap className="mr-2 h-5 w-5" />
          Upgrade to Premium Now
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Join thousands of users making smarter financial decisions
        </p>
      </CardContent>
    </Card>
  );
}
