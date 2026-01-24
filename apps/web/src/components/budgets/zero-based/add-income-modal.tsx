'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from '@dhanam/ui';
import { Currency } from '@dhanam/shared';
import { Banknote, Calendar } from 'lucide-react';

import { CreateIncomeEventDto } from '@/lib/api/zero-based';

interface AddIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
  onAddIncome: (dto: CreateIncomeEventDto) => Promise<void>;
  isLoading?: boolean;
}

const INCOME_SOURCES = [
  { value: 'salary', label: 'Salary' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investment Income' },
  { value: 'rental', label: 'Rental Income' },
  { value: 'refund', label: 'Refund' },
  { value: 'gift', label: 'Gift' },
  { value: 'other', label: 'Other' },
];

export function AddIncomeModal({
  open,
  onOpenChange,
  currency,
  onAddIncome,
  isLoading = false,
}: AddIncomeModalProps) {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [description, setDescription] = useState('');
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount('');
      setSource('');
      setCustomSource('');
      setDescription('');
      setReceivedAt(new Date().toISOString().split('T')[0]!);
      setError(null);
    }
  }, [open]);

  const numericAmount = parseFloat(amount) || 0;
  const effectiveSource = source === 'other' ? customSource : source;
  const canSubmit = numericAmount > 0 && effectiveSource && receivedAt && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (!effectiveSource) {
      setError('Please select or enter an income source');
      return;
    }

    if (!receivedAt) {
      setError('Please select a date');
      return;
    }

    try {
      await onAddIncome({
        amount: numericAmount,
        currency,
        source: effectiveSource,
        description: description || undefined,
        receivedAt: new Date(receivedAt).toISOString(),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add income');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Banknote className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Add Income</DialogTitle>
              <DialogDescription>Record money you've received to allocate</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                className="pl-7 text-lg"
              />
            </div>
          </div>

          {/* Source Selection */}
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <select
              id="source"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={source}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSource(e.target.value)}
            >
              <option value="">Select a source...</option>
              {INCOME_SOURCES.map((src) => (
                <option key={src.value} value={src.value}>
                  {src.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Source (if "Other" selected) */}
          {source === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-source">Custom Source</Label>
              <Input
                id="custom-source"
                placeholder="Enter income source..."
                value={customSource}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomSource(e.target.value)
                }
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="received-at">Date Received</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="received-at"
                type="date"
                value={receivedAt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReceivedAt(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Add details about this income..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading ? 'Adding...' : 'Add Income'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
