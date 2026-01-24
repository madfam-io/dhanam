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
import { Wallet, ArrowRight } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { CategoryAllocationStatus } from '@/lib/api/zero-based';

interface AllocateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryAllocationStatus[];
  unallocated: number;
  currency: Currency;
  preselectedCategoryId?: string;
  onAllocate: (categoryId: string, amount: number, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

const QUICK_AMOUNTS = [50, 100, 250, 500];

export function AllocateModal({
  open,
  onOpenChange,
  categories,
  unallocated,
  currency,
  preselectedCategoryId,
  onAllocate,
  isLoading = false,
}: AllocateModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(preselectedCategoryId || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or preselected category changes
  useEffect(() => {
    if (open) {
      setSelectedCategoryId(preselectedCategoryId || '');
      setAmount('');
      setNotes('');
      setError(null);
    }
  }, [open, preselectedCategoryId]);

  const selectedCategory = categories.find((c) => c.categoryId === selectedCategoryId);
  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= unallocated;
  const canSubmit = selectedCategoryId && isValidAmount && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    if (numericAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (numericAmount > unallocated) {
      setError(`Amount exceeds available funds (${formatCurrency(unallocated, currency)})`);
      return;
    }

    try {
      await onAllocate(selectedCategoryId, numericAmount, notes || undefined);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to allocate funds');
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    const newAmount = Math.min(quickAmount, unallocated);
    setAmount(newAmount.toString());
  };

  const handleAllocateAll = () => {
    setAmount(unallocated.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Allocate Funds</DialogTitle>
              <DialogDescription>Assign money to a budget category</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Available to Allocate */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">Available to allocate</p>
            <p className="text-xl font-bold">{formatCurrency(unallocated, currency)}</p>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedCategoryId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedCategoryId(e.target.value)
              }
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName} (Available: {formatCurrency(cat.available, currency)})
                </option>
              ))}
            </select>
          </div>

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
                max={unallocated}
                placeholder="0.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <Button
                key={quickAmount}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(quickAmount)}
                disabled={unallocated < quickAmount}
              >
                ${quickAmount}
              </Button>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAllocateAll}
              disabled={unallocated <= 0}
            >
              All ({formatCurrency(unallocated, currency)})
            </Button>
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Add a note..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
            />
          </div>

          {/* Preview */}
          {selectedCategory && numericAmount > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
              <span>{selectedCategory.categoryName}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {formatCurrency(selectedCategory.allocated, currency)}
                </span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(selectedCategory.allocated + numericAmount, currency)}
                </span>
              </div>
            </div>
          )}

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
              {isLoading ? 'Allocating...' : 'Allocate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
