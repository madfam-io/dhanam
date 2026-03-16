import {
  LMCategory,
  LMTag,
  LMAsset,
  LMPlaidAccount,
  LMCrypto,
  LMTransaction,
  LMRecurringItem,
  LMBudget,
} from './lunchmoney-types';

const BASE_URL = 'https://dev.lunchmoney.app';

export class LunchMoneyClient {
  private token: string;
  private delayMs: number;

  constructor(token: string, delayMs = 100) {
    this.token = token;
    this.delayMs = delayMs;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await this.sleep(1000 * Math.pow(2, attempt)); // 1s, 2s, 4s
        }
        await this.sleep(this.delayMs); // Rate limit delay

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`LunchMoney API error ${response.status}: ${await response.text()}`);
        }

        return (await response.json()) as T;
      } catch (err) {
        lastError = err as Error;
        console.warn(`LM API attempt ${attempt + 1} failed for ${path}: ${lastError.message}`);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getCategories(): Promise<LMCategory[]> {
    const data = await this.request<{ categories: LMCategory[] }>('/v1/categories');
    return data.categories;
  }

  async getTags(): Promise<LMTag[]> {
    return this.request<LMTag[]>('/v1/tags');
  }

  async getAssets(): Promise<LMAsset[]> {
    const data = await this.request<{ assets: LMAsset[] }>('/v1/assets');
    return data.assets;
  }

  async getPlaidAccounts(): Promise<LMPlaidAccount[]> {
    const data = await this.request<{ plaid_accounts: LMPlaidAccount[] }>('/v1/plaid_accounts');
    return data.plaid_accounts;
  }

  async getCrypto(): Promise<LMCrypto[]> {
    const data = await this.request<{ crypto: LMCrypto[] }>('/v1/crypto');
    return data.crypto;
  }

  async getTransactions(startDate: string, endDate: string): Promise<LMTransaction[]> {
    const data = await this.request<{ transactions: LMTransaction[] }>('/v1/transactions', {
      start_date: startDate,
      end_date: endDate,
      debit_as_negative: 'true',
    });
    return data.transactions;
  }

  async getAllTransactions(startDate: string, endDate: string): Promise<LMTransaction[]> {
    // Fetch in monthly batches to avoid API limits
    const allTransactions: LMTransaction[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const batchStart = current.toISOString().slice(0, 10);
      const batchEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const batchEndStr = batchEnd > end ? endDate : batchEnd.toISOString().slice(0, 10);

      console.log(`  Fetching transactions ${batchStart} to ${batchEndStr}...`);
      const batch = await this.getTransactions(batchStart, batchEndStr);
      allTransactions.push(...batch);

      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }

    return allTransactions;
  }

  async getRecurringItems(): Promise<LMRecurringItem[]> {
    const data = await this.request<{ recurring_items: LMRecurringItem[] }>('/v1/recurring_items');
    return data.recurring_items;
  }

  async getBudgets(startDate: string, endDate: string): Promise<LMBudget[]> {
    return this.request<LMBudget[]>('/v1/budgets', {
      start_date: startDate,
      end_date: endDate,
    });
  }
}
