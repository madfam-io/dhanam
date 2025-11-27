'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { RegisterForm } from '~/components/forms/register-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@dhanam/ui';
import { Alert, AlertDescription, Button, Separator } from '@dhanam/ui';
import { useAuth } from '~/lib/hooks/use-auth';
import { authApi } from '~/lib/api/auth';
import { ApiError } from '~/lib/api/client';
import { oauthProviders, loginWithOAuth, isJanuaOAuthEnabled } from '~/lib/janua-oauth';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens);
      router.push('/onboarding');
    },
    onError: (error: ApiError) => {
      if (error.code === 'EMAIL_EXISTS') {
        setError('An account with this email already exists');
      } else {
        setError('An error occurred. Please try again.');
      }
    },
  });

  const showOAuth = isJanuaOAuthEnabled();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start managing your finances with Dhanam</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OAuth Providers */}
        {showOAuth && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {oauthProviders.slice(0, 4).map((provider) => (
                <Button
                  key={provider.id}
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setError(null);
                    loginWithOAuth(provider.id, '/onboarding');
                  }}
                >
                  <span className="mr-2">{provider.icon}</span>
                  {provider.name}
                </Button>
              ))}
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or register with email
                </span>
              </div>
            </div>
          </>
        )}

        <RegisterForm
          onSubmit={(data) => {
            setError(null);
            registerMutation.mutate(data);
          }}
          isLoading={registerMutation.isPending}
        />
      </CardContent>
      <CardFooter>
        <div className="text-sm text-muted-foreground text-center w-full">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
