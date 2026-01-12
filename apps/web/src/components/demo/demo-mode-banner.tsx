'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@dhanam/ui';
import { X, Clock, Sparkles } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

export function DemoModeBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const analytics = useAnalytics();
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Check if user is guest
  const isGuest = user?.email === 'guest@dhanam.demo';

  useEffect(() => {
    if (!isGuest) return;

    // Calculate time remaining (1 hour from now as default)
    // In production, this should come from the JWT exp claim
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const sessionStart = localStorage.getItem('demo_session_start');

      if (!sessionStart) {
        localStorage.setItem('demo_session_start', now.toString());
      }

      const start = parseInt(sessionStart || now.toString(), 10);
      const endTime = start + 60 * 60 * 1000; // 1 hour
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeLeft('expired');
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [isGuest]);

  const handleSignUp = () => {
    analytics.track('demo_convert_clicked', {
      timeRemaining: timeLeft,
      source: 'banner',
    });
    router.push('/register');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    analytics.track('demo_banner_dismissed', {
      timeRemaining: timeLeft,
    });
  };

  if (!isGuest || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                You're exploring Dhanam in <strong>Demo Mode</strong>
              </p>
              <p className="text-xs opacity-90 hidden sm:block">
                Read-only access • Sample data • Full features preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {timeLeft !== 'expired' && (
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono font-medium">{timeLeft}</span>
              </div>
            )}

            <Button
              size="sm"
              variant="secondary"
              onClick={handleSignUp}
              className="bg-white text-primary hover:bg-gray-100 font-semibold whitespace-nowrap"
            >
              {timeLeft === 'expired' ? 'Sign Up to Continue' : 'Sign Up Free'}
            </Button>

            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
