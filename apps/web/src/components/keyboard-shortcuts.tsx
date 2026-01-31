'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@dhanam/ui';

const shortcuts = [
  { keys: ['⌘', 'K'], label: 'Open search / command palette' },
  { keys: ['G', 'D'], label: 'Go to Dashboard' },
  { keys: ['G', 'T'], label: 'Go to Transactions' },
  { keys: ['G', 'B'], label: 'Go to Budgets' },
  { keys: ['G', 'A'], label: 'Go to Analytics' },
  { keys: ['G', 'S'], label: 'Go to Settings' },
  { keys: ['?'], label: 'Show this help' },
];

const NAV_MAP: Record<string, string> = {
  d: '/dashboard',
  t: '/transactions',
  b: '/budgets',
  a: '/analytics',
  s: '/settings',
  g: '/goals',
  e: '/esg',
};

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pendingG = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // ? → show help
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // G then letter navigation
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !pendingG.current) {
        pendingG.current = true;
        gTimer.current = setTimeout(() => {
          pendingG.current = false;
        }, 500);
        return;
      }

      if (pendingG.current) {
        pendingG.current = false;
        clearTimeout(gTimer.current);
        const dest = NAV_MAP[e.key];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Press <kbd className="rounded border px-1 text-[10px]">?</kbd> to toggle this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}
