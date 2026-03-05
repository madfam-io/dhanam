'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@dhanam/ui';
import { Button, Input, Label } from '@dhanam/ui';
import { useTranslation } from '@dhanam/shared';
import { LocaleSwitcher } from '~/components/locale-switcher';
import { getJanuaApiUrl } from '~/lib/janua-oauth';

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const januaResetUrl = `${getJanuaApiUrl()}/reset-password`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    window.location.href = `${januaResetUrl}?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('resetPasswordTitle')}</CardTitle>
          <CardDescription>{t('resetPasswordSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('placeholders.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              {t('sendResetLink')}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground text-center w-full">
            <Link href="/login" className="text-primary hover:underline">
              {t('login')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
