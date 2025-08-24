'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Input } from '@dhanam/ui';
import { Alert, AlertDescription } from '@dhanam/ui';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '~/lib/api/auth';

interface TotpVerifyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tokens: any) => void;
  tempTokens: any;
}

export function TotpVerify({ open, onOpenChange, onSuccess, tempTokens }: TotpVerifyProps) {
  const [totpCode, setTotpCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => 
      authApi.verifyTwoFactor({ code }),
    onSuccess: () => {
      toast.success('Authentication successful');
      onSuccess(tempTokens);
      onOpenChange(false);
      setTotpCode('');
      setUseBackupCode(false);
    },
    onError: (error: any) => {
      const message = error.code === 'INVALID_TOTP' 
        ? useBackupCode 
          ? 'Invalid backup code' 
          : 'Invalid verification code'
        : 'Verification failed';
      toast.error(message);
      setTotpCode('');
    },
  });

  const handleVerify = () => {
    if ((useBackupCode && totpCode.length === 8) || (!useBackupCode && totpCode.length === 6)) {
      verifyMutation.mutate(totpCode);
    }
  };

  const handleCodeChange = (value: string) => {
    const maxLength = useBackupCode ? 8 : 6;
    const sanitized = useBackupCode 
      ? value.replace(/[^a-zA-Z0-9]/g, '').slice(0, maxLength)
      : value.replace(/\D/g, '').slice(0, maxLength);
    setTotpCode(sanitized);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter the code from your authenticator app to complete login
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your account has two-factor authentication enabled for added security.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="totp-code" className="text-sm font-medium">
                {useBackupCode ? 'Backup Code' : 'Verification Code'}
              </label>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setTotpCode('');
                }}
                className="h-auto p-0 text-xs"
              >
                Use {useBackupCode ? 'authenticator app' : 'backup code'}
              </Button>
            </div>

            <Input
              id="totp-code"
              type="text"
              placeholder={useBackupCode ? 'ABC12345' : '000000'}
              value={totpCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className={`text-center font-mono text-lg tracking-widest ${
                useBackupCode ? '' : 'tracking-widest'
              }`}
              maxLength={useBackupCode ? 8 : 6}
            />

            <Button
              onClick={handleVerify}
              disabled={
                (useBackupCode && totpCode.length !== 8) ||
                (!useBackupCode && totpCode.length !== 6) ||
                verifyMutation.isPending
              }
              className="w-full"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Login'
              )}
            </Button>

            {useBackupCode && (
              <p className="text-xs text-center text-muted-foreground">
                Backup codes are single-use. Make sure to keep your remaining codes safe.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}