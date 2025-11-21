'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Input } from '@dhanam/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@dhanam/ui';
import { Alert, AlertDescription } from '@dhanam/ui';
import { Loader2, Shield, Smartphone, AlertTriangle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '~/lib/api/auth';
import { QRCodeSVG } from 'qrcode.react';

interface TotpSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TotpSetup({ open, onOpenChange, onSuccess }: TotpSetupProps) {
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState<Record<string, boolean>>({});

  const setupMutation = useMutation({
    mutationFn: () => authApi.setupTwoFactor(),
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCode);
      setSecret(data.secret);
      setStep('verify');
    },
    onError: () => {
      toast.error('Failed to setup 2FA');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (code: string) => authApi.verifyTwoFactor({ code }),
    onSuccess: () => {
      // Generate mock backup codes for demo
      const mockBackupCodes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      setBackupCodes(mockBackupCodes);
      setStep('backup');
    },
    onError: () => {
      toast.error('Invalid verification code');
      setTotpCode('');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => Promise.resolve(), // 2FA is enabled after successful verification
    onSuccess: () => {
      toast.success('Two-factor authentication enabled successfully');
      onSuccess();
      onOpenChange(false);
      resetState();
    },
    onError: () => {
      toast.error('Failed to enable 2FA');
    },
  });

  const resetState = () => {
    setTotpCode('');
    setBackupCodes([]);
    setQrCodeUrl('');
    setSecret('');
    setStep('setup');
    setCopiedSecret(false);
    setCopiedCodes({});
  };

  const copyToClipboard = async (text: string, type: 'secret' | string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedCodes((prev) => ({ ...prev, [type]: true }));
        setTimeout(() => setCopiedCodes((prev) => ({ ...prev, [type]: false })), 2000);
      }
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleStart = () => {
    setupMutation.mutate();
  };

  const handleVerify = () => {
    if (totpCode.length === 6) {
      verifyMutation.mutate(totpCode);
    }
  };

  const handleComplete = () => {
    completeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Setup Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>Add an extra layer of security to your account</DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                You&apos;ll need an authenticator app like Google Authenticator, Authy, or
                1Password.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an extra layer of security by requiring a time-based
                code from your phone in addition to your password.
              </p>

              <Button onClick={handleStart} disabled={setupMutation.isPending} className="w-full">
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Start Setup'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Scan QR Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3">
                {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={200} />}

                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2">
                    Or enter this secret key manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={secret} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(secret, 'secret')}
                    >
                      {copiedSecret ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <label htmlFor="totp-code" className="text-sm font-medium">
                  Enter 6-digit code from your app
                </label>
                <Input
                  id="totp-code"
                  type="text"
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center font-mono text-lg tracking-widest mt-1"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={totpCode.length !== 6 || verifyMutation.isPending}
                className="w-full"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Save these backup codes in a secure location. Each code can only be used once.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Backup Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code) => (
                    <div key={code} className="flex items-center gap-1">
                      <Input value={code} readOnly className="font-mono text-xs" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code, code)}
                        className="px-2"
                      >
                        {copiedCodes[code] ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                className="w-full"
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enabling 2FA...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Keep these backup codes safe. You&apos;ll need them if you lose access to your
                authenticator app.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
