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
import { ArrowLeftRight, ArrowRight } from 'lucide-react';

import { formatCurrency, cn } from '@/lib/utils';
import { CategoryAllocationStatus } from '@/lib/api/zero-based';

interface MoveFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryAllocationStatus[];
  currency: Currency;
  preselectedFromCategoryId?: string;
  onMoveFunds: (
    fromCategoryId: string,
    toCategoryId: string,
    amount: number,
    notes?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

export function MoveFundsModal({
  open,
  onOpenChange,
  categories,
  currency,
  preselectedFromCategoryId,
  onMoveFunds,
  isLoading = false,
}: MoveFundsModalProps) {
  const [fromCategoryId, setFromCategoryId] = useState<string>(preselectedFromCategoryId || '');
  const [toCategoryId, setToCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or preselected category changes
  useEffect(() => {
    if (open) {
      setFromCategoryId(preselectedFromCategoryId || '');
      setToCategoryId('');
      setAmount('');
      setNotes('');
      setError(null);
    }
  }, [open, preselectedFromCategoryId]);

  const fromCategory = categories.find((c) => c.categoryId === fromCategoryId);
  const toCategory = categories.find((c) => c.categoryId === toCategoryId);
  const maxAmount = fromCategory?.available || 0;
  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= maxAmount;
  const canSubmit =
    fromCategoryId &&
    toCategoryId &&
    fromCategoryId !== toCategoryId &&
    isValidAmount &&
    !isLoading;

  // Filter out the source category from destination options
  const destinationCategories = categories.filter((c) => c.categoryId !== fromCategoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromCategoryId) {
      setError('Please select a source category');
      return;
    }

    if (!toCategoryId) {
      setError('Please select a destination category');
      return;
    }

    if (fromCategoryId === toCategoryId) {
      setError('Source and destination must be different');
      return;
    }

    if (numericAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (numericAmount > maxAmount) {
      setError(`Amount exceeds available funds in ${fromCategory?.categoryName}`);
      return;
    }

    try {
      await onMoveFunds(fromCategoryId, toCategoryId, numericAmount, notes || undefined);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move funds');
    }
  };

  const handleSwapCategories = () => {
    if (fromCategoryId && toCategoryId) {
      const temp = fromCategoryId;
      setFromCategoryId(toCategoryId);
      setToCategoryId(temp);
      setAmount(''); // Reset amount since available funds may differ
    }
  };

  const handleMoveAll = () => {
    if (maxAmount > 0) {
      setAmount(maxAmount.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Move Funds</DialogTitle>
              <DialogDescription>Transfer money between budget categories</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Category */}
          <div className="space-y-2">
            <Label htmlFor="from-category">From Category</Label>
            <select
              id="from-category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={fromCategoryId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFromCategoryId(e.target.value);
                setAmount(''); // Reset amount when source changes
              }}
            >
              <option value="">Select source category...</option>
              {categories
                .filter((cat) => cat.available > 0) // Only show categories with positive balance
                .map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName} (Available: {formatCurrency(cat.available, currency)})
                  </option>
                ))}
            </select>
            {fromCategory && (
              <p className="text-xs text-muted-foreground">
                Available to move:{' '}
                <span className="font-medium">{formatCurrency(maxAmount, currency)}</span>
              </p>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSwapCategories}
              disabled={!fromCategoryId || !toCategoryId}
              className="text-muted-foreground"
            >
              <ArrowLeftRight className="h-4 w-4 rotate-90" />
              Swap
            </Button>
          </div>

          {/* To Category */}
          <div className="space-y-2">
            <Label htmlFor="to-category">To Category</Label>
            <select
              id="to-category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={toCategoryId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setToCategoryId(e.target.value)
              }
            >
              <option value="">Select destination category...</option>
              {destinationCategories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName} (Available: {formatCurrency(cat.available, currency)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount</Label>
              {maxAmount > 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleMoveAll}
                  className="h-auto p-0 text-xs"
                >
                  Move all
                </Button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={maxAmount}
                placeholder="0.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Reason for moving funds..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
            />
          </div>

          {/* Preview */}
          {fromCategory && toCategory && numericAmount > 0 && (
            <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{fromCategory.categoryName}</span>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(fromCategory.available, currency)}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span
                    className={cn(
                      'font-semibold',
                      fromCategory.available - numericAmount < 0 ? 'text-red-600' : ''
                    )}
                  >
                    {formatCurrency(fromCategory.available - numericAmount, currency)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{toCategory.categoryName}</span>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(toCategory.available, currency)}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(toCategory.available + numericAmount, currency)}
                  </span>
                </div>
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
              {isLoading ? 'Moving...' : 'Move Funds'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
