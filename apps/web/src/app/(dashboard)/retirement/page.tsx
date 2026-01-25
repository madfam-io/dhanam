'use client';

import { useState } from 'react';
import { RetirementCalculatorForm } from '@/components/simulations/RetirementCalculatorForm';
import { RetirementResults } from '@/components/simulations/RetirementResults';
import { SimulationChart } from '@/components/simulations/SimulationChart';
import type { RetirementSimulationResult } from '@/hooks/useSimulations';
import { PremiumGate } from '~/components/billing/PremiumGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function RetirementPage() {
  const [results, setResults] = useState<RetirementSimulationResult | null>(null);

  return (
    <PremiumGate feature="Retirement Planning Tools">
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Retirement Planning</h1>
          <p className="text-muted-foreground mt-2">
            Use Monte Carlo simulation to plan for a secure retirement
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription>
            This calculator runs 10,000 simulations of your financial future using Monte Carlo
            methods. It models two phases: <strong>accumulation</strong> (saving until retirement)
            and <strong>withdrawal</strong> (spending during retirement). The results show the
            probability of your money lasting through your expected lifespan.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Calculator Form */}
          <div className="lg:col-span-1">
            <RetirementCalculatorForm onResults={setResults} />
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2">
            {results ? (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="projections">Projections</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-6">
                  <RetirementResults results={results} />
                </TabsContent>

                <TabsContent value="projections" className="space-y-6">
                  <SimulationChart
                    timeSeries={results.simulation.timeSeries}
                    title="Retirement Portfolio Projections"
                    description="Two-phase simulation: accumulation until retirement, then withdrawal"
                  />

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Final Balance</p>
                      <p className="text-lg font-semibold">
                        $
                        {results.simulation.median.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">Median</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Worst 10%</p>
                      <p className="text-lg font-semibold text-red-600">
                        $
                        {results.simulation.p10.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">10th Percentile</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Best 10%</p>
                      <p className="text-lg font-semibold text-green-600">
                        $
                        {results.simulation.p90.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">90th Percentile</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[600px] border border-dashed rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Info className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No retirement projection yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Enter your details in the form and click &quot;Calculate Retirement Plan&quot;
                    to see your projected timeline
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Educational Content */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">Understanding Your Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Success Rate</h3>
              <p className="text-sm text-muted-foreground">
                The probability that your retirement savings will last through your expected
                lifespan. 75% or higher is generally considered good.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Percentiles</h3>
              <p className="text-sm text-muted-foreground">
                The 10th percentile shows the "worst 10%" outcome, while 90th shows the "best 10%".
                The median (50th percentile) is the most likely outcome.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Safe Withdrawal Rate</h3>
              <p className="text-sm text-muted-foreground">
                The monthly amount you can safely withdraw during retirement with 75% confidence of
                not running out of money.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PremiumGate>
  );
}
