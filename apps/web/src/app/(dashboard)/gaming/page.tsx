'use client';

import { Gamepad2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@dhanam/ui';
import { Currency } from '@dhanam/shared';
import { formatCurrency } from '~/lib/utils';

import { SandOverview } from '@/components/gaming/sand-overview';
import { LandPortfolio } from '@/components/gaming/land-portfolio';
import { NftGallery } from '@/components/gaming/nft-gallery';
import { GamingEarningsChart } from '@/components/gaming/gaming-earnings-chart';
import { GovernanceActivity } from '@/components/gaming/governance-activity';

// Mock data — in production these would come from the gaming API
const MOCK_PARCELS = [
  {
    coordinates: '(-12, 45)',
    size: '3x3',
    acquiredDate: '2022-01-15',
    rentalStatus: 'rented' as const,
    monthlyRental: 150,
  },
  {
    coordinates: '(8, -22)',
    size: '1x1',
    acquiredDate: '2022-06-10',
    rentalStatus: 'rented' as const,
    monthlyRental: 150,
  },
  {
    coordinates: '(31, 17)',
    size: '1x1',
    acquiredDate: '2023-03-01',
    rentalStatus: 'vacant' as const,
  },
  {
    coordinates: '(5, 60)',
    size: '1x1',
    acquiredDate: '2023-06-15',
    rentalStatus: 'vacant' as const,
  },
  {
    coordinates: '(-3, -8)',
    size: '1x1',
    acquiredDate: '2023-09-01',
    rentalStatus: 'vacant' as const,
  },
];

const MOCK_NFTS = [
  {
    name: 'BAYC #7291',
    collection: 'Bored Ape Yacht Club',
    currentValue: 18500,
    acquisitionCost: 32000,
  },
  {
    name: 'Decentraland Wearables',
    collection: 'Decentraland',
    currentValue: 850,
    acquisitionCost: 1200,
  },
  { name: 'diegonavarro.eth', collection: 'ENS', currentValue: 3200, acquisitionCost: 800 },
];

const MOCK_EARNINGS = [
  { label: 'Staking Rewards', amount: 57, color: '#F1C40F' },
  { label: 'LAND Rental', amount: 135, color: '#E67E22' },
  { label: 'Creator Revenue', amount: 320, color: '#9B59B6' },
  { label: 'P2E Earnings', amount: 85, color: '#2ECC71' },
];

const MOCK_PROPOSALS = [
  { id: 'SIP-42', title: 'SIP-42: Creator Fund Allocation Q1 2026', status: 'active' as const },
  {
    id: 'SIP-41',
    title: 'SIP-41: LAND Staking Rewards Increase',
    status: 'passed' as const,
    votedAt: '2025-12-15',
    userVote: 'for' as const,
  },
  {
    id: 'SIP-40',
    title: 'SIP-40: Marketplace Fee Reduction',
    status: 'passed' as const,
    votedAt: '2025-11-20',
    userVote: 'for' as const,
  },
  {
    id: 'SIP-39',
    title: 'SIP-39: Cross-chain Bridge Proposal',
    status: 'rejected' as const,
    votedAt: '2025-10-01',
    userVote: 'against' as const,
  },
];

export default function GamingPage() {
  const totalGamingAssets = 7800 + 18500 + 850 + 3200 + 15000 * 0.45;
  const monthlyIncome = MOCK_EARNINGS.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Gamepad2 className="h-8 w-8" />
          Gaming Dashboard
        </h2>
        <p className="text-muted-foreground">
          Track your metaverse assets, earnings, and governance activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gaming Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalGamingAssets, Currency.USD)}
            </div>
            <p className="text-xs text-muted-foreground">Across LAND, NFTs, and staked SAND</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Gaming Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyIncome, Currency.USD)}
            </div>
            <p className="text-xs text-muted-foreground">Rental + Staking + Creator + P2E</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SAND Staked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,000</div>
            <p className="text-xs text-muted-foreground">8.5% APY</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active LAND Parcels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 rented, 3 vacant</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SandOverview sandStaked={15000} stakingApy={8.5} monthlyReward={106.25} />

        <LandPortfolio parcels={MOCK_PARCELS} floorPriceUsd={1450} totalValueUsd={7800} />

        <NftGallery items={MOCK_NFTS} totalValueUsd={22550} />

        <GamingEarningsChart earnings={MOCK_EARNINGS} totalMonthly={monthlyIncome} />
      </div>

      {/* Governance Activity */}
      <GovernanceActivity
        proposals={MOCK_PROPOSALS}
        totalVotesCast={14}
        votingPower={15000}
        votingPowerToken="SAND"
      />
    </div>
  );
}
