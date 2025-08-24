'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dhanam/ui/dialog';
import { Button } from '@dhanam/ui/button';
import { Input } from '@dhanam/ui/input';
import { Label } from '@dhanam/ui/label';
import { Alert, AlertDescription } from '@dhanam/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

interface BelvoConnectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  onSuccess: () => void;
}

const BELVO_INSTITUTIONS = [
  { id: 'erebor_mx_retail', name: 'Erebor Bank (Sandbox)', country: 'MX' },
  { id: 'gringotts_mx_retail', name: 'Gringotts Bank (Sandbox)', country: 'MX' },
];

export function BelvoConnect({ open, onOpenChange, spaceId, onSuccess }: BelvoConnectProps) {
  const [institution, setInstitution] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const connectMutation = useMutation({
    mutationFn: async (data: { institution: string; username: string; password: string }) => {
      const response = await apiClient.post(`/providers/belvo/spaces/${spaceId}/link`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Bank account connected successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to connect bank account';
      toast.error(message);
    },
  });

  const resetForm = () => {
    setInstitution('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    connectMutation.mutate({ institution, username, password });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect Mexican Bank Account</DialogTitle>
            <DialogDescription>
              Connect your bank account using Belvo to automatically sync transactions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                For testing, use the sandbox credentials:
                <br />
                Username: <code>johndoe</code>
                <br />
                Password: <code>MyPassword</code>
              </AlertDescription>
            </Alert>

            <div className="grid gap-2">
              <Label htmlFor="institution">Bank</Label>
              <select
                id="institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a bank</option>
                {BELVO_INSTITUTIONS.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your bank username"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your bank password"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={connectMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={connectMutation.isPending}>
              {connectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Connect Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}