'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { LoginForm } from '~/components/forms/login-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@dhanam/ui';
import { Alert, AlertDescription, Button, Separator } from '@dhanam/ui';
import { useAuth } from '~/lib/hooks/use-auth';
import { authApi } from '~/lib/api/auth';
import { ApiError } from '~/lib/api/client';
import { useTranslation } from '@dhanam/shared';
import { LocaleSwitcher } from '~/components/locale-switcher';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { t } = useTranslation('auth');
  const [error, setError] = useState<string | null>(null);
  const [showTotpField, setShowTotpField] = useState(false);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens);
      router.push('/dashboard');
    },
    onError: (error: ApiError) => {
      if (error.code === 'INVALID_CREDENTIALS') {
        setError(t('invalidCredentials'));
        setShowTotpField(false);
      } else if (error.code === 'TOTP_REQUIRED') {
        setError(t('totpRequired'));
        setShowTotpField(true);
      } else if (error.code === 'INVALID_TOTP') {
        setError(t('invalidTotp'));
        setShowTotpField(true);
      } else {
        setError(t('genericError'));
      }
    },
  });

  const guestLoginMutation = useMutation({
    mutationFn: authApi.loginAsGuest,
    onSuccess: (response) => {
      setAuth(response.user, response.tokens);
      router.push('/dashboard');
    },
    onError: (_error: ApiError) => {
      setError(t('demoAccessFailed'));
    },
  });

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <LoginForm
            onSubmit={(data) => {
              setError(null);
              loginMutation.mutate(data);
            }}
            isLoading={loginMutation.isPending}
            showTotpField={showTotpField}
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setError(null);
              guestLoginMutation.mutate();
            }}
            disabled={guestLoginMutation.isPending}
          >
            {guestLoginMutation.isPending ? t('accessingDemo') : t('tryDemo')}
          </Button>
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground">
              {t('noAccount')}{' '}
              <Link href="/register" className="text-primary hover:underline">
                {t('signUp')}
              </Link>
            </div>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
