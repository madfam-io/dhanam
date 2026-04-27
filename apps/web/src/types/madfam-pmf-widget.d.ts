/**
 * TEMPORARY type stub for `@madfam/pmf-widget`.
 *
 * Why this exists:
 *   `@madfam/pmf-widget@0.1.0` is built but not yet published, and the
 *   dep is intentionally absent from `apps/web/package.json` until
 *   NPM_MADFAM_TOKEN is rotated and the package is published — see
 *   PmfWidgetMount.tsx for the rationale. Without the package
 *   installed, `tsc --noEmit` cannot resolve the module specifier in
 *   PmfWidgetMount.tsx's dynamic import, breaking typecheck in CI.
 *
 *   This stub gives the TypeScript compiler a minimal module shape so
 *   it can satisfy the `import()` call signature. The runtime gate in
 *   PmfWidgetMount.tsx (NEXT_PUBLIC_PMF_WIDGET_ENABLED) prevents the
 *   import from ever firing in production until the operator opts in.
 *
 * DELETE THIS FILE after `pnpm add @madfam/pmf-widget@^0.1.0
 * -F @dhanam/web` succeeds (post-publish) — the published package
 * ships its own .d.ts that supersedes this stub.
 *
 * See: components/pmf/PmfWidgetMount.tsx and RFC 0013.
 */
declare module '@madfam/pmf-widget' {
  import type { ComponentType } from 'react';

  export interface PMFWidgetProps {
    product: string;
    user: {
      id: string;
      email?: string;
      name?: string;
      plan?: string;
      createdAt?: string;
      locale?: string;
    };
    apiUrl: string;
    triggers: Record<string, unknown>;
    lang?: 'en' | 'es';
    productLabel?: string;
    context?: Record<string, string | number | boolean | null>;
    theme?: 'light' | 'dark' | 'auto';
    disabled?: boolean;
    onSubmit?: (event: unknown) => void;
    onDismiss?: (mode: string) => void;
  }

  export const PMFWidget: ComponentType<PMFWidgetProps>;
  export function recordAction(type: string): void;
  export function getSessionCount(): number;
  export function getActionCount(type: string): number;
}
