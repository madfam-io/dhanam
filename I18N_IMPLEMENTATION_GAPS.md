# Dhanam Ledger - i18n Implementation Gaps & Code Examples

## Quick Summary

| Aspect | Current State | Required State | Effort |
|--------|---------------|----------------|--------|
| **Translation System** | Manual hardcoded strings | Structured i18n library | 40 hours |
| **Locale Routing** | None | URL-based or cookie-based | 16 hours |
| **Date Localization** | Hardcoded en-US | Locale-aware formatting | 12 hours |
| **Timezone Support** | Stored but unused | Applied to all dates | 16 hours |
| **Backend i18n** | None | Localized API responses | 20 hours |
| **Mobile i18n** | None | Full translation sync | 24 hours |

**Total Estimated Effort: 128 hours (~3-4 weeks full-time)**

---

## Detailed Implementation Gaps

### Gap 1: Translation System Architecture

#### Current Implementation (INADEQUATE)
```typescript
// /packages/shared/src/i18n/index.ts - ONLY FILE
export const i18n = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      loading: 'Loading...',
    },
  },
  es: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar', 
      delete: 'Eliminar',
      loading: 'Cargando...',
    },
  },
} as const;
```

**Problems**:
- Only 4 terms translated
- Flat structure (no feature organization)
- Manually maintained
- No pluralization support
- No variable interpolation
- Cannot scale to 100+ terms

#### Required Implementation

**Step 1: Install next-intl**
```bash
npm install next-intl
```

**Step 2: Create translation structure**
```
packages/shared/src/i18n/
├── en.json
├── es.json
├── types.ts
└── index.ts
```

**Step 3: English translations** (`packages/shared/src/i18n/en.json`)
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success"
  },
  "onboarding": {
    "preferences": {
      "title": "Configure Your Preferences",
      "subtitle": "Personalize your Dhanam experience",
      "language": "Language",
      "timezone": "Timezone",
      "currency": "Primary Currency",
      "notifications": "Notifications",
      "transactionAlerts": "Transaction alerts",
      "budgetAlerts": "Budget alerts",
      "weeklyReports": "Weekly report",
      "monthlyReports": "Monthly report",
      "saveAndContinue": "Save and continue"
    },
    "welcome": {
      "title": "Welcome to Dhanam",
      "description": "Let's set up your financial management workspace"
    }
  },
  "auth": {
    "login": {
      "title": "Sign In",
      "description": "Sign in to your account",
      "email": "Email address",
      "password": "Password",
      "signIn": "Sign in",
      "noAccount": "Don't have an account?",
      "signUp": "Sign up",
      "forgotPassword": "Forgot your password?",
      "invalidCredentials": "Invalid email or password",
      "totpRequired": "Please enter your 2FA code",
      "invalidTotp": "Invalid 2FA code. Please try again."
    }
  },
  "preferences": {
    "section": "Preferences",
    "notifications": "Notifications",
    "updated": "Preferences updated successfully",
    "confirmReset": "Are you sure you want to reset all preferences to default values?",
    "resetSuccess": "Preferences reset to default values",
    "lastUpdated": "Last updated:"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back, {name}",
    "netWorth": "Net Worth",
    "accounts": "Accounts",
    "budgets": "Budgets",
    "recentTransactions": "Recent Transactions",
    "totalBalance": "Total Balance",
    "lastSync": "Last synced {date}"
  },
  "errors": {
    "notFound": "Not found",
    "unauthorized": "Unauthorized",
    "forbidden": "Access forbidden",
    "serverError": "Server error. Please try again later.",
    "networkError": "Network error. Please check your connection."
  }
}
```

**Step 4: Spanish translations** (`packages/shared/src/i18n/es.json`)
```json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "loading": "Cargando...",
    "error": "Ocurrió un error",
    "success": "Éxito"
  },
  "onboarding": {
    "preferences": {
      "title": "Configura tus preferencias",
      "subtitle": "Personaliza tu experiencia en Dhanam",
      "language": "Idioma",
      "timezone": "Zona horaria",
      "currency": "Moneda Principal",
      "notifications": "Notificaciones",
      "transactionAlerts": "Alertas de transacciones",
      "budgetAlerts": "Alertas de presupuesto",
      "weeklyReports": "Resumen semanal",
      "monthlyReports": "Reporte mensual",
      "saveAndContinue": "Guardar y continuar"
    }
  },
  "auth": {
    "login": {
      "title": "Iniciar sesión",
      "description": "Inicia sesión en tu cuenta",
      "email": "Correo electrónico",
      "password": "Contraseña",
      "signIn": "Iniciar sesión",
      "noAccount": "¿No tienes cuenta?",
      "signUp": "Regístrate",
      "forgotPassword": "¿Olvidaste tu contraseña?",
      "invalidCredentials": "Correo o contraseña inválidos",
      "totpRequired": "Por favor ingresa tu código 2FA",
      "invalidTotp": "Código 2FA inválido. Por favor intenta de nuevo."
    }
  },
  "preferences": {
    "section": "Preferencias",
    "notifications": "Notificaciones",
    "updated": "Preferencias actualizadas correctamente",
    "confirmReset": "¿Estás seguro de que quieres restablecer todas las preferencias a sus valores por defecto?",
    "resetSuccess": "Preferencias restablecidas a valores por defecto",
    "lastUpdated": "Última actualización:"
  },
  "dashboard": {
    "title": "Panel de control",
    "welcome": "Bienvenido de vuelta, {name}",
    "netWorth": "Patrimonio Neto",
    "accounts": "Cuentas",
    "budgets": "Presupuestos",
    "recentTransactions": "Transacciones Recientes",
    "totalBalance": "Saldo Total",
    "lastSync": "Última sincronización {date}"
  },
  "errors": {
    "notFound": "No encontrado",
    "unauthorized": "No autorizado",
    "forbidden": "Acceso denegado",
    "serverError": "Error del servidor. Por favor intenta más tarde.",
    "networkError": "Error de red. Por favor verifica tu conexión."
  }
}
```

---

### Gap 2: Frontend i18n Setup

#### Current State
- Root layout hardcoded to English
- No locale context
- No locale detection
- No dynamic language switching

#### Required Implementation

**Step 1: Configure next-intl**
```typescript
// apps/web/i18n.config.ts
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'es'] as const;
export const defaultLocale = 'es' as const;

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../../packages/shared/src/i18n/${locale}.json`)).default,
}));
```

**Step 2: Update middleware**
```typescript
// apps/web/src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n.config';

const publicPaths = ['/login', '/register', '/forgot-password'];

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // /en/dashboard, /es/dashboard
  localeDetection: true,
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Step 3: Update root layout**
```typescript
// apps/web/src/app/layout.tsx
import { ReactNode } from 'react';
import { getLocale } from 'next-intl/server';

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

**Step 4: Use translations in components**
```typescript
// apps/web/src/components/onboarding/steps/preferences-step.tsx
'use client';

import { useTranslations } from 'next-intl';
import { SettingsIcon } from 'lucide-react';

export function PreferencesStep() {
  const t = useTranslations('onboarding.preferences');
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <SettingsIcon className="w-10 h-10" />
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-lg text-gray-600">{t('subtitle')}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('notifications')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>{t('transactionAlerts')}</Label>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Gap 3: Date/Time Localization

#### Current Problem
```typescript
// ✗ HARDCODED - WRONG
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

// ✗ INCONSISTENT - WRONG
new Date(transaction.date).toLocaleDateString()
```

**Issues**:
- Always shows Dec 31, 2024 even for Spanish users
- Should show 31 dic 2024 for Spanish
- Browser default locale used in some places
- No timezone conversion

#### Required Implementation

**Step 1: Create locale-aware date utilities**
```typescript
// packages/shared/src/utils/date.ts
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

type LocaleCode = 'en' | 'es';

const dateLocales: Record<LocaleCode, any> = {
  en: enUS,
  es: es,
};

export function formatDate(
  date: Date | string,
  locale: LocaleCode = 'en',
  formatStr: string = 'PPP' // Dec 31, 2024 (en) or 31 de diciembre de 2024 (es)
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: dateLocales[locale] });
}

export function formatDateTime(
  date: Date | string,
  locale: LocaleCode = 'en',
  formatStr: string = 'PPp' // Dec 31, 2024, 2:30 PM
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: dateLocales[locale] });
}

export function formatShortDate(
  date: Date | string,
  locale: LocaleCode = 'en'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'PP', { locale: dateLocales[locale] });
}

// Timezone aware formatting
export function formatDateWithTimezone(
  date: Date | string,
  timezone: string,
  locale: LocaleCode = 'en'
): string {
  // Requires date-fns-tz
  // TODO: Implement with date-fns-tz for proper timezone handling
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'PPp', { locale: dateLocales[locale] });
}
```

**Step 2: Update frontend usage**
```typescript
// apps/web/src/lib/utils.ts
import { formatDate as formatDateUtil, formatShortDate as formatShortDateUtil } from '@dhanam/shared';
import { useLocale } from 'next-intl';

export function formatDate(date: Date | string): string {
  const locale = useLocale() as 'en' | 'es';
  return formatDateUtil(date, locale);
}

export function formatShortDate(date: Date | string): string {
  const locale = useLocale() as 'en' | 'es';
  return formatShortDateUtil(date, locale);
}
```

**Step 3: Update component usage**
```typescript
// Before (WRONG)
{new Date(transaction.date).toLocaleDateString()}

// After (CORRECT)
import { formatDate } from '@/lib/utils';
{formatDate(transaction.date)}
```

---

### Gap 4: Timezone Support

#### Current State
```typescript
// Stored but unused
user.timezone = "America/Mexico_City"
space.timezone = "America/Mexico_City"

// Only used for onboarding status check
status.preferences = user.timezone !== 'America/Mexico_City'
```

#### Required Implementation

**Step 1: Install date-fns-tz**
```bash
npm install date-fns-tz
```

**Step 2: Create timezone utilities**
```typescript
// packages/shared/src/utils/timezone.ts
import { formatInTimeZone } from 'date-fns-tz';
import { es, enUS } from 'date-fns/locale';

type LocaleCode = 'en' | 'es';

const dateLocales: Record<LocaleCode, any> = {
  en: enUS,
  es: es,
};

export function formatDateInTimezone(
  date: Date | string,
  timezone: string,
  locale: LocaleCode = 'en',
  format: string = 'PPP p'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, timezone, format, {
    locale: dateLocales[locale],
  });
}

export function convertToUserTimezone(
  date: Date,
  userTimezone: string
): Date {
  // Convert UTC date to user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  parts.forEach(({ type, value }) => {
    partMap[type] = value;
  });

  return new Date(
    `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}`
  );
}

export const TIMEZONES = [
  'America/Mexico_City',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney',
  // ... full IANA list
];
```

**Step 3: Update user preferences**
```typescript
// apps/web/src/contexts/PreferencesContext.tsx - Add timezone handling
export interface UserPreferences {
  // ... existing fields
  timezone: string; // Move from User model here or sync both
  locale: string;   // Move from User model here or sync both
}
```

---

### Gap 5: Backend i18n

#### Current State
All API responses have English error messages.

#### Required Implementation

**Step 1: Install nestjs-i18n**
```bash
npm install nestjs-i18n
```

**Step 2: Create backend translations**
```
apps/api/src/i18n/
├── en.json
├── es.json
└── en-errors.json
└── es-errors.json
```

**Step 3: Configure i18n in NestJS**
```typescript
// apps/api/src/core/i18n/i18n.module.ts
import { Module } from '@nestjs/common';
import { I18nModule, I18nService } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '../i18n'),
        watch: true,
      },
    }),
  ],
  exports: [I18nModule],
})
export class I18nConfigModule {}
```

**Step 4: Use in exception filter**
```typescript
// apps/api/src/core/filters/global-exception.filter.ts
import { I18nService } from 'nestjs-i18n';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private i18n: I18nService) {}

  catch(exception: unknown, host: ExecutionContext) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest();
    const locale = request.user?.locale || 'es';

    // Localize error message
    const message = this.i18n.t('errors.internalServerError', {
      lang: locale,
    });

    response.status(500).json({
      statusCode: 500,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**Step 5: Set Content-Language header**
```typescript
// apps/api/src/core/interceptors/locale.interceptor.ts
import { Injectable, NestInterceptor } from '@nestjs/common';

@Injectable()
export class LocaleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const locale = request.user?.locale || 'es';

    response.setHeader('Content-Language', locale);
    return next.handle();
  }
}
```

---

### Gap 6: Mobile i18n

#### Current State
No i18n implementation in React Native app.

#### Required Implementation

**Step 1: Install i18next for React Native**
```bash
npm install i18next react-i18next i18next-resources-to-backend
```

**Step 2: Configure i18n**
```typescript
// apps/mobile/src/services/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../i18n/en.json';
import es from '../i18n/es.json';

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard'],
    resources: {
      en: { common: en },
      es: { common: es },
    },
  });

export default i18n;
```

**Step 3: Use in components**
```typescript
import { useTranslation } from 'react-i18next';

export function PreferencesScreen() {
  const { t, i18n } = useTranslation();
  
  return (
    <View>
      <Text>{t('preferences.title')}</Text>
      <Picker
        selectedValue={i18n.language}
        onValueChange={(lang) => i18n.changeLanguage(lang)}
      >
        <Picker.Item label="Español" value="es" />
        <Picker.Item label="English" value="en" />
      </Picker>
    </View>
  );
}
```

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Install next-intl and configure
- [ ] Create translation JSON files (EN/ES)
- [ ] Set up i18n context and middleware
- [ ] Update root layout and routing

### Week 2: UI Components
- [ ] Extract hardcoded strings from components
- [ ] Update 50+ components with t() calls
- [ ] Add language switcher to settings
- [ ] Test locale switching

### Week 3: Date/Time & Timezone
- [ ] Install date-fns and date-fns-tz
- [ ] Create locale-aware date utilities
- [ ] Replace all date formatting in codebase
- [ ] Implement timezone display

### Week 4: Backend & Polish
- [ ] Set up backend i18n
- [ ] Localize API responses
- [ ] Implement mobile i18n
- [ ] Full testing and QA

---

## Critical Files to Update

```
Priority 1 (40 files):
- All components in /apps/web/src/components
- All pages in /apps/web/src/app
- All forms in /apps/web/src/components/forms

Priority 2 (API & Utils):
- /apps/api/src/core/filters/global-exception.filter.ts
- /apps/web/src/lib/utils.ts
- /packages/shared/src/utils/date.ts

Priority 3 (Mobile):
- /apps/mobile/src - all screens and components
```

---

## Testing Considerations

1. **Locale switching tests**: Verify UI updates when locale changes
2. **Date formatting tests**: Test all date formats for both locales
3. **Timezone conversion tests**: Verify dates display in user's timezone
4. **API response tests**: Verify Content-Language header and localized messages
5. **Component snapshot tests**: Update snapshots for all locales

