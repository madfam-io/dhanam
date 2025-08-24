'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { LoginForm } from '~/components/forms/login-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@dhanam/ui';
import { Alert, AlertDescription } from '@dhanam/ui';
import { useAuth } from '~/lib/hooks/use-auth';
import { authApi } from '~/lib/api/auth';
import { ApiError } from '~/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
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
        setError('Invalid email or password');
        setShowTotpField(false);
      } else if (error.code === 'TOTP_REQUIRED') {
        setError('Please enter your 2FA code');
        setShowTotpField(true);
      } else if (error.code === 'INVALID_TOTP') {
        setError('Invalid 2FA code. Please try again.');
        setShowTotpField(true);
      } else {
        setError('An error occurred. Please try again.');
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
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
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Forgot your password?
        </Link>
      </CardFooter>
    </Card>
  );
}