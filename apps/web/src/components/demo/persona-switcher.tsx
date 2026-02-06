'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '~/lib/hooks/use-auth';
import { authApi } from '~/lib/api/auth';
import { useTranslation } from '@dhanam/shared';

import { useDemoNavigation } from '~/lib/contexts/demo-navigation-context';

const PERSONAS = [
  { key: 'guest', emoji: '👋', nameKey: 'personaGuest' },
  { key: 'maria', emoji: '🧑‍💼', nameKey: 'personaMaria' },
  { key: 'carlos', emoji: '🏪', nameKey: 'personaCarlos' },
  { key: 'patricia', emoji: '💎', nameKey: 'personaPatricia' },
  { key: 'diego', emoji: '🎮', nameKey: 'personaDiego' },
] as const;

export function PersonaSwitcher({ currentPersona }: { currentPersona?: string }) {
  const { setAuth } = useAuth();
  const { t } = useTranslation('common');
  const { demoHref } = useDemoNavigation();
  const [switching, setSwitching] = useState(false);

  const current = PERSONAS.find((p) => p.key === currentPersona) || PERSONAS[0];

  const handleSwitch = async (personaKey: string) => {
    if (personaKey === currentPersona) return;
    setSwitching(true);
    try {
      const result = await authApi.switchPersona(personaKey);
      setAuth(result.user, result.tokens);
      // Full page reload to reset all state with the new persona's data
      window.location.href = demoHref('/dashboard');
    } catch (error) {
      console.error('Failed to switch persona:', error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={switching}>
          {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{current.emoji}</span>}
          <span className="hidden sm:inline">{t(current.nameKey)}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('demoSwitchPersona')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PERSONAS.map((persona) => (
          <DropdownMenuItem
            key={persona.key}
            onClick={() => handleSwitch(persona.key)}
            className={persona.key === currentPersona ? 'bg-accent' : ''}
          >
            <span className="mr-2">{persona.emoji}</span>
            <span>{t(persona.nameKey)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
