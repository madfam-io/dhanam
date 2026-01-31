'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowRight, Receipt, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@dhanam/ui';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';

interface SearchResult {
  answer?: string;
  transactions?: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    category?: string;
  }>;
  categoryBreakdown?: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  confidence?: number;
  suggestions?: string[];
}

interface SearchCommandProps {
  spaceId: string;
}

export function SearchCommand({ spaceId }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // Cmd+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !spaceId) return;
    setIsSearching(true);
    try {
      const data = await apiClient.get<SearchResult>(`/spaces/${spaceId}/search`, {
        q: query.trim(),
      });
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [query, spaceId]);

  useEffect(() => {
    if (query.length < 3) {
      setResults(null);
      return;
    }
    const timer = setTimeout(handleSearch, 500);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleClose = () => {
    setOpen(false);
    setQuery('');
    setResults(null);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search transactions... (e.g., 'coffee last month')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-12 w-full bg-transparent py-3 px-3 text-sm outline-none placeholder:text-muted-foreground"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {results && (
              <div className="p-4 space-y-4">
                {/* Answer Summary */}
                {results.answer && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{results.answer}</p>
                    {results.confidence != null && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {Math.round(results.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                )}

                {/* Transaction Results */}
                {results.transactions && results.transactions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      Transactions
                    </h4>
                    {results.transactions.slice(0, 5).map((txn) => (
                      <button
                        type="button"
                        key={txn.id}
                        className="flex w-full items-center justify-between p-2 rounded hover:bg-accent cursor-pointer text-left"
                        onClick={() => {
                          handleClose();
                          router.push(`/transactions?highlight=${txn.id}`);
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.date).toLocaleDateString()} ·{' '}
                            {txn.category || 'Uncategorized'}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {formatCurrency(txn.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Category Breakdown */}
                {results.categoryBreakdown && results.categoryBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      By Category
                    </h4>
                    {results.categoryBreakdown.map((cat) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between text-sm p-2"
                      >
                        <span>{cat.category}</span>
                        <span className="font-medium">
                          {formatCurrency(cat.total)} ({cat.count})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {results.suggestions && results.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Try also
                    </h4>
                    {results.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="flex items-center gap-2 w-full text-left text-sm p-2 rounded hover:bg-accent"
                      >
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* View All Link */}
                {results.transactions && results.transactions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      handleClose();
                      router.push(`/transactions?q=${encodeURIComponent(query)}`);
                    }}
                  >
                    View all results
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {!results && !isSearching && query.length >= 3 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {!results && !isSearching && query.length < 3 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Type at least 3 characters to search
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
