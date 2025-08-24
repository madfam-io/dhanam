'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@dhanam/ui/dialog';
import { Button } from '@dhanam/ui/button';
import { Input } from '@dhanam/ui/input';
import { Label } from '@dhanam/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@dhanam/ui/card';
import { Badge } from '@dhanam/ui/badge';
import { Alert, AlertDescription } from '@dhanam/ui/alert';
import { 
  Loader2, 
  Shield, 
  Coins, 
  Eye, 
  EyeOff, 
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { bitsoApi } from '@/lib/api/bitso';

const SUPPORTED_CRYPTOCURRENCIES = [
  { symbol: 'BTC', name: 'Bitcoin', logo: '₿' },
  { symbol: 'ETH', name: 'Ethereum', logo: 'Ξ' },
  { symbol: 'XRP', name: 'Ripple', logo: '◉' },
  { symbol: 'LTC', name: 'Litecoin', logo: 'Ł' },
  { symbol: 'BCH', name: 'Bitcoin Cash', logo: '₿' },
  { symbol: 'MANA', name: 'Decentraland', logo: '🌐' },
  { symbol: 'BAT', name: 'Basic Attention Token', logo: '🦁' },
  { symbol: 'DAI', name: 'Dai Stablecoin', logo: '◈' },
];

interface BitsoConnectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  onSuccess: () => void;
}

export function BitsoConnect({ open, onOpenChange, spaceId, onSuccess }: BitsoConnectProps) {
  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
    autoSync: true,
  });
  const [showSecrets, setShowSecrets] = useState({
    apiKey: false,
    apiSecret: false,
  });
  const [step, setStep] = useState<'form' | 'instructions'>('instructions');

  const connectMutation = useMutation({
    mutationFn: () => bitsoApi.connectAccount(spaceId, formData),
    onSuccess: (data) => {
      toast.success(
        `Successfully connected Bitso account with ${data.accountsCount} crypto holding${data.accountsCount !== 1 ? 's' : ''}`
      );
      onSuccess();
      onOpenChange(false);
      setStep('instructions');
      setFormData({ apiKey: '', apiSecret: '', autoSync: true });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to connect Bitso account';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apiKey || !formData.apiSecret) {
      toast.error('Please provide both API Key and Secret');
      return;
    }
    connectMutation.mutate();
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('instructions');
    setFormData({ apiKey: '', apiSecret: '', autoSync: true });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-600" />
            Connect Bitso Crypto Account
          </DialogTitle>
          <DialogDescription>
            Connect your Bitso account to automatically track your cryptocurrency portfolio
          </DialogDescription>
        </DialogHeader>

        {step === 'instructions' ? (
          <div className="space-y-6">
            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Your API credentials are encrypted and secure.</strong>
                <br />We use bank-level encryption and never store your credentials in plain text.
              </AlertDescription>
            </Alert>

            {/* Instructions */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                🔑 How to get your Bitso API credentials
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <p className="font-medium">Log in to Bitso</p>
                    <p className="text-muted-foreground">
                      Go to{' '}
                      <a 
                        href="https://bitso.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        bitso.com <ExternalLink className="h-3 w-3" />
                      </a>{' '}
                      and log in to your account
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <p className="font-medium">Navigate to API Settings</p>
                    <p className="text-muted-foreground">
                      Go to Settings → API → Create New API Key
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <p className="font-medium">Set Permissions</p>
                    <p className="text-muted-foreground">
                      Enable <strong>View</strong> permission only (read-only access)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <div>
                    <p className="font-medium">Copy Your Credentials</p>
                    <p className="text-muted-foreground">
                      Copy your API Key and Secret (you'll only see the secret once!)
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Only enable "View" permissions. Never give trading permissions to third-party applications.
                </AlertDescription>
              </Alert>
            </div>

            {/* Supported Cryptocurrencies */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Supported Cryptocurrencies
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_CRYPTOCURRENCIES.map((crypto) => (
                  <div
                    key={crypto.symbol}
                    className="flex items-center gap-2 p-2 rounded border bg-card text-sm"
                  >
                    <span className="text-lg">{crypto.logo}</span>
                    <div>
                      <p className="font-medium">{crypto.symbol}</p>
                      <p className="text-xs text-muted-foreground">{crypto.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep('form')} className="flex-1">
                I Have My API Credentials
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showSecrets.apiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Your Bitso API Key"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => 
                      setShowSecrets({ ...showSecrets, apiKey: !showSecrets.apiKey })
                    }
                  >
                    {showSecrets.apiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Secret</Label>
                <div className="relative">
                  <Input
                    id="apiSecret"
                    type={showSecrets.apiSecret ? 'text' : 'password'}
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    placeholder="Your Bitso API Secret"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => 
                      setShowSecrets({ ...showSecrets, apiSecret: !showSecrets.apiSecret })
                    }
                  >
                    {showSecrets.apiSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={formData.autoSync}
                  onChange={(e) => setFormData({ ...formData, autoSync: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="autoSync" className="text-sm">
                  Enable automatic portfolio sync
                </Label>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your credentials will be encrypted with AES-256 encryption before being stored.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={connectMutation.isPending}
                className="flex-1"
              >
                {connectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Bitso Account'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('instructions')}
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}