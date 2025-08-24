import { Currency } from '../types';

export const CURRENCIES: Record<Currency, {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
}> = {
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    decimals: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
  },
};

export const DEFAULT_CURRENCY: Currency = 'MXN';