'use client';

import { Link2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChainData {
  chain: string;
  totalValueUsd: number;
  platformCount: number;
  platforms: string[];
}

interface CrossChainViewProps {
  chains: ChainData[];
  totalValueUsd: number;
}

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  ronin: 'Ronin',
  solana: 'Solana',
  galachain: 'GalaChain',
  'immutable-zkevm': 'Immutable zkEVM',
  arbitrum: 'Arbitrum',
};

const CHAIN_COLORS: Record<string, string> = {
  ethereum: 'bg-blue-500',
  polygon: 'bg-purple-500',
  ronin: 'bg-sky-500',
  solana: 'bg-green-500',
  galachain: 'bg-orange-500',
  'immutable-zkevm': 'bg-emerald-500',
  arbitrum: 'bg-indigo-500',
};

export function CrossChainView({ chains, totalValueUsd }: CrossChainViewProps) {
  const sorted = [...chains].sort((a, b) => b.totalValueUsd - a.totalValueUsd);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-5 w-5" />
            Cross-Chain View
          </CardTitle>
          <span className="text-sm font-semibold">{formatUsd(totalValueUsd)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((c) => {
            const pct = totalValueUsd > 0 ? (c.totalValueUsd / totalValueUsd) * 100 : 0;
            return (
              <div key={c.chain}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${CHAIN_COLORS[c.chain] || 'bg-gray-400'}`}
                    />
                    <span className="text-sm font-medium">{CHAIN_LABELS[c.chain] || c.chain}</span>
                  </div>
                  <span className="text-sm">
                    {formatUsd(c.totalValueUsd)} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full ${CHAIN_COLORS[c.chain] || 'bg-gray-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.platforms.map((p) => p.replace('-', ' ')).join(', ')}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
