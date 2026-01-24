'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Car,
  Globe,
  TrendingUp,
  Gem,
  Palette,
  Coins,
  Plus,
  FileText,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ManualAssetForm, type ManualAssetData } from '@/components/assets/manual-asset-form';
import { apiClient } from '@/lib/api/client';
import { useSpaceStore } from '@/stores/space';

interface ManualAsset {
  id: string;
  name: string;
  type: string;
  description?: string;
  currentValue: number;
  currency: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  documents?: { key: string }[];
  createdAt: string;
  updatedAt: string;
}

interface AssetTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const DEFAULT_ASSET_CONFIG: AssetTypeConfig = {
  label: 'Other',
  icon: Plus,
  color: 'text-gray-600 bg-gray-100',
};

const ASSET_TYPE_CONFIG: Record<string, AssetTypeConfig> = {
  real_estate: { label: 'Real Estate', icon: Building2, color: 'text-blue-600 bg-blue-100' },
  vehicle: { label: 'Vehicle', icon: Car, color: 'text-green-600 bg-green-100' },
  domain: { label: 'Web Domain', icon: Globe, color: 'text-purple-600 bg-purple-100' },
  private_equity: {
    label: 'Private Equity',
    icon: TrendingUp,
    color: 'text-orange-600 bg-orange-100',
  },
  angel_investment: {
    label: 'Angel Investment',
    icon: TrendingUp,
    color: 'text-red-600 bg-red-100',
  },
  collectible: { label: 'Collectible', icon: Gem, color: 'text-pink-600 bg-pink-100' },
  art: { label: 'Art', icon: Palette, color: 'text-indigo-600 bg-indigo-100' },
  jewelry: { label: 'Jewelry', icon: Coins, color: 'text-yellow-600 bg-yellow-100' },
  other: DEFAULT_ASSET_CONFIG,
};

function getAssetTypeConfig(type: string): AssetTypeConfig {
  return ASSET_TYPE_CONFIG[type] ?? DEFAULT_ASSET_CONFIG;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AssetsPage() {
  const currentSpaceId = useSpaceStore((state) => state.currentSpace?.id);
  const [assets, setAssets] = useState<ManualAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const fetchAssets = useCallback(async () => {
    if (!currentSpaceId) return;
    try {
      const data = await apiClient.get<ManualAsset[]>(`/spaces/${currentSpaceId}/manual-assets`);
      setAssets(data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentSpaceId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleCreateAsset = async (data: ManualAssetData) => {
    if (!currentSpaceId) return;
    await apiClient.post(`/spaces/${currentSpaceId}/manual-assets`, data);
    setIsCreateDialogOpen(false);
    fetchAssets();
  };

  const totalValue = assets.reduce((sum, asset) => {
    // Simple aggregation - in production would need currency conversion
    return sum + asset.currentValue;
  }, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manual Assets</h1>
          <p className="text-muted-foreground">
            Track illiquid assets like real estate, private equity, and collectibles
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Manual Asset</DialogTitle>
              <DialogDescription>
                Track an illiquid asset that cannot be automatically synced
              </DialogDescription>
            </DialogHeader>
            <ManualAssetForm
              onSubmit={handleCreateAsset}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
          <CardDescription>Total value of all manually tracked assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(totalValue, 'USD')}</div>
          <p className="text-sm text-muted-foreground mt-1">{assets.length} assets tracked</p>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No assets yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your illiquid assets like real estate, private equity, and collectibles
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const typeConfig = getAssetTypeConfig(asset.type);
            const Icon = typeConfig.icon;
            const documentCount = asset.documents?.length || 0;

            return (
              <Link key={asset.id} href={`/assets/${asset.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-2 rounded-lg ${typeConfig.color.split(' ')[1]} inline-flex`}
                      >
                        <Icon className={`h-5 w-5 ${typeConfig.color.split(' ')[0]}`} />
                      </div>
                      <Badge variant="secondary">{typeConfig.label}</Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{asset.name}</CardTitle>
                    {asset.description && (
                      <CardDescription className="line-clamp-2">
                        {asset.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(asset.currentValue, asset.currency)}
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>
                          {documentCount} document{documentCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
