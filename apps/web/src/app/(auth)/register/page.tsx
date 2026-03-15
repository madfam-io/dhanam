'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SignUp } from '@janua/react-sdk';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@dhanam/ui';
import { LocaleSwitcher } from '~/components/locale-switcher';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan');

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            {selectedPlan
              ? `Start your free trial of ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`
              : 'Start managing your finances with Dhanam'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUp redirectUrl="/onboarding" />
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
    </div>
  );
}
