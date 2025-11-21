'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Car, Globe, TrendingUp, Gem, Palette, Coins, Plus } from 'lucide-react';

interface ManualAssetFormProps {
  onSubmit: (asset: ManualAssetData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<ManualAssetData>;
}

export interface ManualAssetData {
  name: string;
  type: string;
  description?: string;
  currentValue: number;
  currency: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  notes?: string;
}

const ASSET_TYPES = [
  {
    value: 'real_estate',
    label: 'Real Estate',
    icon: Building2,
    color: 'text-blue-600',
  },
  { value: 'vehicle', label: 'Vehicle', icon: Car, color: 'text-green-600' },
  {
    value: 'domain',
    label: 'Web Domain',
    icon: Globe,
    color: 'text-purple-600',
  },
  {
    value: 'private_equity',
    label: 'Private Equity',
    icon: TrendingUp,
    color: 'text-orange-600',
  },
  {
    value: 'angel_investment',
    label: 'Angel Investment',
    icon: TrendingUp,
    color: 'text-red-600',
  },
  {
    value: 'collectible',
    label: 'Collectible',
    icon: Gem,
    color: 'text-pink-600',
  },
  { value: 'art', label: 'Art', icon: Palette, color: 'text-indigo-600' },
  {
    value: 'jewelry',
    label: 'Jewelry',
    icon: Coins,
    color: 'text-yellow-600',
  },
  { value: 'other', label: 'Other', icon: Plus, color: 'text-gray-600' },
];

export function ManualAssetForm({ onSubmit, onCancel, initialData }: ManualAssetFormProps) {
  const [formData, setFormData] = useState<ManualAssetData>({
    name: initialData?.name || '',
    type: initialData?.type || 'real_estate',
    description: initialData?.description || '',
    currentValue: initialData?.currentValue || 0,
    currency: initialData?.currency || 'USD',
    acquisitionDate: initialData?.acquisitionDate || '',
    acquisitionCost: initialData?.acquisitionCost || undefined,
    metadata: initialData?.metadata || {},
    notes: initialData?.notes || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showMetadata, setShowMetadata] = useState(!!initialData?.metadata);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to save asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
    }).format(amount);
  };

  const renderMetadataFields = () => {
    switch (formData.type) {
      case 'real_estate':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Address</Label>
              <Input
                placeholder="123 Main St"
                value={formData.metadata?.address || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, address: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                placeholder="San Francisco"
                value={formData.metadata?.city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, city: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>State/Province</Label>
              <Input
                placeholder="CA"
                value={formData.metadata?.state || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, state: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Square Feet</Label>
              <Input
                type="number"
                placeholder="2500"
                value={formData.metadata?.sqft || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, sqft: parseInt(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        );

      case 'vehicle':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Make</Label>
              <Input
                placeholder="Tesla"
                value={formData.metadata?.make || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, make: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Model</Label>
              <Input
                placeholder="Model 3"
                value={formData.metadata?.model || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, model: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Year</Label>
              <Input
                type="number"
                placeholder="2023"
                value={formData.metadata?.year || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, year: parseInt(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>VIN</Label>
              <Input
                placeholder="1234567890"
                value={formData.metadata?.vin || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, vin: e.target.value },
                  })
                }
              />
            </div>
          </div>
        );

      case 'private_equity':
      case 'angel_investment':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input
                placeholder="Acme Inc."
                value={formData.metadata?.companyName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, companyName: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Investment Date</Label>
              <Input
                type="date"
                value={formData.metadata?.investmentDate || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, investmentDate: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Ownership %</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="5.5"
                value={formData.metadata?.ownershipPercentage || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      ownershipPercentage: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>Shares Owned</Label>
              <Input
                type="number"
                placeholder="10000"
                value={formData.metadata?.shares || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, shares: parseInt(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        );

      case 'domain':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Domain Name</Label>
              <Input
                placeholder="example.com"
                value={formData.metadata?.domain || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, domain: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Registrar</Label>
              <Input
                placeholder="GoDaddy"
                value={formData.metadata?.registrar || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, registrar: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.metadata?.expiryDate || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, expiryDate: e.target.value },
                  })
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Manual Asset' : 'Add Manual Asset'}</CardTitle>
        <CardDescription>
          Track illiquid assets like real estate, private equity, and collectibles
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Type Selection */}
          <div className="space-y-2">
            <Label>Asset Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {ASSET_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${type.color}`} />
                    <span className="text-sm">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Asset Name *</Label>
              <Input
                required
                placeholder="e.g., Downtown Condo, Model S, Acme Inc."
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Current Value *</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={formData.currentValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, currentValue: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Acquisition Information */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Currency</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.currency}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
            <div>
              <Label>Acquisition Date</Label>
              <Input
                type="date"
                value={formData.acquisitionDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, acquisitionDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Acquisition Cost</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Original purchase price"
                value={formData.acquisitionCost || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    acquisitionCost: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Unrealized Gain/Loss */}
          {formData.acquisitionCost && formData.currentValue && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Unrealized Gain/Loss:</span>
                <span
                  className={`text-lg font-bold ${
                    formData.currentValue - formData.acquisitionCost >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(formData.currentValue - formData.acquisitionCost)}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description of the asset..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Type-Specific Metadata */}
          {showMetadata && (
            <div className="space-y-2">
              <Label className="font-semibold">Asset Details</Label>
              {renderMetadataFields()}
            </div>
          )}

          {!showMetadata && (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowMetadata(true)}>
              Add Asset Details
            </Button>
          )}

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes, appraisal info, etc..."
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update Asset' : 'Add Asset'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
