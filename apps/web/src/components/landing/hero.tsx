'use client';

import { Button } from '@dhanam/ui';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroProps {
  onLiveDemoClick: () => void;
  onSignUpClick: () => void;
}

export function Hero({ onLiveDemoClick, onSignUpClick }: HeroProps) {
  return (
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
          Bank accounts, crypto, real estate, collectibles, gaming assets — all in one place. With{' '}
          <strong>AI-powered budgeting</strong> and <strong>Monte Carlo simulations</strong> to show
          the probability of reaching your goals.
        </p>

        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          The tools wealth managers charge thousands for — automated and available to everyone.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            size="lg"
            onClick={onLiveDemoClick}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Try Live Demo
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={onSignUpClick} className="gap-2">
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
          <p className="text-xs text-muted-foreground">Avg. Goal Success Probability</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-card border">
          <p className="text-3xl font-bold">$1.2M</p>
          <p className="text-xs text-muted-foreground">Median Projected Nest Egg</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-card border">
          <p className="text-3xl font-bold">12</p>
          <p className="text-xs text-muted-foreground">Historical Stress Scenarios</p>
        </div>
      </div>
    </section>
  );
}
