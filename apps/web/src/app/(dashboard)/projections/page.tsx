'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  DollarSign,
  Percent,
  Shield,
  Loader2,
} from 'lucide-react';

import { PremiumGate } from '~/components/billing/PremiumGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LongTermChart, IncomeExpenseChart } from '@/components/projections/long-term-chart';
import { LifeEventTimeline } from '@/components/projections/life-event-timeline';
import { WhatIfPanel } from '@/components/projections/what-if-panel';
import {
  projectionsApi,
  type ProjectionResult,
  type CreateProjectionDto,
  type WhatIfScenario,
  type LifeEvent,
} from '@/lib/api/projections';
import { useSpaceStore } from '@/stores/space';

function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function getRiskColor(score: number): string {
  if (score < 30) return 'text-green-600';
  if (score < 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getRiskLabel(score: number): string {
  if (score < 30) return 'Low Risk';
  if (score < 60) return 'Moderate Risk';
  return 'High Risk';
}

export default function ProjectionsPage() {
  const currentSpaceId = useSpaceStore((state) => state.currentSpace?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [projection, setProjection] = useState<ProjectionResult | null>(null);
  const [scenarioTemplates, setScenarioTemplates] = useState<WhatIfScenario[]>([]);
  const [comparisonResults, setComparisonResults] = useState<{
    baseline: ProjectionResult;
    scenarios: { scenario: WhatIfScenario; result: ProjectionResult }[];
  } | null>(null);

  // Form state
  const [config, setConfig] = useState<CreateProjectionDto>({
    projectionYears: 30,
    inflationRate: 0.03,
    currentAge: 35,
    retirementAge: 65,
    lifeExpectancy: 90,
    includeAccounts: true,
    includeRecurring: true,
    lifeEvents: [],
  });

  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([
    {
      type: 'retirement',
      name: 'Retirement',
      year: new Date().getFullYear() + 30,
      amount: 0,
    },
  ]);

  // Load scenario templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!currentSpaceId) return;
      try {
        const templates = await projectionsApi.getScenarioTemplates(currentSpaceId);
        setScenarioTemplates(templates);
      } catch (error) {
        console.error('Failed to load scenario templates:', error);
      }
    };
    loadTemplates();
  }, [currentSpaceId]);

  const generateProjection = useCallback(async () => {
    if (!currentSpaceId) return;
    setIsLoading(true);
    try {
      const result = await projectionsApi.generateProjection(currentSpaceId, {
        ...config,
        lifeEvents,
      });
      setProjection(result);
      setComparisonResults(null);
    } catch (error) {
      console.error('Failed to generate projection:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentSpaceId, config, lifeEvents]);

  const handleCompareScenarios = async (scenarios: WhatIfScenario[]) => {
    if (!currentSpaceId) return;
    setIsComparing(true);
    try {
      const results = await projectionsApi.compareScenarios(
        currentSpaceId,
        { ...config, lifeEvents },
        scenarios
      );
      setComparisonResults(results);
    } catch (error) {
      console.error('Failed to compare scenarios:', error);
    } finally {
      setIsComparing(false);
    }
  };

  const updateRetirementAge = (age: number) => {
    setConfig((prev) => ({ ...prev, retirementAge: age }));
    // Update retirement life event year
    const retirementYear = new Date().getFullYear() + (age - config.currentAge);
    setLifeEvents((prev) =>
      prev.map((e) => (e.type === 'retirement' ? { ...e, year: retirementYear } : e))
    );
  };

  const currentYear = new Date().getFullYear();
  const retirementYear = currentYear + (config.retirementAge - config.currentAge);

  return (
    <PremiumGate feature="Monte Carlo Simulations">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Long-Term Projections</h1>
            <p className="text-muted-foreground">
              Plan your financial future with 10-30 year cashflow projections
            </p>
          </div>
          <Button onClick={generateProjection} disabled={isLoading || !currentSpaceId}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Projection
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Projection Settings</CardTitle>
                <CardDescription>Configure your financial assumptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Age Settings */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentAge">Current Age</Label>
                    <Input
                      id="currentAge"
                      type="number"
                      min={18}
                      max={100}
                      value={config.currentAge}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          currentAge: parseInt(e.target.value) || 35,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Retirement Age</Label>
                      <span className="text-sm text-muted-foreground">{config.retirementAge}</span>
                    </div>
                    <Slider
                      value={[config.retirementAge]}
                      min={Math.max(config.currentAge + 1, 50)}
                      max={80}
                      step={1}
                      onValueChange={(values: number[]) =>
                        values[0] !== undefined && updateRetirementAge(values[0])
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.retirementAge - config.currentAge} years until retirement
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Projection Length</Label>
                      <span className="text-sm text-muted-foreground">
                        {config.projectionYears} years
                      </span>
                    </div>
                    <Slider
                      value={[config.projectionYears]}
                      min={10}
                      max={50}
                      step={5}
                      onValueChange={(values: number[]) => {
                        const v = values[0];
                        if (v !== undefined) setConfig((prev) => ({ ...prev, projectionYears: v }));
                      }}
                    />
                  </div>
                </div>

                {/* Economic Assumptions */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-sm font-medium">Economic Assumptions</Label>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Inflation Rate</Label>
                      <span className="text-sm text-muted-foreground">
                        {((config.inflationRate ?? 0.03) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Slider
                      value={[(config.inflationRate ?? 0.03) * 100]}
                      min={1}
                      max={6}
                      step={0.5}
                      onValueChange={(values: number[]) => {
                        const v = values[0];
                        if (v !== undefined)
                          setConfig((prev) => ({ ...prev, inflationRate: v / 100 }));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lifeExpectancy">Life Expectancy</Label>
                    <Input
                      id="lifeExpectancy"
                      type="number"
                      min={config.currentAge + 10}
                      max={120}
                      value={config.lifeExpectancy}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          lifeExpectancy: parseInt(e.target.value) || 90,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Data Sources */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Data Sources</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.includeAccounts}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, includeAccounts: e.target.checked }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Include linked accounts</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.includeRecurring}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, includeRecurring: e.target.checked }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Include recurring transactions</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What-If Panel */}
            {projection && (
              <WhatIfPanel
                templates={scenarioTemplates}
                onCompare={handleCompareScenarios}
                comparisonResults={comparisonResults || undefined}
                isLoading={isComparing}
              />
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {!projection ? (
              <Card className="h-[500px] flex items-center justify-center">
                <CardContent className="text-center">
                  <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Projection Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure your settings and click &quot;Generate Projection&quot; to see your
                    financial future
                  </p>
                  <Button onClick={generateProjection} disabled={isLoading || !currentSpaceId}>
                    {isLoading ? 'Calculating...' : 'Generate Projection'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Peak Net Worth
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(projection.summary.peakNetWorth.amount)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        in {projection.summary.peakNetWorth.year}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        FI Year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {projection.summary.financialIndependenceYear || 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {projection.summary.financialIndependenceYear
                          ? `Age ${projection.summary.financialIndependenceYear - currentYear + config.currentAge}`
                          : 'Not projected'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1">
                        <Percent className="h-4 w-4" />
                        Income Replacement
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatPercent(projection.summary.incomeReplacementRatio)}
                      </div>
                      <p className="text-xs text-muted-foreground">at retirement</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        Risk Score
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${getRiskColor(projection.summary.riskScore)}`}
                      >
                        {projection.summary.riskScore}/100
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getRiskLabel(projection.summary.riskScore)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Warnings */}
                {projection.warnings.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Attention Required</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 mt-2 space-y-1">
                        {projection.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Charts */}
                <Tabs defaultValue="networth" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="networth">Net Worth</TabsTrigger>
                    <TabsTrigger value="cashflow">Income & Expenses</TabsTrigger>
                    <TabsTrigger value="events">Life Events</TabsTrigger>
                  </TabsList>

                  <TabsContent value="networth">
                    <LongTermChart
                      snapshots={projection.yearlySnapshots}
                      retirementYear={retirementYear}
                    />
                  </TabsContent>

                  <TabsContent value="cashflow">
                    <IncomeExpenseChart
                      snapshots={projection.yearlySnapshots}
                      retirementYear={retirementYear}
                    />
                  </TabsContent>

                  <TabsContent value="events">
                    <LifeEventTimeline events={lifeEvents} currentYear={currentYear} />
                  </TabsContent>
                </Tabs>

                {/* Additional Stats */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Lifetime Totals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Earnings</span>
                          <span className="font-medium">
                            {formatCurrency(projection.summary.totalLifetimeEarnings)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Taxes Paid</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(projection.summary.totalLifetimeTaxes)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Social Security Received</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(projection.summary.totalSocialSecurity)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Average Savings Rate</span>
                          <span className="font-medium">
                            {formatPercent(projection.summary.averageSavingsRate)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Retirement Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Years Until Retirement</span>
                          <span className="font-medium">
                            {projection.summary.yearsUntilRetirement} years
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Retirement Income</span>
                          <span className="font-medium">
                            {formatCurrency(projection.summary.projectedRetirementIncome / 12)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Debt-Free Year</span>
                          <span className="font-medium">
                            {projection.summary.debtFreeYear || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Minimum Net Worth</span>
                          <span
                            className={`font-medium ${projection.summary.minNetWorth.amount < 0 ? 'text-red-600' : ''}`}
                          >
                            {formatCurrency(projection.summary.minNetWorth.amount)} (
                            {projection.summary.minNetWorth.year})
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PremiumGate>
  );
}
