'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Button,
} from '@dhanam/ui';
import { Currency } from '@dhanam/shared';
import { Search, SortAsc, SortDesc, AlertTriangle } from 'lucide-react';

import { CategoryAllocationStatus } from '@/lib/api/zero-based';
import { CategoryRow, CategoryRowCompact } from './category-row';

interface CategoryAllocationListProps {
  categories: CategoryAllocationStatus[];
  currency: Currency;
  onAllocate: (categoryId: string) => void;
  onMoveFunds: (categoryId: string) => void;
  onEditGoal: (categoryId: string) => void;
}

type SortField = 'name' | 'allocated' | 'spent' | 'available';
type SortDirection = 'asc' | 'desc';
type FilterOption = 'all' | 'overspent' | 'underfunded' | 'on-track';

export function CategoryAllocationList({
  categories,
  currency,
  onAllocate,
  onMoveFunds,
  onEditGoal,
}: CategoryAllocationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState<FilterOption>('all');

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((cat) => cat.categoryName.toLowerCase().includes(query));
    }

    // Apply status filter
    switch (filter) {
      case 'overspent':
        result = result.filter((cat) => cat.isOverspent);
        break;
      case 'underfunded':
        result = result.filter(
          (cat) => !cat.isOverspent && cat.goalProgress !== undefined && cat.goalProgress < 100
        );
        break;
      case 'on-track':
        result = result.filter(
          (cat) => !cat.isOverspent && (cat.goalProgress === undefined || cat.goalProgress >= 100)
        );
        break;
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.categoryName.localeCompare(b.categoryName);
          break;
        case 'allocated':
          comparison = a.allocated - b.allocated;
          break;
        case 'spent':
          comparison = a.spent - b.spent;
          break;
        case 'available':
          comparison = a.available - b.available;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [categories, searchQuery, sortField, sortDirection, filter]);

  // Summary stats
  const overspentCount = categories.filter((c) => c.isOverspent).length;
  const underfundedCount = categories.filter(
    (c) => !c.isOverspent && c.goalProgress !== undefined && c.goalProgress < 100
  ).length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = sortDirection === 'asc' ? SortAsc : SortDesc;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Category Allocations</CardTitle>
            <CardDescription>
              {categories.length} categories •{' '}
              {overspentCount > 0 && (
                <span className="text-red-600">{overspentCount} overspent</span>
              )}
              {overspentCount > 0 && underfundedCount > 0 && ' • '}
              {underfundedCount > 0 && (
                <span className="text-amber-600">{underfundedCount} underfunded</span>
              )}
            </CardDescription>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <div className="flex gap-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'overspent', label: 'Overspent' },
              { value: 'underfunded', label: 'Underfunded' },
              { value: 'on-track', label: 'On Track' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(option.value as FilterOption)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex-1" />

          <span className="text-sm text-muted-foreground">Sort:</span>
          <div className="flex gap-1">
            {[
              { value: 'name', label: 'Name' },
              { value: 'allocated', label: 'Allocated' },
              { value: 'available', label: 'Available' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={sortField === option.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleSort(option.value as SortField)}
                className="gap-1"
              >
                {option.label}
                {sortField === option.value && <SortIcon className="h-3 w-3" />}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Overspent Warning */}
        {overspentCount > 0 && filter === 'all' && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span>
              {overspentCount} {overspentCount === 1 ? 'category is' : 'categories are'} overspent.
              Consider moving funds to cover the deficit.
            </span>
          </div>
        )}

        {/* Category List */}
        {filteredCategories.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchQuery || filter !== 'all'
              ? 'No categories match your filters'
              : 'No categories found'}
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden space-y-2 md:block">
              {filteredCategories.map((category) => (
                <CategoryRow
                  key={category.categoryId}
                  category={category}
                  currency={currency}
                  onAllocate={onAllocate}
                  onMoveFunds={onMoveFunds}
                  onEditGoal={onEditGoal}
                />
              ))}
            </div>

            {/* Mobile View */}
            <div className="space-y-2 md:hidden">
              {filteredCategories.map((category) => (
                <CategoryRowCompact
                  key={category.categoryId}
                  category={category}
                  currency={currency}
                  onAllocate={onAllocate}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
