'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@dhanam/ui/card';
import { Button } from '@dhanam/ui/button';
import { Badge } from '@dhanam/ui/badge';
import { Progress } from '@dhanam/ui/progress';
import { Alert, AlertDescription } from '@dhanam/ui/alert';
import {
  Leaf,
  Users,
  Shield,
  TrendingUp,
  Lightbulb,
  Award,
  Zap,
  Info,
  RefreshCw,
} from 'lucide-react';
import { esgApi } from '@/lib/api/esg';
import { formatCurrency } from '@/lib/utils';

function getGradeColor(grade: string) {
  if (grade.startsWith('A')) return 'bg-green-500';
  if (grade.startsWith('B')) return 'bg-blue-500';
  if (grade.startsWith('C')) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreColor(score: number) {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-yellow-600';
  return 'text-red-600';
}

export default function EsgPage() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['BTC', 'ETH', 'ADA']);

  const { data: portfolioEsg, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery({
    queryKey: ['esg', 'portfolio'],
    queryFn: () => esgApi.getPortfolioAnalysis(),
  });

  const { data: comparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['esg', 'comparison', selectedAssets],
    queryFn: () => esgApi.compareAssets(selectedAssets),
    enabled: selectedAssets.length > 0,
  });

  const { data: trends } = useQuery({
    queryKey: ['esg', 'trends'],
    queryFn: () => esgApi.getTrends(),
  });

  const { data: methodology } = useQuery({
    queryKey: ['esg', 'methodology'],
    queryFn: () => esgApi.getMethodology(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ESG Analysis</h1>
          <p className="text-muted-foreground">
            Environmental, Social, and Governance scoring for your crypto portfolio
          </p>
        </div>
        <Button
          onClick={() => refetchPortfolio()}
          disabled={portfolioLoading}
          variant="outline"
        >
          {portfolioLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Portfolio ESG Overview */}
      {portfolioEsg ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Portfolio ESG Score
              </CardTitle>
              <CardDescription>
                Overall sustainability rating for your cryptocurrency holdings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">
                    {portfolioEsg.overallScore}
                  </div>
                  <Badge
                    className={`${getGradeColor(portfolioEsg.grade)} text-white`}
                  >
                    {portfolioEsg.grade}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">ESG Grade</p>
                  <p className="font-medium">Portfolio Rating</p>
                </div>
              </div>

              {/* ESG Breakdown */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Environmental</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={portfolioEsg.breakdown.environmental} className="flex-1" />
                    <span className={`text-sm font-medium ${getScoreColor(portfolioEsg.breakdown.environmental)}`}>
                      {portfolioEsg.breakdown.environmental}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Social</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={portfolioEsg.breakdown.social} className="flex-1" />
                    <span className={`text-sm font-medium ${getScoreColor(portfolioEsg.breakdown.social)}`}>
                      {portfolioEsg.breakdown.social}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Governance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={portfolioEsg.breakdown.governance} className="flex-1" />
                    <span className={`text-sm font-medium ${getScoreColor(portfolioEsg.breakdown.governance)}`}>
                      {portfolioEsg.breakdown.governance}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Holdings ESG Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Holdings ESG Analysis</CardTitle>
              <CardDescription>
                ESG performance of individual assets in your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioEsg.holdings.map((holding) => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold">{holding.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {(holding.weight * 100).toFixed(1)}% of portfolio
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          Score: {holding.esgScore.overallScore}
                        </p>
                        <Badge
                          variant="outline"
                          className={`${getGradeColor(holding.esgScore.grade)} text-white border-0`}
                        >
                          {holding.esgScore.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ESG Insights */}
          {portfolioEsg.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  ESG Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {portfolioEsg.insights.map((insight, index) => (
                    <Alert key={index}>
                      <Info className="h-4 w-4" />
                      <AlertDescription>{insight}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : portfolioLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading ESG analysis...</span>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No crypto holdings found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your crypto accounts to see ESG analysis of your portfolio
            </p>
          </CardContent>
        </Card>
      )}

      {/* Asset Comparison */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Asset ESG Comparison
            </CardTitle>
            <CardDescription>
              Compare ESG scores across different cryptocurrencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{comparison.summary}</p>
              
              <div className="grid gap-4">
                {comparison.comparison.map((asset) => (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-semibold">{asset.symbol}</p>
                      {asset.consensusMechanism && (
                        <p className="text-xs text-muted-foreground">
                          {asset.consensusMechanism}
                        </p>
                      )}
                      {asset.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {asset.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <Leaf className="h-3 w-3 mx-auto text-green-600" />
                          <div className={getScoreColor(asset.environmentalScore)}>
                            {asset.environmentalScore}
                          </div>
                        </div>
                        <div className="text-center">
                          <Users className="h-3 w-3 mx-auto text-blue-600" />
                          <div className={getScoreColor(asset.socialScore)}>
                            {asset.socialScore}
                          </div>
                        </div>
                        <div className="text-center">
                          <Shield className="h-3 w-3 mx-auto text-purple-600" />
                          <div className={getScoreColor(asset.governanceScore)}>
                            {asset.governanceScore}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-lg">{asset.overallScore}</p>
                        <Badge
                          variant="outline"
                          className={`${getGradeColor(asset.grade)} text-white border-0`}
                        >
                          {asset.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Energy Impact */}
              {comparison.comparison.some(asset => asset.energyIntensity) && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    Energy Impact Comparison
                  </h4>
                  <div className="space-y-2">
                    {comparison.comparison
                      .filter(asset => asset.energyIntensity)
                      .sort((a, b) => (a.energyIntensity || 0) - (b.energyIntensity || 0))
                      .map((asset) => (
                        <div key={asset.symbol} className="flex justify-between text-sm">
                          <span>{asset.symbol}</span>
                          <span>
                            {asset.energyIntensity?.toLocaleString()} kWh/transaction
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ESG Trends */}
      {trends && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
              <CardDescription>ESG performance trends in crypto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2 text-green-600">Improving ESG</h4>
                <div className="flex flex-wrap gap-2">
                  {trends.trending.improving.map((symbol) => (
                    <Badge key={symbol} variant="outline" className="border-green-600 text-green-600">
                      {symbol}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2 text-red-600">Under Pressure</h4>
                <div className="flex flex-wrap gap-2">
                  {trends.trending.declining.map((symbol) => (
                    <Badge key={symbol} variant="outline" className="border-red-600 text-red-600">
                      {symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Improve your portfolio's ESG score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trends.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    • {rec}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Methodology */}
      {methodology && (
        <Card>
          <CardHeader>
            <CardTitle>ESG Methodology</CardTitle>
            <CardDescription>
              {methodology.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    Environmental
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {methodology.scoring.environmental.description}
                  </p>
                  <p className="text-xs font-medium">
                    Weight: {methodology.scoring.environmental.weight}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Social
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {methodology.scoring.social.description}
                  </p>
                  <p className="text-xs font-medium">
                    Weight: {methodology.scoring.social.weight}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    Governance
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {methodology.scoring.governance.description}
                  </p>
                  <p className="text-xs font-medium">
                    Weight: {methodology.scoring.governance.weight}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}