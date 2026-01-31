'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, sans-serif',
            background: '#fafafa',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Dhanam</h1>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Something went wrong. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Try Again
            </button>
            {error.digest && (
              <p style={{ color: '#999', fontSize: 12, marginTop: 16 }}>Error ID: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
