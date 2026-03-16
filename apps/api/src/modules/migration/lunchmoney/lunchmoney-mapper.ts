import { AccountType, Currency, RecurrenceFrequency, Provider } from '@db';

import { LMAsset, LMPlaidAccount, LMCrypto, LMRecurringItem } from './lunchmoney-types';

export function mapCurrency(lmCurrency: string): Currency {
  const normalized = lmCurrency.toUpperCase();
  switch (normalized) {
    case 'MXN':
      return Currency.MXN;
    case 'USD':
      return Currency.USD;
    case 'EUR':
      return Currency.EUR;
    case 'CAD':
      return Currency.CAD;
    default:
      console.warn(`Unknown currency "${lmCurrency}", defaulting to MXN`);
      return Currency.MXN;
  }
}

export function mapAssetType(lmType: string): AccountType {
  const normalized = lmType.toLowerCase();
  switch (normalized) {
    case 'cash':
    case 'checking':
      return AccountType.checking;
    case 'savings':
      return AccountType.savings;
    case 'credit card':
    case 'credit':
      return AccountType.credit;
    case 'investment':
    case 'brokerage':
    case 'employee compensation':
      return AccountType.investment;
    case 'cryptocurrency':
    case 'crypto':
      return AccountType.crypto;
    default:
      return AccountType.other;
  }
}

export function mapPlaidAccountType(lmType: string, subtype?: string | null): AccountType {
  const normalized = lmType.toLowerCase();
  switch (normalized) {
    case 'depository':
      return subtype?.toLowerCase() === 'savings' ? AccountType.savings : AccountType.checking;
    case 'credit':
      return AccountType.credit;
    case 'investment':
      return AccountType.investment;
    default:
      return AccountType.other;
  }
}

export function mapRecurringCadence(lmCadence: string): RecurrenceFrequency {
  const normalized = lmCadence.toLowerCase();
  if (normalized.includes('twice a month') || normalized.includes('biweekly'))
    return RecurrenceFrequency.biweekly;
  if (normalized.includes('6 month') || normalized.includes('semi'))
    return RecurrenceFrequency.quarterly; // Closest available
  if (normalized.includes('3 month') || normalized.includes('quarter'))
    return RecurrenceFrequency.quarterly;
  if (normalized.includes('year') || normalized.includes('annual'))
    return RecurrenceFrequency.yearly;
  if (normalized.includes('week')) return RecurrenceFrequency.weekly;
  if (normalized.includes('month')) return RecurrenceFrequency.monthly;
  return RecurrenceFrequency.monthly;
}

export function mapAssetToAccount(asset: LMAsset) {
  return {
    provider: Provider.manual,
    providerAccountId: `lm-asset-${asset.id}`,
    name: asset.display_name || asset.name,
    type: mapAssetType(asset.type_name),
    subtype: asset.subtypeName || undefined,
    currency: mapCurrency(asset.currency),
    balance: parseFloat(asset.balance),
    institutionName: asset.institution_name || undefined,
    metadata: { lunchMoneyId: asset.id, lunchMoneyType: 'asset' },
  };
}

export function mapPlaidAccountToAccount(plaid: LMPlaidAccount) {
  return {
    provider: Provider.manual, // Can't migrate linked accounts
    providerAccountId: `lm-plaid-${plaid.id}`,
    name: plaid.display_name || plaid.name,
    type: mapPlaidAccountType(plaid.type, plaid.subtype),
    subtype: plaid.subtype || undefined,
    currency: mapCurrency(plaid.currency),
    balance: parseFloat(plaid.balance),
    institutionName: plaid.institution_name || undefined,
    metadata: {
      lunchMoneyId: plaid.id,
      lunchMoneyType: 'plaid_account',
      institutionName: plaid.institution_name,
      mask: plaid.mask,
    },
  };
}

export function mapCryptoToAccount(crypto: LMCrypto) {
  return {
    provider: Provider.manual,
    providerAccountId: `lm-crypto-${crypto.id}`,
    name: crypto.display_name || crypto.name,
    type: AccountType.crypto,
    currency: mapCurrency(crypto.currency),
    balance: parseFloat(crypto.balance),
    institutionName: crypto.institution_name || undefined,
    metadata: {
      lunchMoneyId: crypto.id,
      lunchMoneyType: 'crypto',
      source: crypto.source,
    },
  };
}

export function mapRecurringItem(item: LMRecurringItem) {
  return {
    merchantName: item.payee,
    expectedAmount: Math.abs(parseFloat(item.amount)),
    currency: mapCurrency(item.currency),
    frequency: mapRecurringCadence(item.cadence),
    notes: item.description,
    metadata: {
      lunchMoneyId: item.id,
      lunchMoneyType: 'recurring',
      cadence: item.cadence,
      source: item.source,
    },
  };
}
