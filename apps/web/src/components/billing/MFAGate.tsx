'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '~/lib/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@dhanam/ui';
import { useTranslation } from '@dhanam/shared';

// TODO: Replace with @janua/react-sdk exports once useMFA and MFAChallenge are published
function useMFA() {
  return {
    verify: async (_code: string) => {},
    error: null as Error | null,
  };
}

function MFAChallenge(props: {
  method: string;
  onVerify: (code: string) => void;
  onError: (err: Error) => void;
  showBackupCodeOption?: boolean;
}) {
  return <p>MFA not yet available. {props.method}</p>;
}

interface MFAGateProps {
  /** Content that requires MFA verification to access */
  children: React.ReactNode;
  /** Callback after successful MFA verification */
  onVerified: () => void;
  /** Whether the MFA dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Title for the MFA dialog */
  title?: string;
  /** Description for the MFA dialog */
  description?: string;
}

/**
 * MFAGate - Wraps a sensitive operation behind MFA verification.
 *
 * Use this to protect financial operations like subscription management,
 * plan upgrades, and large transactions.
 *
 * @example
 * ```tsx
 * const [showMFA, setShowMFA] = useState(false);
 *
 * <Button onClick={() => setShowMFA(true)}>Manage Subscription</Button>
 * <MFAGate
 *   open={showMFA}
 *   onOpenChange={setShowMFA}
 *   onVerified={handleManageSubscription}
 * />
 * ```
 */
export function MFAGate({ onVerified, open, onOpenChange, title, description }: MFAGateProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { verify, error } = useMFA();
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleVerify = useCallback(
    async (code: string) => {
      setVerifyError(null);
      try {
        await verify(code);
        onOpenChange(false);
        onVerified();
      } catch {
        setVerifyError(t('mfa.verificationFailed') || 'Verification failed. Please try again.');
      }
    },
    [verify, onVerified, onOpenChange, t]
  );

  // If user doesn't have MFA enabled, proceed directly
  if (!user?.totpEnabled) {
    if (open) {
      onOpenChange(false);
      onVerified();
    }
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || t('mfa.verifyTitle') || 'Verify Your Identity'}</DialogTitle>
          <DialogDescription>
            {description ||
              t('mfa.verifyDescription') ||
              'Enter your authenticator code to continue with this operation.'}
          </DialogDescription>
        </DialogHeader>

        <MFAChallenge
          method="totp"
          onVerify={handleVerify}
          onError={(err) => setVerifyError(err.message)}
          showBackupCodeOption
        />

        {(verifyError || error) && (
          <p className="text-sm text-destructive mt-2">{verifyError || error?.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
