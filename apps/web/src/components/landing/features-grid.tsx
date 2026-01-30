import {
  Landmark,
  Coins,
  Home,
  Gamepad2,
  Cpu,
  TrendingUp as Forecast,
  Repeat,
  BarChart3,
  AlertTriangle,
  Target,
  HeartPulse,
  Users,
  Shield,
} from 'lucide-react';

const featureGroups = [
  {
    heading: 'All Your Money, One Place',
    features: [
      {
        icon: Landmark,
        title: 'Multi-Provider Banking',
        description:
          'Belvo (Mexico), Plaid (US), MX, Finicity — connect every account automatically.',
        color: 'blue',
      },
      {
        icon: Coins,
        title: 'DeFi & Web3',
        description:
          'Zapper integration across 7 networks — Ethereum, Polygon, Arbitrum, and more. Plus Bitso exchange and on-chain tracking.',
        color: 'purple',
      },
      {
        icon: Home,
        title: 'Real Estate & Collectibles',
        description:
          'Zillow Zestimates for property values. Sneakers, watches, art, wine, coins, and cards valuation.',
        color: 'teal',
      },
      {
        icon: Gamepad2,
        title: 'Gaming & Metaverse',
        description:
          '7-platform portfolio — track in-game assets, staking rewards, and NFT holdings.',
        color: 'pink',
      },
    ],
  },
  {
    heading: 'AI That Works For You',
    features: [
      {
        icon: Cpu,
        title: 'Smart Categorization',
        description:
          'ML-powered auto-categorization with a learning loop that improves from your corrections.',
        color: 'violet',
      },
      {
        icon: Forecast,
        title: '60-Day Cashflow Forecast',
        description:
          'AI-powered near-term planning with weekly granularity so you never miss a bill.',
        color: 'amber',
      },
      {
        icon: Repeat,
        title: 'Recurring Detection',
        description:
          'Automatically surfaces subscriptions and recurring charges to reduce hidden costs.',
        color: 'cyan',
      },
    ],
  },
  {
    heading: 'Plan Your Future',
    features: [
      {
        icon: BarChart3,
        title: 'Monte Carlo Simulations',
        description:
          '10,000 iterations model market uncertainty and show probability ranges for every goal.',
        color: 'blue',
      },
      {
        icon: AlertTriangle,
        title: 'Scenario Stress Testing',
        description:
          'Test your plan against 12 historical events — 2008 crash, COVID, dot-com bubble, and more.',
        color: 'orange',
      },
      {
        icon: Target,
        title: 'Retirement & Goal Planning',
        description:
          'Two-phase simulation with on-track indicators, zero-based budgeting, and scheduled reports.',
        color: 'green',
      },
    ],
  },
  {
    heading: 'Protect What Matters',
    features: [
      {
        icon: HeartPulse,
        title: 'Estate Planning & Life Beat',
        description:
          "Digital wills with a dead man's switch — executor access activates automatically when needed.",
        color: 'red',
      },
      {
        icon: Users,
        title: 'Household Management',
        description: 'Yours / Mine / Ours views for couples and families sharing finances.',
        color: 'indigo',
      },
      {
        icon: Shield,
        title: 'Bank-Level Security',
        description:
          'TOTP 2FA, AES-256-GCM encryption, Argon2id hashing — always read-only access to your institutions.',
        color: 'red',
      },
    ],
  },
] as const;

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600',
  purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600',
  teal: 'bg-teal-100 dark:bg-teal-900/50 text-teal-600',
  pink: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600',
  violet: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600',
  amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600',
  orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600',
  green: 'bg-green-100 dark:bg-green-900/50 text-green-600',
  red: 'bg-red-100 dark:bg-red-900/50 text-red-600',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600',
};

export function FeaturesGrid() {
  return (
    <section className="container mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Features Financial Advisors Use</h2>
        <p className="text-muted-foreground">Now available to everyone for $9.99/month</p>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {featureGroups.map((group) => (
          <div key={group.heading}>
            <h3 className="text-xl font-semibold mb-6 text-center md:text-left">{group.heading}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {group.features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow"
                  >
                    <div
                      className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${colorMap[feature.color]}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
