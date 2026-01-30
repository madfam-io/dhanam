import { Link2, Cpu, BarChart3, Target } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Connect',
    description:
      'Link bank accounts, crypto wallets, or add manual assets like real estate and collectibles.',
    icon: Link2,
    color: 'blue',
  },
  {
    number: 2,
    title: 'Automate',
    description:
      'AI categorizes transactions, detects recurring patterns, and builds your 60-day cashflow forecast.',
    icon: Cpu,
    color: 'purple',
  },
  {
    number: 3,
    title: 'Simulate',
    description:
      'Run 10,000 Monte Carlo iterations on your goals and stress-test against 12 historical scenarios.',
    icon: BarChart3,
    color: 'orange',
  },
  {
    number: 4,
    title: 'Plan',
    description:
      'See the probability of reaching each goal and get actionable steps to improve your odds.',
    icon: Target,
    color: 'green',
  },
] as const;

const colorMap = {
  blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600',
  purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600',
  orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600',
  green: 'bg-green-100 dark:bg-green-900/50 text-green-600',
} as const;

export function HowItWorks() {
  return (
    <section className="container mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        <p className="text-muted-foreground">
          From connected accounts to confident decisions in four steps
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="text-center space-y-3">
              <div className="relative mx-auto">
                <div
                  className={`h-14 w-14 mx-auto rounded-full flex items-center justify-center ${colorMap[step.color]}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
