'use client';

import { useTranslation } from '@dhanam/shared';
import { Globe } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  const { t } = useTranslation('landing');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="container mx-auto px-6 py-8 border-t">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="font-semibold">Dhanam</span>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright', { year: currentYear })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('footer.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
            {t('footer.privacy')}
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
            {t('footer.terms')}
          </Link>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
            {t('footer.docs')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
