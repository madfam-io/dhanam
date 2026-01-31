import { SimulationType } from '@db';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

export class SimulationsBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    const sims = this.getSimsForPersona(ctx);
    if (sims.length === 0) return;

    await this.prisma.simulation.createMany({ data: sims });
  }

  private getSimsForPersona(ctx: DemoContext) {
    const spaceId = ctx.spaces[0]?.id;
    if (!spaceId) return [];
    const userId = ctx.user.id;

    const base = { userId, spaceId, status: 'completed' as const };

    switch (ctx.personaKey) {
      case 'guest':
        return [
          {
            ...base,
            type: SimulationType.retirement,
            config: {
              iterations: 10000,
              horizon_years: 20,
              monthly_contribution: 5000,
              expected_return: 0.07,
              volatility: 0.15,
              inflation: 0.04,
            },
            result: {
              median: 1050000,
              p10: 720000,
              p25: 850000,
              p75: 1280000,
              p90: 1520000,
              probability_of_success: 87.5,
            },
            executionTimeMs: 2340,
          },
        ];

      case 'maria':
        return [
          {
            ...base,
            type: SimulationType.goal_probability,
            config: {
              iterations: 10000,
              target: 600000,
              horizon_years: 4,
              monthly_contribution: 8000,
              expected_return: 0.06,
              volatility: 0.12,
            },
            result: {
              median: 520000,
              p10: 400000,
              p25: 450000,
              p75: 600000,
              p90: 700000,
              probability_of_success: 68.5,
            },
            executionTimeMs: 1890,
          },
        ];

      case 'carlos':
        return [
          {
            ...base,
            type: SimulationType.scenario_analysis,
            config: {
              scenarios: ['bull', 'base', 'bear'],
              horizon_years: 2,
              monthly_contribution: 25000,
              current_savings: 450000,
            },
            result: {
              bull: { final: 1680000, probability: 0.25 },
              base: { final: 1420000, probability: 0.5 },
              bear: { final: 1100000, probability: 0.25 },
              weighted_probability: 65.7,
            },
            executionTimeMs: 3120,
          },
        ];

      case 'patricia':
        return [
          {
            ...base,
            type: SimulationType.safe_withdrawal,
            config: {
              portfolio_value: 5000000,
              annual_spending: 200000,
              horizon_years: 30,
              expected_return: 0.06,
              volatility: 0.14,
              inflation: 0.03,
            },
            result: {
              safe_withdrawal_rate: 3.8,
              success_probability: 94.2,
              median_ending_balance: 6200000,
              worst_case_depletion_year: 26,
            },
            executionTimeMs: 4560,
          },
          {
            ...base,
            type: SimulationType.retirement,
            config: {
              iterations: 10000,
              horizon_years: 15,
              monthly_contribution: 15000,
              expected_return: 0.07,
              volatility: 0.14,
              inflation: 0.03,
              current_portfolio: 5000000,
            },
            result: {
              median: 12500000,
              p10: 8200000,
              p25: 9800000,
              p75: 15000000,
              p90: 18500000,
              probability_of_success: 89.3,
            },
            executionTimeMs: 3800,
          },
        ];

      case 'diego':
        return [
          {
            ...base,
            type: SimulationType.scenario_analysis,
            config: {
              label: 'Metaverse Earnings Projection',
              scenarios: ['bull', 'base', 'bear'],
              horizon_years: 3,
              income_streams: {
                land_rental: { monthly: 300 },
                staking_rewards: { monthly: 128 },
                p2e_earnings: { monthly: 200 },
              },
            },
            result: {
              bull: { total_income_3y: 68400, land_value: 15600, probability: 0.2 },
              base: { total_income_3y: 42000, land_value: 9800, probability: 0.55 },
              bear: { total_income_3y: 18000, land_value: 4200, probability: 0.25 },
            },
            executionTimeMs: 2890,
          },
          {
            ...base,
            type: SimulationType.scenario_analysis,
            config: {
              label: 'Multi-Chain Portfolio Risk',
              scenarios: ['chain_hack', 'market_crash', 'regulatory'],
              chains: ['ethereum', 'polygon', 'arbitrum', 'base'],
              total_value: 54000,
            },
            result: {
              chain_hack: { max_loss: 12000, probability: 0.05 },
              market_crash: { max_loss: 32400, probability: 0.15 },
              regulatory: { max_loss: 21600, probability: 0.1 },
              risk_score: 72,
              diversification_score: 68,
            },
            executionTimeMs: 4120,
          },
        ];

      default:
        return [];
    }
  }
}
