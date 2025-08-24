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
import { Plus, MoreVertical, Loader2, Building2, CreditCard, TrendingUp, Coins } from 'lucide-react';
import { useSpaceStore } from '@/stores/space';
import { accountsApi } from '@/lib/api/accounts';
import { Account, AccountType, Currency, Provider } from '@dhanam/shared';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { BelvoConnect } from '@/components/providers/belvo-connect';\nimport { PlaidConnect } from '@/components/providers/plaid-connect';\nimport { BitsoConnect } from '@/components/providers/bitso-connect';

const accountTypeIcons: Record<AccountType, React.ElementType> = {
  checking: Building2,
  savings: Building2,
  credit: CreditCard,
  investment: TrendingUp,
  crypto: Coins,
  other: Building2,
};

const providerLabels: Record<Provider, string> = {
  belvo: 'Belvo (Mexico)',
  plaid: 'Plaid (US)',
  bitso: 'Bitso (Crypto)',
  manual: 'Manual Entry',
};

export default function AccountsPage() {
  const { currentSpace } = useSpaceStore();
  const queryClient = useQueryClient();
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isBelvoOpen, setIsBelvoOpen] = useState(false);
  const [isPlaidOpen, setIsPlaidOpen] = useState(false);\n  const [isBitsoOpen, setIsBitsoOpen] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', currentSpace?.id],
    queryFn: () => accountsApi.getAccounts(currentSpace!.id),
    enabled: !!currentSpace,
  });

  const connectMutation = useMutation({
    mutationFn: (provider: Exclude<Provider, 'manual'>) =>
      accountsApi.connectAccount(currentSpace!.id, { provider }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      setIsConnectOpen(false);
      toast.success('Account connected successfully');
    },
    onError: () => {
      toast.error('Failed to connect account');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof accountsApi.createAccount>[1]) =>
      accountsApi.createAccount(currentSpace!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      setIsCreateOpen(false);
      toast.success('Account created successfully');
    },
    onError: () => {
      toast.error('Failed to create account');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (accountId: string) =>
      accountsApi.deleteAccount(currentSpace!.id, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      toast.success('Account deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete account');
    },
  });

  const handleConnect = (provider: Exclude<Provider, 'manual'>) => {
    setSelectedProvider(provider);
    setIsConnectOpen(false);
    
    // Route to appropriate provider component
    switch (provider) {
      case 'belvo':
        setIsBelvoOpen(true);
        break;
      case 'plaid':
        setIsPlaidOpen(true);
        break;
      case 'bitso':
        setIsBitsoOpen(true);
        break;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      type: formData.get('type') as AccountType,
      currency: formData.get('currency') as Currency,
      balance: parseFloat(formData.get('balance') as string),
    });
  };

  if (!currentSpace) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Connect your bank accounts and manage your finances
          </p>
        </div>
        <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
              <DialogDescription>
                Connect your bank account or add one manually
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <h4 className="font-medium">Connect with Provider</h4>
                <div className="grid gap-2">
                  {Object.entries(providerLabels)
                    .filter(([key]) => key !== 'manual')
                    .map(([key, label]) => (
                      <Button
                        key={key}
                        variant="outline"
                        className="justify-start"
                        onClick={() => handleConnect(key as Exclude<Provider, 'manual'>)}
                        disabled={connectMutation.isPending}
                      >
                        {connectMutation.isPending && selectedProvider === key ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {label}
                      </Button>
                    ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsConnectOpen(false);
                  setIsCreateOpen(true);
                }}
              >
                Add Manually
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : accounts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No accounts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your bank accounts to start tracking your finances
            </p>
            <Button onClick={() => setIsConnectOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts?.map((account) => {
            const Icon = accountTypeIcons[account.type];
            return (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {account.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(account.id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {account.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {account.provider}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold">
                      {formatCurrency(account.balance, account.currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(account.lastSyncedAt || account.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create Manual Account</DialogTitle>
              <DialogDescription>
                Add an account that you'll update manually
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Chase Checking"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Account Type</Label>
                <select
                  id="type"
                  name="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="investment">Investment</option>
                  <option value="crypto">Crypto</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  name="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="balance">Current Balance</Label>
                <Input
                  id="balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BelvoConnect
        open={isBelvoOpen}
        onOpenChange={setIsBelvoOpen}
        spaceId={currentSpace.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace.id] });
        }}
      />

      <PlaidConnect
        open={isPlaidOpen}
        onOpenChange={setIsPlaidOpen}
        spaceId={currentSpace.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace.id] });
        }}
      />

      <BitsoConnect
        open={isBitsoOpen}
        onOpenChange={setIsBitsoOpen}
        spaceId={currentSpace.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace.id] });
        }}
      />
    </div>
  );
}