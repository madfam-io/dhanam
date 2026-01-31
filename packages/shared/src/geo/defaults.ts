import type { Locale } from '../types';

export interface GeoDefaults {
  locale: Locale;
  currency: string;
  timezone: string;
  region: 'latam' | 'na' | 'eu' | 'other';
}

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'SE',
];

const COUNTRY_DEFAULTS: Record<string, GeoDefaults> = {
  MX: { locale: 'es', currency: 'MXN', timezone: 'America/Mexico_City', region: 'latam' },
  US: { locale: 'en', currency: 'USD', timezone: 'America/New_York', region: 'na' },
  CA: { locale: 'en', currency: 'CAD', timezone: 'America/Toronto', region: 'na' },
  BR: { locale: 'pt-BR', currency: 'BRL', timezone: 'America/Sao_Paulo', region: 'latam' },
  CO: { locale: 'es', currency: 'COP', timezone: 'America/Bogota', region: 'latam' },
  ES: { locale: 'es', currency: 'EUR', timezone: 'Europe/Madrid', region: 'eu' },
  FR: { locale: 'en', currency: 'EUR', timezone: 'Europe/Paris', region: 'eu' },
  DE: { locale: 'en', currency: 'EUR', timezone: 'Europe/Berlin', region: 'eu' },
  IT: { locale: 'en', currency: 'EUR', timezone: 'Europe/Rome', region: 'eu' },
  NL: { locale: 'en', currency: 'EUR', timezone: 'Europe/Amsterdam', region: 'eu' },
  PT: { locale: 'pt-BR', currency: 'EUR', timezone: 'Europe/Lisbon', region: 'eu' },
};

const EU_FALLBACK: GeoDefaults = { locale: 'en', currency: 'EUR', timezone: 'Europe/Madrid', region: 'eu' };
const FALLBACK: GeoDefaults = { locale: 'es', currency: 'MXN', timezone: 'America/Mexico_City', region: 'latam' };

export function getGeoDefaults(countryCode: string | null | undefined): GeoDefaults {
  if (!countryCode) return FALLBACK;

  const code = countryCode.toUpperCase();

  if (COUNTRY_DEFAULTS[code]) return COUNTRY_DEFAULTS[code];
  if (EU_COUNTRIES.includes(code)) return EU_FALLBACK;

  return FALLBACK;
}
