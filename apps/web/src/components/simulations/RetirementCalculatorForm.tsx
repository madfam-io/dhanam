'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info } from 'lucide-react';
import { useSimulations, type RetirementConfig } from '@/hooks/useSimulations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RetirementCalculatorFormProps {
  onResults: (results: any) => void;
}

export function RetirementCalculatorForm({ onResults }: RetirementCalculatorFormProps) {
  const { simulateRetirement, getRecommendedAllocation, loading, error } = useSimulations();

  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [inputs, setInputs] = useState<RetirementConfig>({
    initialBalance: 50000,
    monthlyContribution: 1500,
    currentAge: 35,
    retirementAge: 65,
    lifeExpectancy: 90,
    monthlyExpenses: 5000,
    socialSecurityIncome: 2000,
    expectedReturn: 0.07,
    volatility: 0.15,
    iterations: 10000,
    inflationAdjusted: true,
  });

  // Update return/volatility when risk tolerance changes
  useEffect(() => {
    const loadAllocation = async () => {
      const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
      const allocation = await getRecommendedAllocation(riskTolerance, yearsToRetirement);

      if (allocation) {
        setInputs(prev => ({
          ...prev,
          expectedReturn: allocation.expectedReturn,
          volatility: allocation.volatility,
        }));
      }
    };

    loadAllocation();
  }, [riskTolerance, inputs.currentAge, inputs.retirementAge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const results = await simulateRetirement(inputs);
    if (results) {
      onResults(results);
    }
  };

  const handleInputChange = (field: keyof RetirementConfig, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
  const yearsInRetirement = inputs.lifeExpectancy - inputs.retirementAge;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retirement Planning Calculator</CardTitle>
        <CardDescription>
          Monte Carlo simulation with {inputs.iterations.toLocaleString()} iterations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Risk Tolerance */}
          <div className="space-y-2">
            <Label htmlFor="riskTolerance">Risk Tolerance</Label>
            <Select value={riskTolerance} onValueChange={(value: any) => setRiskTolerance(value)}>
              <SelectTrigger id="riskTolerance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative (40% stocks, 5% return)</SelectItem>
                <SelectItem value="moderate">Moderate (60% stocks, 7% return)</SelectItem>
                <SelectItem value="aggressive">Aggressive (80% stocks, 9% return)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current Financial Situation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Financial Situation</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="initialBalance">Current Retirement Savings</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>
                      <p>Total value of all retirement accounts (401k, IRA, etc.)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="initialBalance"
                type="number"
                value={inputs.initialBalance}
                onChange={(e) => handleInputChange('initialBalance', parseFloat(e.target.value))}
                min={0}
                step={1000}
              />
              <p className="text-sm text-muted-foreground">
                ${inputs.initialBalance.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
              <Input
                id="monthlyContribution"
                type="number"
                value={inputs.monthlyContribution}
                onChange={(e) => handleInputChange('monthlyContribution', parseFloat(e.target.value))}
                min={0}
                step={100}
              />
              <p className="text-sm text-muted-foreground">
                ${inputs.monthlyContribution.toLocaleString()}/month = ${(inputs.monthlyContribution * 12).toLocaleString()}/year
              </p>
            </div>
          </div>

          {/* Age & Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timeline</h3>

            <div className="space-y-2">
              <Label htmlFor="currentAge">Current Age: {inputs.currentAge}</Label>
              <Slider
                id="currentAge"
                min={18}
                max={80}
                step={1}
                value={[inputs.currentAge]}
                onValueChange={(value) => handleInputChange('currentAge', value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retirementAge">Retirement Age: {inputs.retirementAge}</Label>
              <Slider
                id="retirementAge"
                min={50}
                max={80}
                step={1}
                value={[inputs.retirementAge]}
                onValueChange={(value) => handleInputChange('retirementAge', value[0])}
              />
              <p className="text-sm text-muted-foreground">
                {yearsToRetirement} years until retirement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifeExpectancy">Life Expectancy: {inputs.lifeExpectancy}</Label>
              <Slider
                id="lifeExpectancy"
                min={60}
                max={100}
                step={1}
                value={[inputs.lifeExpectancy]}
                onValueChange={(value) => handleInputChange('lifeExpectancy', value[0])}
              />
              <p className="text-sm text-muted-foreground">
                {yearsInRetirement} years in retirement
              </p>
            </div>
          </div>

          {/* Retirement Spending */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Retirement Spending</h3>

            <div className="space-y-2">
              <Label htmlFor="monthlyExpenses">Monthly Expenses in Retirement</Label>
              <Input
                id="monthlyExpenses"
                type="number"
                value={inputs.monthlyExpenses || 0}
                onChange={(e) => handleInputChange('monthlyExpenses', parseFloat(e.target.value))}
                min={0}
                step={100}
              />
              <p className="text-sm text-muted-foreground">
                ${(inputs.monthlyExpenses || 0).toLocaleString()}/month = ${((inputs.monthlyExpenses || 0) * 12).toLocaleString()}/year
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialSecurityIncome">Social Security / Pension Income</Label>
              <Input
                id="socialSecurityIncome"
                type="number"
                value={inputs.socialSecurityIncome || 0}
                onChange={(e) => handleInputChange('socialSecurityIncome', parseFloat(e.target.value))}
                min={0}
                step={100}
              />
              <p className="text-sm text-muted-foreground">
                Net monthly need: ${((inputs.monthlyExpenses || 0) - (inputs.socialSecurityIncome || 0)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Advanced Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedReturn">Expected Annual Return</Label>
                <Input
                  id="expectedReturn"
                  type="number"
                  value={(inputs.expectedReturn * 100).toFixed(1)}
                  onChange={(e) => handleInputChange('expectedReturn', parseFloat(e.target.value) / 100)}
                  min={-20}
                  max={20}
                  step={0.5}
                />
                <p className="text-sm text-muted-foreground">
                  {(inputs.expectedReturn * 100).toFixed(1)}%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volatility">Volatility (Risk)</Label>
                <Input
                  id="volatility"
                  type="number"
                  value={(inputs.volatility * 100).toFixed(1)}
                  onChange={(e) => handleInputChange('volatility', parseFloat(e.target.value) / 100)}
                  min={0}
                  max={80}
                  step={1}
                />
                <p className="text-sm text-muted-foreground">
                  {(inputs.volatility * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error.statusCode === 402 && (
                  <div>
                    <p className="font-semibold">{error.message}</p>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <a href="/billing/upgrade">Upgrade to Premium</a>
                    </Button>
                  </div>
                )}
                {error.statusCode === 429 && (
                  <div>
                    <p className="font-semibold">{error.message}</p>
                    <p className="text-sm mt-1">Try again tomorrow or upgrade for unlimited access.</p>
                  </div>
                )}
                {error.statusCode !== 402 && error.statusCode !== 429 && (
                  <p>{error.message}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running {inputs.iterations.toLocaleString()} simulations...
              </>
            ) : (
              'Calculate Retirement Plan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
