'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@dhanam/ui';
import { Loader2, Shield, CreditCard, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { plaidApi } from '@/lib/api/plaid';

// Plaid Link types
interface PlaidLinkOptions {
  token: string;
  onSuccess: (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => void;
  onExit?: (err: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata) => void;
  onEvent?: (eventName: PlaidLinkEvent, metadata: PlaidLinkOnEventMetadata) => void;
}

interface PlaidLinkOnSuccessMetadata {
  institution: {
    name: string;
    institution_id: string;
  };
  accounts: Array<{
    id: string;
    name: string;
    mask: string;
    type: string;
    subtype: string;
  }>;
  link_session_id: string;
}

interface PlaidLinkError {
  error_type: string;
  error_code: string;
  error_message: string;
  display_message?: string;
}

interface PlaidLinkOnExitMetadata {
  institution?: {
    name: string;
    institution_id: string;
  };
  status: string;
  link_session_id: string;
  request_id: string;
}

interface PlaidLinkOnEventMetadata {
  error?: PlaidLinkError;
  exit_status?: string;
  institution_id?: string;
  institution_name?: string;
  institution_search_query?: string;
  link_session_id: string;
  mfa_type?: string;
  request_id: string;
  timestamp: string;
  view_name: string;
}

type PlaidLinkEvent = string;

declare global {
  interface Window {
    Plaid: {
      create: (options: PlaidLinkOptions) => {
        open: () => void;
        exit: () => void;
        destroy: () => void;
      };
    };
  }
}

const PLAID_INSTITUTIONS = [
  {
    name: 'Chase',
    logo: '🏛️',
    description: 'Major US bank with checking, savings, and credit products',
  },
  {
    name: 'Bank of America',
    logo: '🏦',
    description: 'One of the largest banks in the United States',
  },
  {
    name: 'Wells Fargo',
    logo: '🏛️',
    description: 'Leading financial services company',
  },
  {
    name: 'Citi',
    logo: '🏢',
    description: 'Global banking and financial services',
  },
  {
    name: 'Capital One',
    logo: '💳',
    description: 'Credit cards, banking, and lending',
  },
  {
    name: 'American Express',
    logo: '💳',
    description: 'Credit cards and financial services',
  },
];

interface PlaidConnectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  onSuccess: () => void;
}

export function PlaidConnect({ open, onOpenChange, spaceId, onSuccess }: PlaidConnectProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidHandler, setPlaidHandler] = useState<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Plaid Link script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Plaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.async = true;
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } else if (window.Plaid) {
      setIsScriptLoaded(true);
    }
    return;
  }, []);

  const createLinkTokenMutation = useMutation({
    mutationFn: () => plaidApi.createLinkToken(),
    onSuccess: (data) => {
      setLinkToken(data.linkToken);
    },
    onError: () => {
      toast.error('Failed to initialize Plaid Link');
    },
  });

  const linkAccountMutation = useMutation({
    mutationFn: (publicToken: string) => 
      plaidApi.linkAccount(spaceId, { publicToken }),
    onSuccess: (data) => {
      toast.success(
        `Successfully linked ${data.accountsCount} account${data.accountsCount > 1 ? 's' : ''}`
      );
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to link account');
    },
  });

  const onPlaidSuccess = useCallback(
    (publicToken: string, _metadata: PlaidLinkOnSuccessMetadata) => {
      linkAccountMutation.mutate(publicToken);
    },
    [linkAccountMutation]
  );

  const onPlaidExit = useCallback(
    (err: PlaidLinkError | null, _metadata: PlaidLinkOnExitMetadata) => {
      if (err) {
        console.error('Plaid Link exit error:', err);
        toast.error(err.display_message || 'Failed to connect bank account');
      }
    },
    []
  );

  // Initialize Plaid Link handler
  useEffect(() => {
    if (isScriptLoaded && linkToken && window.Plaid && !plaidHandler) {
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: onPlaidSuccess,
        onExit: onPlaidExit,
      });
      setPlaidHandler(handler);
    }
  }, [isScriptLoaded, linkToken, onPlaidSuccess, onPlaidExit, plaidHandler]);

  const handleConnect = () => {
    if (!linkToken) {
      createLinkTokenMutation.mutate();
    } else if (plaidHandler) {
      plaidHandler.open();
    }
  };

  useEffect(() => {
    if (open && linkToken && plaidHandler) {
      plaidHandler.open();
    }
  }, [open, linkToken, plaidHandler]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Connect US Bank Account
          </DialogTitle>
          <DialogDescription>
            Securely connect your US bank account using Plaid. Your login credentials are encrypted
            and never stored on our servers.
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
                <li>• 256-bit SSL encryption</li>
                <li>• Read-only access to your accounts</li>
                <li>• Used by thousands of financial apps</li>
                <li>• No passwords stored</li>
              </ul>
            </CardContent>
          </Card>

          {/* Supported Institutions */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Supported Banks & Credit Unions
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {PLAID_INSTITUTIONS.map((institution) => (
                <div
                  key={institution.name}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <span className="text-2xl">{institution.logo}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{institution.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {institution.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              And 10,000+ other US financial institutions
            </p>
          </div>

          {/* Connect Button */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleConnect}
              disabled={createLinkTokenMutation.isPending || linkAccountMutation.isPending}
              className="w-full"
              size="lg"
            >
              {createLinkTokenMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : linkAccountMutation.isPending ? (
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
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-yellow-800">Demo Credentials</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-yellow-700 space-y-1">
                    <p><strong>Institution:</strong> Chase (Sandbox)</p>
                    <p><strong>Username:</strong> user_good</p>
                    <p><strong>Password:</strong> pass_good</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-center text-muted-foreground">
              By connecting, you agree to Plaid's{' '}
              <a
                href="https://plaid.com/legal/end-user-privacy-policy"
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