import { PrismaService } from '../../prisma/prisma.service';

import { cryptoESGData } from './templates';
import { DemoContext } from './types';

export class ESGBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    const cryptoAccounts = ctx.accounts.filter((a) => a.type === 'crypto');
    if (cryptoAccounts.length === 0) return;

    // Assign different subsets of ESG data based on persona
    const symbolMap: Record<string, string[]> = {
      guest: ['BTC', 'ETH'],
      maria: ['BTC', 'ETH', 'SOL'],
      carlos: [],
      patricia: [],
      diego: ['BTC', 'ETH', 'MATIC', 'UNI', 'AAVE', 'SAND', 'ENS', 'LINK', 'CRV', 'LDO'],
    };

    const symbols = symbolMap[ctx.personaKey] ?? ['BTC', 'ETH'];
    if (symbols.length === 0) return;

    const rows: Array<{
      accountId: string;
      assetSymbol: string;
      environmentalScore: number;
      socialScore: number;
      governanceScore: number;
      compositeScore: number;
      calculatedAt: Date;
    }> = [];

    for (const account of cryptoAccounts) {
      for (const sym of symbols) {
        const data = cryptoESGData.find((d) => d.symbol === sym);
        if (!data) continue;
        const composite = Math.round(((data.env + data.social + data.gov) / 3) * 100) / 100;
        rows.push({
          accountId: account.id,
          assetSymbol: sym,
          environmentalScore: data.env,
          socialScore: data.social,
          governanceScore: data.gov,
          compositeScore: composite,
          calculatedAt: new Date(),
        });
      }
    }

    if (rows.length > 0) {
      await this.prisma.eSGScore.createMany({ data: rows });
    }
  }
}
