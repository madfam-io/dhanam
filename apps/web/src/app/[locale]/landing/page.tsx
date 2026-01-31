'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@dhanam/ui';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTranslation } from '@dhanam/shared';
import { Globe } from 'lucide-react';

import { Hero } from '@/components/landing/hero';
import { ProblemSolution } from '@/components/landing/problem-solution';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { SocialProof } from '@/components/landing/social-proof';
import { Pricing } from '@/components/landing/pricing';
import { FinalCta } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';

export default function LocaleLandingPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale as 'en' | 'es' | 'pt-BR';
  const { isAuthenticated } = useAuth();
  const analytics = useAnalytics();
  const { t, setLocale } = useTranslation('landing');

  const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am';

  useEffect(() => {
    // Sync i18n context with URL locale
    if (locale && ['en', 'es', 'pt-BR'].includes(locale)) {
      setLocale(locale);
    }
  }, [locale, setLocale]);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = `${appUrl}/dashboard`;
    } else {
      analytics.trackPageView('Landing Page', `/${locale}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLiveDemoClick = async () => {
    analytics.track('live_demo_clicked', { source: 'hero_cta', locale });

    // Read geo cookie for demo defaults
    const geoCookie = document.cookie
      .split('; ')
      .find((c) => c.startsWith('dhanam_geo='))
      ?.split('=')[1];

    try {
      const { authApi } = await import('@/lib/api/auth');
      const { useAuth } = await import('@/lib/hooks/use-auth');

      const response = await authApi.loginAsGuest({ countryCode: geoCookie });
      useAuth.getState().setAuth(response.user, response.tokens);

      analytics.track('demo_session_started', {
        userId: response.user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        countryCode: geoCookie,
      });

      window.location.href = `${appUrl}/dashboard`;
    } catch (error) {
      console.error('Guest login failed:', error);
      analytics.track('demo_session_failed', { error: String(error) });
      window.location.href = `${appUrl}/demo`;
    }
  };

  const handleSignUpClick = () => {
    analytics.track('signup_clicked', { source: 'landing_cta', locale });
    window.location.href = `${appUrl}/register`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* SEO hreflang tags */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <link rel="alternate" hrefLang="es" href="https://dhan.am/es" />
        <link rel="alternate" hrefLang="en" href="https://dhan.am/en" />
        <link rel="alternate" hrefLang="pt-BR" href="https://dhan.am/pt-BR" />
        <link rel="alternate" hrefLang="x-default" href="https://dhan.am/es" />
        <meta property="og:locale" content={locale === 'en' ? 'en_US' : locale === 'pt-BR' ? 'pt_BR' : 'es_MX'} />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:locale:alternate" content="es_MX" />
        <meta property="og:locale:alternate" content="pt_BR" />
      </head>

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Dhanam</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Locale switcher */}
            <div className="flex items-center gap-1 text-sm">
              {(['es', 'en', 'pt-BR'] as const).map((l) => (
                <a
                  key={l}
                  href={`/${l}`}
                  className={`px-2 py-1 rounded ${l === locale ? 'bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {l === 'es' ? 'ES' : l === 'en' ? 'EN' : 'PT'}
                </a>
              ))}
            </div>
            <a href={`${appUrl}/login`}>
              <Button variant="ghost">{t('nav.login')}</Button>
            </a>
            <a href={`${appUrl}/register`}>
              <Button>{t('nav.getStarted')}</Button>
            </a>
          </div>
        </div>
      </nav>

      <Hero onLiveDemoClick={handleLiveDemoClick} onSignUpClick={handleSignUpClick} />
      <ProblemSolution />
      <HowItWorks />
      <FeaturesGrid />
      <SocialProof />
      <Pricing onSignUpClick={handleSignUpClick} />
      <FinalCta onLiveDemoClick={handleLiveDemoClick} onSignUpClick={handleSignUpClick} />
      <Footer />
    </div>
  );
}
