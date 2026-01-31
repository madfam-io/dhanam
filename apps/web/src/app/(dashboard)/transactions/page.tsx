'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam/ui';
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
import { Input } from '@dhanam/ui';
import { Label } from '@dhanam/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@dhanam/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dhanam/ui';
import {
  Plus,
  MoreVertical,
  Loader2,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSpaceStore } from '@/stores/space';
import { transactionsApi } from '@/lib/api/transactions';
import { accountsApi } from '@/lib/api/accounts';
import { Transaction, useTranslation } from '@dhanam/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 25;

const TRANSACTION_ROW_HEIGHT = 80; // Estimated height of each transaction row

export default function TransactionsPage() {
  const { t } = useTranslation('transactions');
  const { currentSpace } = useSpaceStore();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', currentSpace?.id, page],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return transactionsApi.getTransactions(currentSpace.id, {
        page,
        limit: ITEMS_PER_PAGE,
        sortBy: 'date',
        sortOrder: 'desc',
      });
    },
    enabled: !!currentSpace,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return accountsApi.getAccounts(currentSpace.id);
    },
    enabled: !!currentSpace,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof transactionsApi.createTransaction>[1]) => {
      if (!currentSpace) throw new Error('No current space');
      return transactionsApi.createTransaction(currentSpace.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      setIsCreateOpen(false);
      toast.success(t('toast.createSuccess'));
    },
    onError: () => {
      toast.error(t('toast.createFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof transactionsApi.updateTransaction>[2];
    }) => {
      if (!currentSpace) throw new Error('No current space');
      return transactionsApi.updateTransaction(currentSpace.id, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      setSelectedTransaction(null);
      toast.success(t('toast.updateSuccess'));
    },
    onError: () => {
      toast.error(t('toast.updateFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (transactionId: string) => {
      if (!currentSpace) throw new Error('No current space');
      return transactionsApi.deleteTransaction(currentSpace.id, transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      toast.success(t('toast.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('toast.deleteFailed'));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      accountId: formData.get('accountId') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: new Date(formData.get('date') as string),
      description: formData.get('description') as string,
      merchant: (formData.get('merchant') as string) || undefined,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedTransaction.id,
      data: {
        amount: parseFloat(formData.get('amount') as string),
        date: new Date(formData.get('date') as string),
        description: formData.get('description') as string,
        merchant: (formData.get('merchant') as string) || undefined,
      },
    });
  };

  // Virtualization setup for smooth scrolling with large lists
  const rowVirtualizer = useVirtualizer({
    count: transactionsData?.data.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TRANSACTION_ROW_HEIGHT,
    overscan: 5, // Render 5 extra items outside visible area for smooth scrolling
  });

  if (!currentSpace) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('page.title')}</h1>
          <p className="text-muted-foreground">{t('page.description')}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('button.addTransaction')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>{t('dialog.create.title')}</DialogTitle>
                <DialogDescription>{t('dialog.create.description')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="accountId">{t('form.account')}</Label>
                  <Select name="accountId" required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance, account.currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">{t('form.amount')}</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">{t('form.date')}</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">{t('form.description')}</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder={t('form.descriptionPlaceholder')}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="merchant">{t('form.merchantOptional')}</Label>
                  <Input
                    id="merchant"
                    name="merchant"
                    placeholder={t('form.merchantPlaceholder')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('button.createTransaction')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingTransactions ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : transactionsData?.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground text-center mb-4">{t('empty.description')}</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('empty.addFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('list.title')}</CardTitle>
            <CardDescription>
              {transactionsData?.total} {t('list.found')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Virtualized list container */}
            <div ref={parentRef} className="h-[500px] overflow-auto" style={{ contain: 'strict' }}>
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const transaction = transactionsData?.data[virtualItem.index];
                  if (!transaction) return null;
                  const account = accounts?.find((a) => a.id === transaction.accountId);

                  return (
                    <div
                      key={transaction.id}
                      className="absolute top-0 left-0 w-full"
                      style={{
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors mx-1 my-1">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded-full">
                            <Receipt className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(transaction.date)}
                              {account && (
                                <>
                                  <span>•</span>
                                  <span>{account.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p
                              className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                            >
                              {formatCurrency(
                                transaction.amount,
                                account?.currency || transaction.currency
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {account?.name || t('list.unknownAccount')}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedTransaction(transaction)}>
                                {t('action.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(transaction.id)}
                                className="text-destructive"
                              >
                                {t('action.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            {transactionsData && transactionsData.total > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(page * ITEMS_PER_PAGE, transactionsData.total)} of{' '}
                  {transactionsData.total} transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('pagination.previous')}
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {page} of {Math.ceil(transactionsData.total / ITEMS_PER_PAGE)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * ITEMS_PER_PAGE >= transactionsData.total}
                  >
                    {t('pagination.next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!selectedTransaction}
        onOpenChange={(open: boolean) => !open && setSelectedTransaction(null)}
      >
        <DialogContent>
          {selectedTransaction && (
            <form onSubmit={handleUpdateSubmit}>
              <DialogHeader>
                <DialogTitle>{t('dialog.edit.title')}</DialogTitle>
                <DialogDescription>{t('dialog.edit.description')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">{t('form.amount')}</Label>
                  <Input
                    id="edit-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={selectedTransaction.amount}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">{t('form.date')}</Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="date"
                    defaultValue={new Date(selectedTransaction.date).toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">{t('form.description')}</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={selectedTransaction.description}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-merchant">{t('form.merchantOptional')}</Label>
                  <Input id="edit-merchant" name="merchant" defaultValue="" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('button.updateTransaction')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
