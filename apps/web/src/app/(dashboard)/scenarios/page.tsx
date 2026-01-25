'use client';

import { useState } from 'react';
import {
  useSimulations,
  type MonteCarloConfig,
  type ScenarioComparisonResult,
} from '@/hooks/useSimulations';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { SimulationChart } from '@/components/simulations/SimulationChart';

const SCENARIOS = [
  { value: 'BEAR_MARKET', label: 'Bear Market', severity: 'medium' },
  { value: 'GREAT_RECESSION', label: 'Great Recession (2008)', severity: 'high' },
  { value: 'DOT_COM_BUST', label: 'Dot-com Bust (2000)', severity: 'high' },
  { value: 'MILD_RECESSION', label: 'Mild Recession', severity: 'low' },
  { value: 'MARKET_CORRECTION', label: 'Market Correction', severity: 'low' },
  { value: 'STAGFLATION', label: 'Stagflation (1970s)', severity: 'high' },
  { value: 'DOUBLE_DIP_RECESSION', label: 'Double-Dip Recession', severity: 'high' },
  { value: 'LOST_DECADE', label: 'Lost Decade (Japan 1990s)', severity: 'extreme' },
  { value: 'FLASH_CRASH', label: 'Flash Crash', severity: 'medium' },
  { value: 'BOOM_CYCLE', label: 'Boom Cycle', severity: 'positive' },
  { value: 'TECH_BUBBLE', label: 'Tech Bubble', severity: 'extreme' },
  { value: 'COVID_SHOCK', label: 'COVID-19 Style Shock', severity: 'medium' },
];

export default function ScenariosPage() {
  const { compareScenarios, loading, error } = useSimulations();
  const analytics = useAnalytics();

  const [config, setConfig] = useState<MonteCarloConfig>({
    initialBalance: 100000,
    monthlyContribution: 1000,
    months: 120,
    expectedReturn: 0.07,
    volatility: 0.15,
    iterations: 10000,
  });

  const [selectedScenario, setSelectedScenario] = useState('GREAT_RECESSION');
  const [comparison, setComparison] = useState<ScenarioComparisonResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Transform MonteCarloConfig to the format expected by analyzeScenario
    const scenarioConfig = {
      initialBalance: config.initialBalance,
      monthlyContribution: config.monthlyContribution,
      years: Math.round(config.months / 12),
      expectedReturn: config.expectedReturn,
      returnVolatility: config.volatility,
      iterations: config.iterations,
    };
    const result = await compareScenarios(selectedScenario, scenarioConfig);
    if (result) {
      setComparison(result);

      // Track scenario comparison
      analytics.trackScenarioComparison(
        result.scenarioName ?? selectedScenario,
        result.comparison.medianDifference,
        result.comparison.medianDifferencePercent,
        result.comparison.worthStressTesting
      );
    }
  };

  const handleInputChange = (field: keyof MonteCarloConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-yellow-600',
      medium: 'bg-orange-600',
      high: 'bg-red-600',
      extreme: 'bg-purple-600',
      positive: 'bg-green-600',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-600';
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Scenario Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Stress test your portfolio against historical market events
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How Scenario Analysis Works</AlertTitle>
        <AlertDescription>
          This tool compares your baseline portfolio projection against historical market scenarios.
          It runs two simulations: one under normal conditions and one with the selected market
          shock, then shows the impact on your portfolio value.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Configuration</CardTitle>
              <CardDescription>Set your baseline portfolio parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="initialBalance">Initial Balance</Label>
                  <Input
                    id="initialBalance"
                    type="number"
                    value={config.initialBalance}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('initialBalance', parseFloat(e.target.value))
                    }
                    min={0}
                    step={1000}
                  />
                  <p className="text-sm text-muted-foreground">
                    ${config.initialBalance.toLocaleString()}
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    ${config.monthlyContribution.toLocaleString()}/month
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="months">Time Horizon (months)</Label>
                  <Input
                    id="months"
                    type="number"
                    value={config.months}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('months', parseInt(e.target.value))
                    }
                    min={12}
                    max={600}
                    step={12}
                  />
                  <p className="text-sm text-muted-foreground">
                    {(config.months / 12).toFixed(1)} years
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedReturn">Expected Return (%)</Label>
                  <Input
                    id="expectedReturn"
                    type="number"
                    value={(config.expectedReturn * 100).toFixed(1)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('expectedReturn', parseFloat(e.target.value) / 100)
                    }
                    min={-20}
                    max={20}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volatility">Volatility (%)</Label>
                  <Input
                    id="volatility"
                    type="number"
                    value={(config.volatility * 100).toFixed(1)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('volatility', parseFloat(e.target.value) / 100)
                    }
                    min={0}
                    max={80}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scenario">Select Scenario</Label>
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger id="scenario">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENARIOS.map((scenario) => (
                        <SelectItem key={scenario.value} value={scenario.value}>
                          <div className="flex items-center gap-2">
                            {scenario.label}
                            <Badge
                              className={getSeverityColor(scenario.severity)}
                              variant="secondary"
                            >
                              {scenario.severity}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running simulations...
                    </>
                  ) : (
                    'Compare Scenarios'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {comparison ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    {comparison.scenarioName}
                  </CardTitle>
                  <CardDescription>{comparison.scenarioDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Impact Alert */}
                  {comparison.comparison.worthStressTesting && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Significant Impact Detected</AlertTitle>
                      <AlertDescription>
                        This scenario would reduce your median outcome by{' '}
                        <strong>
                          ${Math.abs(comparison.comparison.medianDifference).toLocaleString()}
                        </strong>{' '}
                        ({Math.abs(comparison.comparison.medianDifferencePercent).toFixed(1)}%).
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Comparison Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">Baseline (Normal)</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Median:</span>
                          <span className="font-semibold">
                            $
                            {comparison.baseline.median.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P10:</span>
                          <span className="font-semibold">
                            $
                            {comparison.baseline.p10.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P90:</span>
                          <span className="font-semibold">
                            $
                            {comparison.baseline.p90.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                      <p className="text-sm text-muted-foreground mb-2">
                        With {comparison.scenarioName}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Median:</span>
                          <span className="font-semibold text-red-600">
                            $
                            {(comparison.scenario.median ?? 0).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P10:</span>
                          <span className="font-semibold text-red-600">
                            $
                            {(comparison.scenario.p10 ?? 0).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P90:</span>
                          <span className="font-semibold text-red-600">
                            $
                            {(comparison.scenario.p90 ?? 0).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Difference Breakdown */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Impact Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Median Impact:</span>
                        <span className="font-semibold text-red-600">
                          ${Math.abs(comparison.comparison.medianDifference).toLocaleString()}(
                          {comparison.comparison.medianDifferencePercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Worst Case Impact (P10):</span>
                        <span className="font-semibold text-red-600">
                          ${Math.abs(comparison.comparison.p10Difference).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crisis Duration:</span>
                        <span className="font-semibold">
                          {comparison.comparison.recoveryMonths ?? 0} months
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <SimulationChart
                timeSeries={comparison.baseline.timeSeries}
                title="Baseline Projection"
                description="Portfolio growth under normal market conditions"
              />

              <SimulationChart
                timeSeries={comparison.scenario.timeSeries ?? []}
                title={`${comparison.scenarioName} Projection`}
                description={comparison.scenarioDescription}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[400px] lg:min-h-[500px] border border-dashed rounded-lg">
              <div className="flex flex-col items-center text-center p-8">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <TrendingDown className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No scenario analysis yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Configure your portfolio parameters and select a scenario to stress test your
                  investments against historical market events.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    document.getElementById('initialBalance')?.focus();
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
