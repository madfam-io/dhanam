'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@dhanam/ui';
import { Badge } from '@dhanam/ui';
import { Input } from '@dhanam/ui';
import { Label } from '@dhanam/ui';
import { Progress } from '@dhanam/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dhanam/ui';
import { Plus, Loader2, PiggyBank, Settings } from 'lucide-react';
import { useSpaceStore } from '@/stores/space';
import { budgetsApi, CategorySummary } from '@/lib/api/budgets';
import { categoriesApi } from '@/lib/api/categories';
import { Budget, BudgetPeriod } from '@dhanam/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { RuleManager } from '@/components/budgets/rule-manager';
import { BudgetAnalytics } from '@/components/budgets/budget-analytics';

export default function BudgetsPage() {
  const { currentSpace } = useSpaceStore();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isRuleManagerOpen, setIsRuleManagerOpen] = useState(false);

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return budgetsApi.getBudgets(currentSpace.id);
    },
    enabled: !!currentSpace,
  });

  const { data: budgetSummary } = useQuery({
    queryKey: ['budget-summary', currentSpace?.id, selectedBudget?.id],
    queryFn: () => {
      if (!currentSpace || !selectedBudget) throw new Error('Missing required data');
      return budgetsApi.getBudgetSummary(currentSpace.id, selectedBudget.id);
    },
    enabled: !!currentSpace && !!selectedBudget,
  });

  const createBudgetMutation = useMutation({
    mutationFn: (data: Parameters<typeof budgetsApi.createBudget>[1]) => {
      if (!currentSpace) throw new Error('No current space');
      return budgetsApi.createBudget(currentSpace.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', currentSpace?.id] });
      setIsCreateOpen(false);
      toast.success('Budget created successfully');
    },
    onError: () => {
      toast.error('Failed to create budget');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: Parameters<typeof categoriesApi.createCategory>[1]) => {
      if (!currentSpace) throw new Error('No current space');
      return categoriesApi.createCategory(currentSpace.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', currentSpace?.id] });
      queryClient.invalidateQueries({
        queryKey: ['budget-summary', currentSpace?.id, selectedBudget?.id],
      });
      setIsAddCategoryOpen(false);
      toast.success('Category added successfully');
    },
    onError: () => {
      toast.error('Failed to add category');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createBudgetMutation.mutate({
      name: formData.get('name') as string,
      period: formData.get('period') as BudgetPeriod,
      startDate: new Date(formData.get('startDate') as string),
    });
  };

  const handleAddCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBudget) return;
    const formData = new FormData(e.currentTarget);
    createCategoryMutation.mutate({
      budgetId: selectedBudget.id,
      name: formData.get('name') as string,
      budgetedAmount: parseFloat(formData.get('budgetedAmount') as string),
    });
  };

  if (!currentSpace) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Create and manage your budgets to track spending</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsRuleManagerOpen(true)} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Manage Rules
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Budget</DialogTitle>
                  <DialogDescription>Set up a new budget to track your spending</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Budget Name</Label>
                    <Input id="name" name="name" placeholder="e.g., Monthly Budget" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="period">Period</Label>
                    <Select name="period" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createBudgetMutation.isPending}>
                    {createBudgetMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Budget
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : budgets?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No budgets yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first budget to start tracking expenses
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets?.map((budget) => (
            <Card
              key={budget.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedBudget(budget)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{budget.name}</CardTitle>
                <Badge variant="secondary">{budget.period}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-4">
                  {formatDate(budget.startDate)} -{' '}
                  {budget.endDate ? formatDate(budget.endDate) : 'Ongoing'}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Categories</span>
                    <span className="font-medium">{budget.categories?.length || 0}</span>
                  </div>
                  {budget.categories && budget.categories.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Total Budget:{' '}
                      {formatCurrency(
                        budget.categories.reduce((sum, cat) => sum + cat.budgeted, 0),
                        currentSpace.currency
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedBudget} onOpenChange={(open) => !open && setSelectedBudget(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedBudget && budgetSummary && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedBudget.name}</DialogTitle>
                <DialogDescription>
                  {formatDate(selectedBudget.startDate)} -{' '}
                  {selectedBudget.endDate ? formatDate(selectedBudget.endDate) : 'Ongoing'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">
                        {formatCurrency(budgetSummary.summary.totalBudgeted, currentSpace.currency)}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Budget</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">
                        {formatCurrency(budgetSummary.summary.totalSpent, currentSpace.currency)}
                      </div>
                      <p className="text-xs text-muted-foreground">Spent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          budgetSummary.summary.totalRemaining,
                          currentSpace.currency
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">
                        {budgetSummary.summary.totalPercentUsed.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Used</p>
                    </CardContent>
                  </Card>
                </div>

                <BudgetAnalytics
                  spaceId={currentSpace.id}
                  budgetId={selectedBudget.id}
                  currency={currentSpace.currency}
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Categories</h4>
                    <Button size="sm" onClick={() => setIsAddCategoryOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </div>
                  {budgetSummary.categories.map(
                    (category: CategorySummary) => (
                      <Card key={category.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color || '#6b7280' }}
                              />
                              <span className="font-medium">{category.name}</span>
                            </div>
                            <Badge
                              variant={category.percentUsed > 90 ? 'destructive' : 'secondary'}
                            >
                              {category.percentUsed.toFixed(0)}% used
                            </Badge>
                          </div>
                          <Progress value={category.percentUsed} className="mb-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>
                              {formatCurrency(category.spent, currentSpace.currency)} spent
                            </span>
                            <span>
                              {formatCurrency(category.remaining, currentSpace.currency)} remaining
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <form onSubmit={handleAddCategorySubmit}>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>Create a new spending category for this budget</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input id="category-name" name="name" placeholder="e.g., Groceries" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budgetedAmount">Budget Amount</Label>
                <Input
                  id="budgetedAmount"
                  name="budgetedAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <RuleManager
        open={isRuleManagerOpen}
        onOpenChange={setIsRuleManagerOpen}
        spaceId={currentSpace.id}
      />
    </div>
  );
}
