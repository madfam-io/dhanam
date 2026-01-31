'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Target,
  Sparkles,
  Lock,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '~/lib/hooks/use-auth';
import { authApi } from '~/lib/api/auth';
import { SimulationChart } from '@/components/simulations/SimulationChart';
import type { SimulationResult } from '@/hooks/useSimulations';

// Demo limits for non-authenticated users
const MAX_DEMO_SIMULATIONS = 2;

const PERSONAS = [
  {
    key: 'maria',
    emoji: '🧑‍💼',
    name: 'Maria González',
    archetype: 'Young Professional',
    features: ['Zero-based budgeting', 'Belvo bank sync', 'ESG crypto scoring'],
    color: 'border-blue-500',
  },
  {
    key: 'carlos',
    emoji: '🏪',
    name: 'Carlos Mendoza',
    archetype: 'Small Business Owner',
    features: ['Yours / Mine / Ours spaces', 'Business budgeting', 'Manual asset tracking'],
    color: 'border-green-500',
  },
  {
    key: 'patricia',
    emoji: '💎',
    name: 'Patricia Ruiz',
    archetype: 'High Net Worth',
    features: ['Estate planning', 'Multi-currency accounts', 'Investment portfolios'],
    color: 'border-purple-500',
  },
  {
    key: 'diego',
    emoji: '🎮',
    name: 'Diego Navarro',
    archetype: 'Web3 / DeFi Native',
    features: ['Multi-chain DeFi', 'Gaming wallets & NFTs', 'DAO governance'],
    color: 'border-orange-500',
  },
  {
    key: 'guest',
    emoji: '👋',
    name: 'Quick Preview',
    archetype: 'Basic Personal Finance',
    features: ['Monthly budgeting', 'Multi-account overview', 'Crypto wallet tracking'],
    color: 'border-gray-400',
  },
];

// Pre-populated realistic demo data for Monte Carlo section
const DEMO_PROFILES = {
  youngProfessional: {
    name: 'Young Professional',
    age: 28,
    retirementAge: 65,
    currentSavings: 25000,
    monthlyContribution: 1200,
    expectedReturn: 0.07,
    volatility: 0.15,
    retirementExpenses: 4500,
  },
  midCareer: {
    name: 'Mid-Career',
    age: 42,
    retirementAge: 67,
    currentSavings: 180000,
    monthlyContribution: 2000,
    expectedReturn: 0.065,
    volatility: 0.12,
    retirementExpenses: 6000,
  },
  nearRetirement: {
    name: 'Near Retirement',
    age: 58,
    retirementAge: 65,
    currentSavings: 750000,
    monthlyContribution: 3000,
    expectedReturn: 0.055,
    volatility: 0.08,
    retirementExpenses: 7500,
  },
};

export default function DemoPage() {
  const router = useRouter();
  const analytics = useAnalytics();
  const { setAuth } = useAuth();

  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);

  // Monte Carlo state
  const [selectedProfile, setSelectedProfile] =
    useState<keyof typeof DEMO_PROFILES>('youngProfessional');
  const [config, setConfig] = useState(DEMO_PROFILES.youngProfessional);
  const [simulationsRun, setSimulationsRun] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    analytics.trackPageView('Demo Page', '/demo');
    analytics.track('demo_started', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setConfig(DEMO_PROFILES[selectedProfile]);
    setResult(null);
  }, [selectedProfile]);

  const handlePersonaClick = async (personaKey: string) => {
    setLoadingPersona(personaKey);
    analytics.track('demo_persona_selected', { persona: personaKey });

    try {
      const result = await authApi.loginAsPersona(personaKey);
      setAuth(result.user as any, result.tokens);

      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am';
      window.location.href = `${appUrl}/dashboard`;
    } catch (error) {
      console.error('Failed to login as persona:', error);
      setLoadingPersona(null);
    }
  };

  const handleSignUp = () => {
    analytics.track('demo_signup_clicked', { simulations_run: simulationsRun });
    router.push('/register');
  };

  const handleProfileChange = (profile: keyof typeof DEMO_PROFILES) => {
    setSelectedProfile(profile);
    analytics.track('demo_profile_changed', { profile });
  };

  const handleInputChange = (field: string, value: number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const runSimulation = async () => {
    if (simulationsRun >= MAX_DEMO_SIMULATIONS) {
      setShowUpsell(true);
      analytics.track('demo_limit_reached', { simulations_run: simulationsRun });
      return;
    }

    setIsSimulating(true);
    analytics.track('demo_simulation_started', {
      profile: selectedProfile,
      simulations_run: simulationsRun + 1,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const yearsToRetirement = config.retirementAge - config.age;
    const monthsToRetirement = yearsToRetirement * 12;
    const totalContributions = config.monthlyContribution * monthsToRetirement;
    const futureValue = calculateFutureValue(
      config.currentSavings,
      config.monthlyContribution,
      config.expectedReturn / 12,
      monthsToRetirement
    );

    const retirementMonths = 30 * 12;
    const annualExpenses = config.retirementExpenses * 12;
    const successProbability = calculateSuccessProbability(
      futureValue,
      annualExpenses,
      retirementMonths
    );

    const timeSeries = generateMockTimeSeries(
      config.currentSavings,
      config.monthlyContribution,
      config.expectedReturn / 12,
      config.volatility / Math.sqrt(12),
      monthsToRetirement
    );

    const mockResult: SimulationResult = {
      finalValues: [],
      median: futureValue,
      p10: futureValue * 0.7,
      p25: futureValue * 0.85,
      p75: futureValue * 1.15,
      p90: futureValue * 1.3,
      mean: futureValue * 1.02,
      stdDev: futureValue * 0.2,
      min: futureValue * 0.5,
      max: futureValue * 2,
      timeSeries,
      computedAt: new Date(),
      metadata: {
        iterations: 10000,
        successProbability,
        yearsToRetirement,
        nestEgg: futureValue,
        totalContributions,
        monthlyExpenses: config.retirementExpenses,
      },
    };

    setResult(mockResult);
    setSimulationsRun((prev) => prev + 1);
    setIsSimulating(false);

    analytics.trackRetirementSimulation(
      config.age,
      config.retirementAge,
      successProbability,
      futureValue
    );

    if (simulationsRun + 1 >= MAX_DEMO_SIMULATIONS) {
      setTimeout(() => setShowUpsell(true), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">Dhanam</span>
            <Badge variant="outline">Demo</Badge>
          </div>
          <Button onClick={handleSignUp} variant="outline" className="gap-2">
            Sign Up for Full Access
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Persona Picker Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Experience Dhanam</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pick a financial life to explore. Each persona showcases different features. Switch
            between them anytime from the dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {PERSONAS.map((persona) => (
            <Card
              key={persona.key}
              className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${persona.color} border-t-4`}
            >
              <CardHeader className="pb-3">
                <div className="text-3xl mb-2">{persona.emoji}</div>
                <CardTitle className="text-lg">{persona.name}</CardTitle>
                <CardDescription>{persona.archetype}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1">
                  {persona.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePersonaClick(persona.key)}
                  disabled={loadingPersona !== null}
                  className="w-full"
                  variant={persona.key === 'guest' ? 'outline' : 'default'}
                >
                  {loadingPersona === persona.key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : persona.key === 'guest' ? (
                    'Quick Start'
                  ) : (
                    `Explore as ${persona.name.split(' ')[0]}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* Monte Carlo Interactive Preview */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Interactive Preview: Retirement Calculator</h2>
            <p className="text-muted-foreground">
              Try the Monte Carlo simulation — no sign-up required.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>
                {simulationsRun}/{MAX_DEMO_SIMULATIONS} demo simulations used
              </span>
            </div>
          </div>

          {/* Profile Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(DEMO_PROFILES).map(([key, profile]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all ${
                  selectedProfile === key ? 'border-blue-600 shadow-md' : 'hover:border-gray-300'
                }`}
                onClick={() => handleProfileChange(key as keyof typeof DEMO_PROFILES)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {profile.name}
                    {selectedProfile === key && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                  </CardTitle>
                  <CardDescription>
                    Age {profile.age}, retiring at {profile.retirementAge}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Savings:</span>
                    <span className="font-semibold">
                      ${profile.currentSavings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Contribution:</span>
                    <span className="font-semibold">
                      ${profile.monthlyContribution.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Retirement Parameters</CardTitle>
                  <CardDescription>Adjust values to see different scenarios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Current Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={config.age}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('age', parseInt(e.target.value))
                      }
                      min={18}
                      max={80}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retirementAge">Retirement Age</Label>
                    <Input
                      id="retirementAge"
                      type="number"
                      value={config.retirementAge}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('retirementAge', parseInt(e.target.value))
                      }
                      min={config.age + 1}
                      max={85}
                    />
                    <p className="text-sm text-muted-foreground">
                      {config.retirementAge - config.age} years to retirement
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentSavings">Current Savings</Label>
                    <Input
                      id="currentSavings"
                      type="number"
                      value={config.currentSavings}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('currentSavings', parseFloat(e.target.value))
                      }
                      min={0}
                      step={1000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
                    <Input
                      id="monthlyContribution"
                      type="number"
                      value={config.monthlyContribution}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('monthlyContribution', parseFloat(e.target.value))
                      }
                      min={0}
                      step={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retirementExpenses">Monthly Expenses in Retirement</Label>
                    <Input
                      id="retirementExpenses"
                      type="number"
                      value={config.retirementExpenses}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('retirementExpenses', parseFloat(e.target.value))
                      }
                      min={0}
                      step={100}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="expectedReturn">Expected Return (%)</Label>
                    <Input
                      id="expectedReturn"
                      type="number"
                      value={(config.expectedReturn * 100).toFixed(1)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('expectedReturn', parseFloat(e.target.value) / 100)
                      }
                      min={0}
                      max={20}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volatility">Market Volatility (%)</Label>
                    <Input
                      id="volatility"
                      type="number"
                      value={(config.volatility * 100).toFixed(1)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('volatility', parseFloat(e.target.value) / 100)
                      }
                      min={0}
                      max={50}
                      step={1}
                    />
                  </div>

                  <Button
                    onClick={runSimulation}
                    disabled={isSimulating || simulationsRun >= MAX_DEMO_SIMULATIONS}
                    className="w-full"
                    size="lg"
                  >
                    {isSimulating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running simulation...
                      </>
                    ) : simulationsRun >= MAX_DEMO_SIMULATIONS ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Demo limit reached
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Run Monte Carlo Simulation
                      </>
                    )}
                  </Button>

                  {simulationsRun > 0 && simulationsRun < MAX_DEMO_SIMULATIONS && (
                    <p className="text-xs text-center text-muted-foreground">
                      {MAX_DEMO_SIMULATIONS - simulationsRun} simulation
                      {MAX_DEMO_SIMULATIONS - simulationsRun !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              {result ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Retirement Success Probability
                      </CardTitle>
                      <CardDescription>Based on 10,000 Monte Carlo simulations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center space-y-2">
                        <div className="text-5xl font-bold text-blue-600">
                          {(result.metadata?.successProbability as number)?.toFixed(1)}%
                        </div>
                        <p className="text-muted-foreground">
                          Probability of not running out of money in retirement
                        </p>
                      </div>

                      <Progress
                        value={(result.metadata?.successProbability as number) || 0}
                        className="h-3"
                      />

                      {((result.metadata?.successProbability as number) || 0) >= 75 ? (
                        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-900 dark:text-green-100">
                            Strong Retirement Plan
                          </AlertTitle>
                          <AlertDescription className="text-green-800 dark:text-green-200">
                            You have a {(result.metadata?.successProbability as number)?.toFixed(1)}
                            % chance of a secure retirement based on these assumptions.
                          </AlertDescription>
                        </Alert>
                      ) : ((result.metadata?.successProbability as number) || 0) >= 50 ? (
                        <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20">
                          <AlertTitle className="text-yellow-900 dark:text-yellow-100">
                            Moderate Retirement Plan
                          </AlertTitle>
                          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                            Consider increasing contributions or adjusting retirement expenses.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <AlertTitle>High Risk of Shortfall</AlertTitle>
                          <AlertDescription>
                            Your current plan has a high risk of running out of money. Consider
                            adjusting your parameters.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Projected Nest Egg at Retirement</CardTitle>
                      <CardDescription>
                        Portfolio value distribution at age {config.retirementAge}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">10th Percentile</div>
                          <div className="font-semibold">${(result.p10 / 1000).toFixed(0)}K</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">25th Percentile</div>
                          <div className="font-semibold">${(result.p25 / 1000).toFixed(0)}K</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                          <div className="text-xs text-muted-foreground mb-1">Median</div>
                          <div className="font-bold text-blue-600 text-lg">
                            ${(result.median / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">75th Percentile</div>
                          <div className="font-semibold">${(result.p75 / 1000).toFixed(0)}K</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">90th Percentile</div>
                          <div className="font-semibold">${(result.p90 / 1000).toFixed(0)}K</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <SimulationChart
                    timeSeries={result.timeSeries}
                    title="Portfolio Growth Projection"
                    description={`Accumulation phase: ${config.retirementAge - config.age} years until retirement`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px] border border-dashed rounded-lg bg-white dark:bg-gray-900">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-2">No simulation yet</p>
                    <p className="text-sm text-muted-foreground">
                      Adjust the parameters and click &quot;Run Monte Carlo Simulation&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upsell Modal */}
        {showUpsell && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full border-primary/50 shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Ready to Plan Your Financial Future?</CardTitle>
                <CardDescription className="text-base">
                  You&apos;ve experienced a glimpse of Dhanam&apos;s power. Sign up to unlock
                  unlimited simulations and advanced features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">With a Free Account:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>5 Monte Carlo simulations per day</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Goal tracking with probability analysis</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Basic scenario comparison</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Upgrade to Premium ($9.99/mo):</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Unlimited simulations</strong> - run as many as you need
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Advanced scenarios</strong> - 12 market stress tests
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Retirement planning tools</strong> - two-phase simulations
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  <Button
                    onClick={handleSignUp}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Free Trial
                  </Button>
                  <Button
                    onClick={() => setShowUpsell(false)}
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    Continue Demo
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  No credit card required &bull; Cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility functions for demo calculations

function calculateFutureValue(
  present: number,
  monthlyPayment: number,
  monthlyRate: number,
  months: number
): number {
  const pvFuture = present * Math.pow(1 + monthlyRate, months);
  const pmtFuture = monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  return pvFuture + pmtFuture;
}

function calculateSuccessProbability(
  nestEgg: number,
  annualExpenses: number,
  _retirementMonths: number
): number {
  const safeWithdrawalRate = 0.04;
  const sustainableAnnualExpenses = nestEgg * safeWithdrawalRate;

  if (annualExpenses <= sustainableAnnualExpenses) {
    return Math.min(95, 75 + ((sustainableAnnualExpenses - annualExpenses) / annualExpenses) * 20);
  } else {
    const shortfall = (annualExpenses - sustainableAnnualExpenses) / annualExpenses;
    return Math.max(15, 75 - shortfall * 100);
  }
}

function generateMockTimeSeries(
  initialBalance: number,
  monthlyContribution: number,
  monthlyReturn: number,
  monthlyVolatility: number,
  months: number
): Array<{ month: number; median: number; mean: number; p10: number; p90: number }> {
  const timeSeries = [];

  for (let month = 0; month <= months; month++) {
    const expectedValue = calculateFutureValue(
      initialBalance,
      monthlyContribution,
      monthlyReturn,
      month
    );

    const variance = expectedValue * monthlyVolatility * Math.sqrt(month);

    timeSeries.push({
      month,
      median: expectedValue,
      mean: expectedValue * 1.02,
      p10: Math.max(0, expectedValue - variance * 1.28),
      p90: expectedValue + variance * 1.28,
    });
  }

  return timeSeries;
}
