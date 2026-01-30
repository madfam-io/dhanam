'use client';

import { Button } from '@dhanam/ui';
import { ArrowRight } from 'lucide-react';

interface FinalCtaProps {
  onLiveDemoClick: () => void;
  onSignUpClick: () => void;
}

export function FinalCta({ onLiveDemoClick, onSignUpClick }: FinalCtaProps) {
  return (
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
            onClick={onLiveDemoClick}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            Try Live Demo
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={onSignUpClick}>
            Start Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
}
