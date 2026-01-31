import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getGeoDefaults } from '@dhanam/shared';

import { User } from '@db';

import { PrismaService } from '../prisma/prisma.service';
import { DemoDataBuilder } from './demo-data.builder';

export interface PersonaInfo {
  key: string;
  email: string;
  name: string;
  archetype: string;
  features: string[];
  emoji: string;
}

export interface DemoAuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  persona: string;
}

const PERSONA_MAP: Record<string, PersonaInfo> = {
  guest: {
    key: 'guest',
    email: 'guest@dhanam.demo',
    name: 'Guest User',
    archetype: 'Quick Preview',
    features: ['Monthly budgeting', 'Multi-account overview', 'Crypto wallet tracking'],
    emoji: '👋',
  },
  maria: {
    key: 'maria',
    email: 'maria@dhanam.demo',
    name: 'Maria González',
    archetype: 'Young Professional',
    features: ['Zero-based budgeting', 'Belvo bank sync', 'ESG crypto scoring'],
    emoji: '🧑‍💼',
  },
  carlos: {
    key: 'carlos',
    email: 'carlos@dhanam.demo',
    name: 'Carlos Mendoza',
    archetype: 'Small Business Owner',
    features: ['Yours / Mine / Ours spaces', 'Business budgeting', 'Manual asset tracking'],
    emoji: '🏪',
  },
  patricia: {
    key: 'patricia',
    email: 'patricia@dhanam.demo',
    name: 'Patricia Ruiz',
    archetype: 'High Net Worth',
    features: ['Estate planning', 'Multi-currency accounts', 'Investment portfolios'],
    emoji: '💎',
  },
  diego: {
    key: 'diego',
    email: 'diego@dhanam.demo',
    name: 'Diego Navarro',
    archetype: 'Web3 / DeFi Native',
    features: ['Multi-chain DeFi', 'Gaming wallets & NFTs', 'DAO governance'],
    emoji: '🎮',
  },
};

@Injectable()
export class DemoAuthService {
  private demoDataBuilder: DemoDataBuilder;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.demoDataBuilder = new DemoDataBuilder(prisma);
  }

  async loginAsPersona(personaKey: string, countryCode?: string): Promise<DemoAuthResult> {
    const persona = PERSONA_MAP[personaKey];
    if (!persona) {
      throw new NotFoundException(`Unknown persona: ${personaKey}`);
    }

    const user = await this.ensurePersonaExists(personaKey, countryCode);
    const tokens = this.createDemoTokens(user, personaKey);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'demo.persona_login',
        metadata: JSON.stringify({ persona: personaKey, timestamp: new Date().toISOString() }),
        ipAddress: 'demo',
        userAgent: 'demo-access',
      },
    });

    return {
      user,
      ...tokens,
      persona: personaKey,
    };
  }

  async switchPersona(currentUserId: string, newPersonaKey: string): Promise<DemoAuthResult> {
    const persona = PERSONA_MAP[newPersonaKey];
    if (!persona) {
      throw new NotFoundException(`Unknown persona: ${newPersonaKey}`);
    }

    const user = await this.ensurePersonaExists(newPersonaKey);
    const tokens = this.createDemoTokens(user, newPersonaKey);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'demo.persona_switch',
        metadata: JSON.stringify({
          fromUserId: currentUserId,
          toPersona: newPersonaKey,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: 'demo',
        userAgent: 'demo-access',
      },
    });

    return {
      user,
      ...tokens,
      persona: newPersonaKey,
    };
  }

  getAvailablePersonas(): PersonaInfo[] {
    return Object.values(PERSONA_MAP);
  }

  private async ensurePersonaExists(personaKey: string, countryCode?: string): Promise<User> {
    const persona = PERSONA_MAP[personaKey];
    let user = await this.prisma.user.findUnique({
      where: { email: persona.email },
    });

    if (!user) {
      // Persona user doesn't exist (fresh DB without seed) — create on the fly
      const geo = getGeoDefaults(countryCode ?? null);
      user = await this.demoDataBuilder.buildPersona(personaKey, geo);
    }

    return user;
  }

  private createDemoTokens(
    user: User,
    personaKey: string,
  ): { accessToken: string; refreshToken: string; expiresIn: number } {
    const payload = {
      sub: user.id,
      email: user.email,
      isDemo: true,
      isGuest: personaKey === 'guest',
      persona: personaKey,
      permissions: ['read'],
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '2h' });
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '4h',
      },
    );

    return { accessToken, refreshToken, expiresIn: 7200 };
  }
}
