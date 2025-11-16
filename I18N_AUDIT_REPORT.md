# Dhanam Ledger - Localization & i18n Implementation Audit

## Executive Summary

The Dhanam Ledger project has **incomplete localization implementation**. While there is foundational support for locale and timezone storage, the i18n system is severely underdeveloped with minimal translation coverage and inconsistent localization practices across the application.

**Overall Completeness: 25-30%**

---

## 1. TRANSLATION FILES AUDIT

### Current State

#### ✓ Partially Implemented
- **Location**: `/packages/shared/src/i18n/index.ts`
- **Coverage**: 4 common terms only
  - Spanish: Guardar, Cancelar, Eliminar, Cargando...
  - English: Save, Cancel, Delete, Loading...

#### ✗ Critical Gaps
- **No comprehensive translation dictionaries**
- **No translation files** (no .json or structured translation files)
- **No nested translation structure** for features:
  - Onboarding flows
  - Dashboard labels
  - Budget/Account management
  - Error messages
  - Form labels and placeholders
  - Settings/Preferences
  - Admin interface
  - Email templates

#### Hardcoded Text Examples
Analysis reveals **extensive hardcoded Spanish text** throughout the codebase:

**In Onboarding Components** (`apps/web/src/components/onboarding/steps/preferences-step.tsx`):
```
- "Configura tus preferencias" (Configure your preferences)
- "Configuración Regional" (Regional Settings)
- "Idioma" (Language)
- "Zona horaria" (Timezone)
- "Moneda Principal" (Main Currency)
- "Notificaciones" (Notifications)
- "Alertas de transacciones" (Transaction alerts)
- "Alertas de presupuesto" (Budget alerts)
- "Resumen semanal" (Weekly report)
- "Reporte mensual" (Monthly report)
- "Guardar y continuar" (Save and continue)
```

**In Settings Components** (`apps/web/src/components/settings/PreferencesSection.tsx`):
```
- "Preferencias actualizadas correctamente" (Preferences updated successfully)
- "¿Estás seguro que quieres restablecer..." (Are you sure you want to reset...)
- "Notificaciones" (Notifications)
- "Configura cómo y cuándo quieres recibir notificaciones"
- "Última actualización:" (Last updated:)
```

**Authentication Forms** (`apps/web/src/components/forms/login-form.tsx`):
```
- Mix of English error messages (from API)
- "Welcome back" (English)
- "Invalid email or password" (English)
```

---

## 2. i18N SETUP AUDIT

### Frontend (Next.js Web App)

#### ✗ No Dedicated i18n Library
- **Missing**: No `next-intl`, `react-i18next`, `i18next`, or similar library in dependencies
- **Package.json Review**: Only has `@dhanam/shared` for i18n, which contains minimal translations

#### ✓ Partial Locale Support
- Locale constants defined in `/packages/shared/src/constants/locales.ts`:
  ```typescript
  export const LOCALES = {
    EN: 'en',
    ES: 'es',
  } as const;
  ```

#### ✗ No i18n Middleware/Configuration
- **Middleware** (`apps/web/src/middleware.ts`): Only handles authentication, not locale routing
- **Root Layout** (`apps/web/src/app/layout.tsx`):
  ```typescript
  <html lang="en" suppressHydrationWarning>
  ```
  - **Problem**: Hardcoded to "en", does not reflect user's selected locale

#### ✗ Locale Detection
- **Missing**: No Accept-Language header detection
- **Missing**: No locale cookie/storage detection
- **Missing**: No geolocation-based default locale
- **Current behavior**: Defaults to Spanish during registration but not used dynamically

### Backend (NestJS API)

#### ✓ Locale & Timezone Storage
- User model stores:
  ```prisma
  locale String @default("es")
  timezone String @default("America/Mexico_City")
  ```

#### ✓ Locale-Based Defaults
- Preferences service uses locale for currency defaults (line 207):
  ```typescript
  const defaultCurrency = user.locale === 'es' ? Currency.MXN : Currency.USD;
  ```

#### ✗ No Message Localization
- Error messages are hardcoded in English
- No backend i18n system for API responses
- Email service likely uses hardcoded templates (not verified in audit)

### Mobile (React Native + Expo)

#### ✗ No i18n Implementation
- No i18n files found in `/apps/mobile`
- No i18n library in mobile dependencies (package.json not fully reviewed)
- Likely inherits from shared but not utilized

---

## 3. CURRENCY FORMATTING AUDIT

### ✓ Implementation Status: GOOD

#### MXN/USD/EUR Support
**Currencies Constant** (`/packages/shared/src/constants/currencies.ts`):
```typescript
export const CURRENCIES: Record<Currency, {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
}> = {
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
};
```

#### Currency Formatting Functions

**Backend** (`packages/shared/src/utils/currency.ts`):
```typescript
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string = 'es-MX'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: CURRENCIES[currency].decimals,
    maximumFractionDigits: CURRENCIES[currency].decimals,
  }).format(amount);
}
```

**Frontend** (`apps/web/src/lib/utils.ts`):
```typescript
export function formatCurrency(amount: number, currency: Currency): string {
  const locale = currency === 'MXN' ? 'es-MX' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

#### ✓ Banxico FX Rate Integration

**FX Rates Service** (`apps/api/src/modules/fx-rates/fx-rates.service.ts`):
```
✓ Real-time Banxico API integration
✓ Supported pairs:
  - USD/MXN (Series ID: SF43718)
  - EUR/MXN (Series ID: SF46410)
  - Cross-rate calculations for USD/EUR
✓ Redis caching (1 hour TTL)
✓ Database historical rate storage
✓ Hourly automated rate updates via @Cron
✓ Fallback rates if API unavailable
✓ Error handling with database/hardcoded fallback
```

#### Issues
- Frontend formatCurrency uses hardcoded locale per currency (no user preference awareness)
- User's timezone not used in any currency-related calculations
- Exchange rate conversion available but not exposed in frontend API

---

## 4. DATE/TIME FORMATTING AUDIT

### ✗ Implementation Status: POOR

#### Date Formatting Functions

**Frontend** (`apps/web/src/lib/utils.ts`):
```typescript
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {  // ✗ HARDCODED
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {  // ✗ HARDCODED
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
```

**Problems**:
- Hardcoded to 'en-US' ignoring user's locale preference
- No timezone support (defaults to browser timezone)
- User's timezone preference is stored but never used for display

#### Inconsistent Date Formatting

**39 instances of date formatting** across the codebase:

1. **Using formatDate()** - 12 instances (consistent but hardcoded locale)
   - budgets/page.tsx
   - transactions/page.tsx
   
2. **Using toLocaleDateString()** - 15+ instances (using browser default)
   ```typescript
   new Date(transaction.date).toLocaleDateString()
   new Date(account.lastSyncedAt).toLocaleDateString()
   ```

3. **Raw Date.toString()** - Some instances show raw dates

#### ✗ Timezone Handling
- **User timezone stored**: `user.timezone` defaults to "America/Mexico_City"
- **Timezone used in**:
  - Onboarding status calculation (line 103): checks if timezone differs from default
  - Space model stores timezone with same default
- **Timezone NOT used for**:
  - Date display conversions
  - Time zone-aware scheduling
  - Offset calculations for forecasts

#### ✗ Date Localization
- **date-fns library imported** but not used for localization
- **No locale-specific date patterns**:
  - Spanish: 31 de diciembre de 2024 (not: Dec 31, 2024)
  - English: December 31, 2024 (supported)

---

## 5. USER PREFERENCES AUDIT

### ✓ Storage and Management

**Preferences Model** (Prisma schema):
```prisma
model UserPreferences {
  defaultCurrency: Currency @default(MXN)
  // ...other preferences
}
```

**Also Stored on User Model**:
```prisma
model User {
  locale String @default("es")
  timezone String @default("America/Mexico_City")
}
```

### ✓ Preference Persistence
- Full CRUD operations in PreferencesService
- Preferences fetched on user login via PreferencesContext
- Bulk update support with audit logging
- Reset to defaults functionality

### ✗ Integration with UI

**PreferencesSection.tsx Issues**:
- Hardcoded Spanish labels (e.g., "Preferencias actualizadas correctamente")
- No confirmation dialog translations
- No dynamic locale switching UI

**PreferencesStep (Onboarding) Issues**:
- Locale selection available but hardcoded to Spanish/English only
- Timezone limited to 4 options (no free-form entry)
- Currency preference set but not persisted to user.defaultCurrency properly

### ✓ Locale/Timezone Selection
- Frontend allows selection in onboarding
- Stored in User model, not in UserPreferences
- Separate update path via updateProfile()

---

## 6. LOCALIZATION GAPS & RECOMMENDATIONS

### Critical Gaps

#### 1. No Comprehensive Translation System
**Impact**: High - Users cannot use app in their preferred language
**Recommendation**: Implement a proper i18n library:
```
Option A: next-intl (Next.js native, recommended)
Option B: react-i18next (with i18next backend)
Option C: Custom solution if lightweight preferred
```

#### 2. Hardcoded UI Text
**Impact**: High - 100+ Spanish strings not translateable
**Affected Areas**:
- Onboarding flows (6+ screens)
- Dashboard cards and labels
- Settings/Preferences
- Error messages
- Form placeholders
- Admin interface

#### 3. Date/Time Localization
**Impact**: Medium - Dates always show in en-US format
**Recommendation**: 
- Create locale-aware formatDate() accepting locale parameter
- Use date-fns with locale imports:
  ```typescript
  import { format } from 'date-fns';
  import { es, enUS } from 'date-fns/locale';
  ```
- Apply user's timezone for display

#### 4. Missing Timezone Application
**Impact**: Medium - Stored but never used
**Recommendation**:
- Implement date-to-timezone conversion using date-fns-tz
- Show timezone in user settings with visual indicator
- Apply to all temporal data displays

#### 5. No Locale Detection
**Impact**: Low-Medium - Defaults work but not optimal
**Recommendation**:
- Detect Accept-Language header during signup
- Use geolocation as secondary hint
- Allow manual override in onboarding

#### 6. Backend Internationalization
**Impact**: Medium - API errors in English only
**Recommendation**:
- Implement backend i18n (e18n, nestjs-i18n, or custom)
- Localize error responses
- Localize email templates
- Consider setting `Content-Language` header in responses

---

## Summary of Implementation Status

| Component | Status | Completeness | Priority |
|-----------|--------|--------------|----------|
| Translation Files | ✗ Minimal | 5% | CRITICAL |
| i18n Library Setup | ✗ None | 0% | CRITICAL |
| Locale Detection | ✗ None | 0% | HIGH |
| Locale Storage | ✓ Done | 100% | - |
| Currency Formatting | ✓ Done | 90% | - |
| Currency Conversion | ✓ Done | 100% | - |
| FX Rate Integration | ✓ Done | 100% | - |
| Date Formatting | ✗ Hardcoded | 30% | HIGH |
| Timezone Handling | ✗ Unused | 10% | MEDIUM |
| User Preferences UI | ✗ Hardcoded | 40% | HIGH |
| Mobile i18n | ✗ None | 0% | MEDIUM |
| Backend i18n | ✗ None | 0% | MEDIUM |

---

## Recommendations (Prioritized)

### Phase 1: Foundation (1-2 weeks)
1. Implement next-intl library for frontend
2. Create comprehensive translation structure for ES/EN
3. Extract hardcoded strings to translation files
4. Update Root Layout to use user's locale

### Phase 2: Date/Time (1 week)
1. Integrate date-fns localization
2. Create locale-aware formatDate() function
3. Replace hardcoded 'en-US' throughout codebase
4. Implement timezone-aware date display

### Phase 3: Backend & API (1 week)
1. Implement backend i18n system
2. Localize error messages and email templates
3. Add Content-Language header to responses
4. Create i18n API endpoints for frontend

### Phase 4: Polish (1 week)
1. Locale auto-detection (Accept-Language)
2. Enhanced timezone selector with full IANA support
3. Mobile i18n implementation
4. Testing and QA for all languages/timezones

---

## File References

**i18n Files**:
- `/packages/shared/src/i18n/index.ts` - Minimal i18n object
- `/packages/shared/src/constants/locales.ts` - Locale constants
- `/packages/shared/src/constants/currencies.ts` - Currency definitions

**Locale/Timezone Storage**:
- `/apps/api/prisma/schema.prisma` - User model with locale/timezone
- `/apps/api/src/modules/preferences/preferences.service.ts` - Preference defaults based on locale

**Currency Utilities**:
- `/packages/shared/src/utils/currency.ts` - formatCurrency() with Intl.NumberFormat
- `/apps/web/src/lib/utils.ts` - Frontend currency formatting
- `/apps/api/src/modules/fx-rates/fx-rates.service.ts` - Banxico API integration

**Date Utilities**:
- `/packages/shared/src/utils/date.ts` - Basic date utilities (not localized)
- `/apps/web/src/lib/utils.ts` - formatDate(), formatDateTime() (hardcoded en-US)

**Components Using i18n**:
- `/apps/web/src/components/onboarding/steps/preferences-step.tsx` - Locale/timezone selection
- `/apps/web/src/components/settings/PreferencesSection.tsx` - Preferences UI (Spanish-only)
- `/apps/web/src/contexts/PreferencesContext.tsx` - Preference persistence

