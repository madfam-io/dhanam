'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, useRef } from 'react';

const defaultMsg = {
  body: 'Something went wrong. Please try refreshing the page.',
  button: 'Try Again',
};

const messages: Record<string, { body: string; button: string }> = {
  en: defaultMsg,
  es: { body: 'Algo salió mal. Por favor intenta recargar la página.', button: 'Reintentar' },
  pt: {
    body: 'Algo deu errado. Por favor, tente atualizar a página.',
    button: 'Tentar novamente',
  },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lang =
    typeof navigator !== 'undefined' ? (navigator.language?.split('-')[0] ?? 'en') : 'en';
  const m = messages[lang] ?? defaultMsg;

  useEffect(() => {
    Sentry.captureException(error);
    buttonRef.current?.focus();
  }, [error]);

  return (
    <html lang={lang}>
      <body>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, sans-serif',
            background: 'var(--background, #fafafa)',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Dhanam</h1>
            <p style={{ color: 'var(--muted-foreground, #666)', marginBottom: 24 }}>{m.body}</p>
            <button
              ref={buttonRef}
              onClick={reset}
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                border: '1px solid var(--border, #ddd)',
                background: 'var(--card, #fff)',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {m.button}
            </button>
            {error.digest && (
              <p style={{ color: 'var(--muted-foreground, #999)', fontSize: 12, marginTop: 16 }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
