'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, RefreshCw, Loader2 } from 'lucide-react';
import { useEsg } from '@/hooks/useEsg';
import { EsgPortfolioSummary } from '@/components/esg/esg-portfolio-summary';
import { EsgHoldingsBreakdown } from '@/components/esg/esg-holdings-breakdown';
import { EsgInsights } from '@/components/esg/esg-insights';
import type { PortfolioEsgAnalysis, EsgTrends } from '@/hooks/useEsg';

export default function EsgPage() {
  const { getPortfolioAnalysis, getTrends, loading } = useEsg();
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioEsgAnalysis | null>(null);
  const [trends, setTrends] = useState<EsgTrends | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    const [analysisData, trendsData] = await Promise.all([
      getPortfolioAnalysis(),
      getTrends(),
    ]);

    if (analysisData) setPortfolioAnalysis(analysisData);
    if (trendsData) setTrends(trendsData);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
            <Leaf className="h-8 w-8 text-green-600" />
            ESG Portfolio Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Environmental, Social, and Governance scoring for your crypto portfolio
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="lg"
        >
          {refreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {loading && !portfolioAnalysis ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading ESG analysis...</p>
          </CardContent>
        </Card>
      ) : portfolioAnalysis ? (
        <>
          {/* Portfolio Summary */}
          <EsgPortfolioSummary analysis={portfolioAnalysis} />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Holdings Breakdown */}
            <div className="lg:col-span-2">
              <EsgHoldingsBreakdown analysis={portfolioAnalysis} />
            </div>

            {/* Insights and Trends */}
            <div className="lg:col-span-1">
              <EsgInsights analysis={portfolioAnalysis} trends={trends} />
            </div>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Leaf className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No crypto holdings found</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Connect your crypto accounts to see ESG analysis of your portfolio. The system
              will automatically analyze your holdings using the Dhanam ESG Framework.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
