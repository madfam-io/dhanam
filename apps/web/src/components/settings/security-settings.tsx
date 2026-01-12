'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Badge } from '@dhanam/ui';
import { Alert, AlertDescription } from '@dhanam/ui';
import { Separator } from '@dhanam/ui';
import { Shield, Smartphone, Key, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TotpSetup } from '~/components/auth/totp-setup';

export function SecuritySettings() {
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const queryClient = useQueryClient();

  const { data: totpStatus, isLoading } = useQuery({
    queryKey: ['totp-status'],
    queryFn: () => ({ enabled: false, backupCodesRemaining: 0 }), // Mock for now
  });

  const disableTotpMutation = useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      toast.success('Two-factor authentication disabled');
      queryClient.invalidateQueries({ queryKey: ['totp-status'] });
    },
    onError: () => {
      toast.error('Failed to disable 2FA');
    },
  });

  const generateBackupCodesMutation = useMutation({
    mutationFn: () => Promise.resolve({ backupCodes: ['CODE1', 'CODE2'] }),
    onSuccess: (data) => {
      // Show backup codes in a modal or download them
      const codes = data.backupCodes.join('\n');
      const blob = new Blob([codes], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dhanam-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('New backup codes generated and downloaded');
      queryClient.invalidateQueries({ queryKey: ['totp-status'] });
    },
    onError: () => {
      toast.error('Failed to generate backup codes');
    },
  });

  const handleTotpSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['totp-status'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security and authentication preferences
        </p>
      </div>

      <Separator />

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with time-based codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Authenticator App</p>
              <p className="text-sm text-muted-foreground">
                {totpStatus?.enabled
                  ? 'Two-factor authentication is enabled'
                  : 'Use your phone to generate verification codes'}
              </p>
            </div>
            <Badge variant={totpStatus?.enabled ? 'default' : 'secondary'}>
              {totpStatus?.enabled ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Enabled
                </>
              ) : (
                'Disabled'
              )}
            </Badge>
          </div>

          {totpStatus?.enabled ? (
            <div className="space-y-3">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your account is protected with two-factor authentication. You have{' '}
                  {totpStatus.backupCodesRemaining} backup codes remaining.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => generateBackupCodesMutation.mutate()}
                  disabled={generateBackupCodesMutation.isPending}
                  size="sm"
                >
                  {generateBackupCodesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-3 w-3" />
                      New Backup Codes
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => disableTotpMutation.mutate()}
                  disabled={disableTotpMutation.isPending}
                  size="sm"
                >
                  {disableTotpMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    'Disable 2FA'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Alert className="border-warning/30 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning-foreground">
                  Your account is not protected by two-factor authentication. We strongly recommend
                  enabling it for enhanced security.
                </AlertDescription>
              </Alert>

              <Button onClick={() => setShowTotpSetup(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Enable Two-Factor Authentication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TotpSetup
        open={showTotpSetup}
        onOpenChange={setShowTotpSetup}
        onSuccess={handleTotpSuccess}
      />
    </div>
  );
}
