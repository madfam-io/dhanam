'use client';

import { Badge } from '@/components/ui/badge';

export type MetaversePlatform =
  | 'all'
  | 'sandbox'
  | 'axie'
  | 'illuvium'
  | 'star-atlas'
  | 'gala'
  | 'enjin'
  | 'immutable';

interface PlatformSelectorProps {
  selected: MetaversePlatform;
  onSelect: (platform: MetaversePlatform) => void;
  platformTotals?: Record<string, number>;
}

const PLATFORMS: Array<{ id: MetaversePlatform; label: string; color: string }> = [
  { id: 'all', label: 'All Platforms', color: 'bg-primary' },
  { id: 'sandbox', label: 'The Sandbox', color: 'bg-yellow-500' },
  { id: 'axie', label: 'Axie Infinity', color: 'bg-blue-500' },
  { id: 'illuvium', label: 'Illuvium', color: 'bg-purple-500' },
  { id: 'star-atlas', label: 'Star Atlas', color: 'bg-indigo-500' },
  { id: 'gala', label: 'Gala Games', color: 'bg-orange-500' },
  { id: 'enjin', label: 'Enjin', color: 'bg-cyan-500' },
  { id: 'immutable', label: 'Immutable', color: 'bg-emerald-500' },
];

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function PlatformSelector({ selected, onSelect, platformTotals }: PlatformSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((p) => {
        const isActive = selected === p.id;
        const total = p.id !== 'all' && platformTotals?.[p.id];

        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {p.id !== 'all' && <span className={`w-2 h-2 rounded-full ${p.color}`} />}
            {p.label}
            {total ? (
              <Badge variant="secondary" className="ml-1 text-xs">
                {formatUsd(total)}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
