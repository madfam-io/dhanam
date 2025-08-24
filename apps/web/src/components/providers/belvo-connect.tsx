'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Input } from '@dhanam/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@dhanam/ui';
import { Alert, AlertDescription } from '@dhanam/ui';
import { Loader2, Shield, Building2, MapPin, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { belvoApi } from '~/lib/api/belvo';

const BELVO_INSTITUTIONS = [
  {
    name: 'BBVA México',
    code: 'bbva_mx',
    logo: '🏦',
    description: 'Bancomer - Largest bank in Mexico',
  },
  {
    name: 'Banamex',
    code: 'banamex',
    logo: '🏛️',
    description: 'Citibanamex - Major Mexican bank',
  },
  {
    name: 'Banorte',
    code: 'banorte',
    logo: '🏢',
    description: 'Banco del Bajío group bank',
  },
  {
    name: 'Santander México',
    code: 'santander_mx',
    logo: '🔴',
    description: 'Spanish multinational bank',
  },
  {
    name: 'HSBC México',
    code: 'hsbc_mx',
    logo: '🔺',
    description: 'International banking presence',
  },
  {
    name: 'Scotiabank México',
    code: 'scotiabank_mx',
    logo: '🟥',
    description: 'Canadian multinational bank',
  },
];

interface BelvoConnectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  onSuccess: () => void;
}

export function BelvoConnect({ open, onOpenChange, spaceId, onSuccess }: BelvoConnectProps) {
  const [institution, setInstitution] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const linkAccountMutation = useMutation({
    mutationFn: (data: { institution: string; username: string; password: string }) =>
      belvoApi.linkAccount(spaceId, data),
    onSuccess: (data) => {
      const selectedBank = BELVO_INSTITUTIONS.find((bank) => bank.code === institution);
      toast.success(
        `Successfully linked ${data.accountsCount} account${data.accountsCount > 1 ? 's' : ''} from ${selectedBank?.name || institution}`
      );
      onSuccess();
      onOpenChange(false);
      setInstitution('');
      setUsername('');
      setPassword('');
    },
    onError: (error: any) => {
      const message =
        error.code === 'INVALID_CREDENTIALS'
          ? 'Invalid username or password'
          : error.code === 'INSTITUTION_ERROR'
            ? 'Bank is temporarily unavailable'
            : error.code === 'MFA_REQUIRED'
              ? 'Multi-factor authentication required (not yet supported)'
              : 'Failed to connect bank account';
      toast.error(message);
    },
  });

  const handleConnect = () => {
    if (institution && username && password) {
      linkAccountMutation.mutate({ institution, username, password });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Connect Mexican Bank Account
          </DialogTitle>
          <DialogDescription>
            Securely connect your Mexican bank account using Belvo. Your credentials are encrypted
            and used only to fetch your financial data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Notice */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Bank-Level Security
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 256-bit AES encryption for credentials</li>
                <li>• Read-only access to your accounts</li>
                <li>• CNBV regulated financial data access</li>
                <li>• Credentials encrypted with AWS KMS</li>
              </ul>
            </CardContent>
          </Card>

          {/* Supported Institutions */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Supported Mexican Banks
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {BELVO_INSTITUTIONS.map((bank) => (
                <div
                  key={bank.code}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    institution === bank.code
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card hover:bg-accent'
                  }`}
                  onClick={() => setInstitution(bank.code)}
                  onKeyDown={(e) => e.key === 'Enter' && setInstitution(bank.code)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${bank.name} bank`}
                >
                  <span className="text-2xl">{bank.logo}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{bank.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{bank.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              And 40+ other Mexican financial institutions
            </p>
          </div>

          {/* Connection Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username / Client ID
              </label>
              <Input
                id="username"
                placeholder="Your online banking username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Your online banking password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>

            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                We&apos;ll only access your account balances and transaction history. No transfers
                or payments can be made through this connection.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleConnect}
              disabled={!institution || !username || !password || linkAccountMutation.isPending}
              className="w-full"
              size="lg"
            >
              {linkAccountMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Bank Account'
              )}
            </Button>

            {/* Demo Credentials for Development */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-800">Demo Credentials</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>
                      <strong>Institution:</strong> sandbox_mx
                    </p>
                    <p>
                      <strong>Username:</strong> test_user
                    </p>
                    <p>
                      <strong>Password:</strong> test_password
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-center text-muted-foreground">
              By connecting, you agree to Belvo&apos;s{' '}
              <a
                href="https://belvo.com/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
