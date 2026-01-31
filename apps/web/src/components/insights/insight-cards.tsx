'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button } from '@dhanam/ui';
import { Lightbulb, Trophy, BarChart3, Users, Wallet, Fuel, X } from 'lucide-react';
import { useAuth } from '~/lib/hooks/use-auth';

interface Insight {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  message: string;
  link: string;
  linkLabel: string;
}

const personaInsights: Record<string, Insight[]> = {
  'maria@dhanam.demo': [
    {
      id: 'maria-gym',
      icon: Lightbulb,
      iconColor: 'text-yellow-500',
      message:
        'You could save MXN 7,188/yr by canceling the Bodytech Gym subscription we detected.',
      link: '/subscriptions',
      linkLabel: 'Review subscriptions',
    },
    {
      id: 'maria-savings',
      icon: Trophy,
      iconColor: 'text-amber-500',
      message: 'Your savings rate is 29% — in the top 15% of Dhanam users in Mexico.',
      link: '/analytics',
      linkLabel: 'View analytics',
    },
  ],
  'carlos@dhanam.demo': [
    {
      id: 'carlos-reserves',
      icon: BarChart3,
      iconColor: 'text-blue-500',
      message: 'Business cash reserves cover 2.4 months of operating expenses.',
      link: '/analytics',
      linkLabel: 'View cash position',
    },
    {
      id: 'carlos-splits',
      icon: Users,
      iconColor: 'text-purple-500',
      message: "3 shared expenses with Ana haven't been split yet this month.",
      link: '/households',
      linkLabel: 'Split expenses',
    },
  ],
  'patricia@dhanam.demo': [
    {
      id: 'patricia-pe',
      icon: Wallet,
      iconColor: 'text-green-500',
      message:
        'Your PE distribution of $12K arrived — consider rebalancing to maintain allocation targets.',
      link: '/analytics',
      linkLabel: 'View portfolio',
    },
  ],
  'diego@dhanam.demo': [
    {
      id: 'diego-gas',
      icon: Fuel,
      iconColor: 'text-orange-500',
      message: 'Gas fees down 40% this week — good time to rebalance DeFi positions.',
      link: '/gaming',
      linkLabel: 'View DeFi',
    },
  ],
};

export function InsightCards() {
  const { user } = useAuth();
  const router = useRouter();
  const allInsights = user?.email ? personaInsights[user.email] : null;
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!allInsights) return null;

  const visible = allInsights.filter((i) => !dismissed.has(i.id));
  if (visible.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visible.map((insight) => {
        const Icon = insight.icon;
        return (
          <Card key={insight.id} className="relative">
            <button
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted"
              onClick={() => setDismissed((prev) => new Set(prev).add(insight.id))}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
            <CardContent className="flex items-start gap-3 pt-4 pb-3">
              <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${insight.iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{insight.message}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-1 text-xs"
                  onClick={() => router.push(insight.link)}
                >
                  {insight.linkLabel} &rarr;
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
