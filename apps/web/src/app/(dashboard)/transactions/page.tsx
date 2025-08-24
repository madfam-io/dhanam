'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@dhanam/ui/card';
import { Button } from '@dhanam/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@dhanam/ui/dialog';
import { Badge } from '@dhanam/ui/badge';
import { Input } from '@dhanam/ui/input';
import { Label } from '@dhanam/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@dhanam/ui/dropdown-menu';
import { Plus, MoreVertical, Loader2, Receipt, Calendar, DollarSign } from 'lucide-react';
import { useSpaceStore } from '@/stores/space';
import { transactionsApi } from '@/lib/api/transactions';
import { accountsApi } from '@/lib/api/accounts';
import { Transaction, Account } from '@dhanam/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const { currentSpace } = useSpaceStore();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', currentSpace?.id],
    queryFn: () => transactionsApi.getTransactions(currentSpace!.id, {}),
    enabled: !!currentSpace,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts', currentSpace?.id],
    queryFn: () => accountsApi.getAccounts(currentSpace!.id),
    enabled: !!currentSpace,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof transactionsApi.createTransaction>[1]) =>
      transactionsApi.createTransaction(currentSpace!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      setIsCreateOpen(false);
      toast.success('Transaction created successfully');
    },
    onError: () => {
      toast.error('Failed to create transaction');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof transactionsApi.updateTransaction>[2] }) =>
      transactionsApi.updateTransaction(currentSpace!.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      setSelectedTransaction(null);
      toast.success('Transaction updated successfully');
    },
    onError: () => {
      toast.error('Failed to update transaction');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (transactionId: string) =>
      transactionsApi.deleteTransaction(currentSpace!.id, transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      toast.success('Transaction deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete transaction');
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
      merchant: formData.get('merchant') as string || undefined,
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
        merchant: formData.get('merchant') as string || undefined,
      },
    });
  };

  if (!currentSpace) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all your transactions
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>Create Transaction</DialogTitle>
                <DialogDescription>
                  Add a new transaction to your account
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="accountId">Account</Label>
                  <select
                    id="accountId"
                    name="accountId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(account.balance, account.currency)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="e.g., Grocery shopping"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="merchant">Merchant (Optional)</Label>
                  <Input
                    id="merchant"
                    name="merchant"
                    placeholder="e.g., Walmart"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Transaction
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
            <h3 className="font-semibold text-lg mb-2">No transactions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start adding transactions to track your spending
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Transaction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              {transactionsData?.total} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactionsData?.data.map((transaction) => {
                const account = transaction.account as Account;
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-full">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.date)}
                          {transaction.merchant && (
                            <>
                              <span>•</span>
                              <span>{transaction.merchant}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(transaction.amount, account.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">{account.name}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(transaction.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent>
          {selectedTransaction && (
            <form onSubmit={handleUpdateSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Transaction</DialogTitle>
                <DialogDescription>
                  Update transaction details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Amount</Label>
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
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="date"
                    defaultValue={new Date(selectedTransaction.date).toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={selectedTransaction.description}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-merchant">Merchant (Optional)</Label>
                  <Input
                    id="edit-merchant"
                    name="merchant"
                    defaultValue={selectedTransaction.merchant || ''}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Transaction
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}