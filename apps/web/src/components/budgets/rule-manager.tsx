'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@dhanam/ui';
import { Input } from '@dhanam/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dhanam/ui';
import { Badge } from '@dhanam/ui';
import { Alert, AlertDescription } from '@dhanam/ui';
import { Plus, Loader2, Settings, TestTube, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { rulesApi, CreateRuleDto, TestRuleDto } from '@/lib/api/rules';
import { categoriesApi } from '@/lib/api/categories';

interface RuleManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
}

export function RuleManager({ open, onOpenChange, spaceId }: RuleManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [testResult, setTestResult] = useState<{
    matchCount: number;
    sampleMatches?: Array<{ id: string; description: string; amount: number }>;
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['transaction-rules', spaceId],
    queryFn: () => rulesApi.getRules(spaceId),
    enabled: open && !!spaceId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', spaceId],
    queryFn: () => categoriesApi.getCategories(spaceId),
    enabled: open && !!spaceId,
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: CreateRuleDto) => rulesApi.createRule(spaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-rules', spaceId] });
      setIsCreateOpen(false);
      toast.success('Rule created successfully');
    },
    onError: () => {
      toast.error('Failed to create rule');
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: (params: { ruleId: string; isActive: boolean }) =>
      rulesApi.toggleRule(spaceId, params.ruleId, params.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-rules', spaceId] });
      toast.success('Rule updated successfully');
    },
    onError: () => {
      toast.error('Failed to update rule');
    },
  });

  const testRuleMutation = useMutation({
    mutationFn: (data: TestRuleDto) => rulesApi.testRule(spaceId, data),
    onSuccess: (data) => {
      setTestResult(data);
      toast.success(`Rule would match ${data.matchCount} transactions`);
    },
    onError: () => {
      toast.error('Failed to test rule');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRuleMutation.mutate({
      name: formData.get('name') as string,
      pattern: formData.get('pattern') as string,
      field: formData.get('field') as CreateRuleDto['field'],
      operator: formData.get('operator') as CreateRuleDto['operator'],
      value: formData.get('value') as string,
      priority: parseInt(formData.get('priority') as string),
      categoryId: formData.get('categoryId') as string,
    });
  };

  const handleTestRule = () => {
    const form = document.getElementById('rule-form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      testRuleMutation.mutate({
        pattern: formData.get('pattern') as string,
        field: formData.get('field') as TestRuleDto['field'],
        operator: formData.get('operator') as TestRuleDto['operator'],
        value: formData.get('value') as string,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Transaction Categorization Rules
          </DialogTitle>
          <DialogDescription>
            Create rules to automatically categorize transactions based on patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Rules are applied in priority order (lower numbers first)
            </p>
            <Button onClick={() => setIsCreateOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rules?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No rules yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create rules to automatically categorize transactions
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules?.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">#{rule.priority}</span>
                        </div>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.field} {rule.operator} &quot;{rule.value}&quot;
                          </p>
                        </div>
                        {rule.category && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: rule.category.color }}
                            />
                            {rule.category.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleRuleMutation.mutate({
                              ruleId: rule.id,
                              isActive: !rule.isActive,
                            })
                          }
                        >
                          {rule.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Categorization Rule</DialogTitle>
              <DialogDescription>
                Define a pattern to automatically categorize transactions
              </DialogDescription>
            </DialogHeader>

            <form id="rule-form" onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="rule-name" className="text-sm font-medium">
                  Rule Name
                </label>
                <Input id="rule-name" name="name" placeholder="e.g., Grocery Stores" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="field" className="text-sm font-medium">
                    Field
                  </label>
                  <Select name="field" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="description">Description</SelectItem>
                      <SelectItem value="merchant">Merchant</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="operator" className="text-sm font-medium">
                    Operator
                  </label>
                  <Select name="operator" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="startsWith">Starts with</SelectItem>
                      <SelectItem value="endsWith">Ends with</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                      <SelectItem value="gte">Greater than</SelectItem>
                      <SelectItem value="lte">Less than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="value" className="text-sm font-medium">
                  Pattern Value
                </label>
                <Input
                  id="value"
                  name="value"
                  placeholder="e.g., walmart|target|grocery"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority (1 = highest)
                </label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  min="1"
                  defaultValue="10"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="categoryId" className="text-sm font-medium">
                  Category
                </label>
                <Select name="categoryId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestRule}
                  disabled={testRuleMutation.isPending}
                  className="flex-1"
                >
                  {testRuleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Rule
                    </>
                  )}
                </Button>

                <Button type="submit" disabled={createRuleMutation.isPending} className="flex-1">
                  {createRuleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Rule'
                  )}
                </Button>
              </div>

              {testResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Test Results:</strong> Would match {testResult.matchCount} transactions
                    {testResult.sampleMatches?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium">Sample matches:</p>
                        {testResult.sampleMatches
                          .slice(0, 3)
                          .map((match: { id: string; description: string; amount: number }) => (
                            <p key={match.id} className="text-xs text-muted-foreground">
                              • {match.description} ({match.amount < 0 ? '-' : ''}$
                              {Math.abs(match.amount)})
                            </p>
                          ))}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
