import { subHours } from 'date-fns';

import { ConnectionStatus } from '@db';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

export class ConnectionsBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    // Create Connection records for non-manual accounts
    const providerAccounts = ctx.accounts.filter((a) => a.provider !== 'manual');
    if (providerAccounts.length === 0) return;

    for (const account of providerAccounts) {
      await this.prisma.connection.upsert({
        where: { accountId: account.id },
        update: {},
        create: {
          accountId: account.id,
          status: ConnectionStatus.active,
          metadata: {
            lastSync: subHours(new Date(), 2).toISOString(),
            syncCount: Math.floor(Math.random() * 50) + 10,
          },
        },
      });
    }

    // ProviderConnection records (encrypted token stubs)
    const providerMap: Record<string, Array<{ provider: string; providerUserId: string }>> = {
      maria: [
        { provider: 'belvo', providerUserId: 'belvo-maria-bbva' },
        { provider: 'belvo', providerUserId: 'belvo-maria-nu' },
        { provider: 'bitso', providerUserId: 'bitso-maria' },
      ],
      carlos: [{ provider: 'belvo', providerUserId: 'belvo-carlos-bbva' }],
      patricia: [
        { provider: 'plaid', providerUserId: 'plaid-patricia-chase' },
        { provider: 'plaid', providerUserId: 'plaid-patricia-amex' },
      ],
      diego: [
        { provider: 'bitso', providerUserId: 'bitso-diego' },
        { provider: 'blockchain', providerUserId: 'zapper-diego-eth' },
        { provider: 'blockchain', providerUserId: 'zapper-diego-polygon' },
      ],
    };

    const connections = providerMap[ctx.personaKey] ?? [];
    for (const conn of connections) {
      await this.prisma.providerConnection.upsert({
        where: {
          userId_provider_providerUserId: {
            userId: ctx.user.id,
            provider: conn.provider as any,
            providerUserId: conn.providerUserId,
          },
        },
        update: {},
        create: {
          userId: ctx.user.id,
          provider: conn.provider as any,
          providerUserId: conn.providerUserId,
          encryptedToken: 'DEMO_ENCRYPTED_TOKEN_STUB',
          metadata: { demo: true, lastSync: subHours(new Date(), 2).toISOString() },
        },
      });
    }
  }
}
