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
      <body style={{ background: '#0A0A0A', color: '#F5F5F5', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF5252', margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>
            System Error
          </h1>
          <p style={{ color: '#A0A0A0', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {process.env.NODE_ENV === 'development'
              ? (error.message || 'An unexpected error occurred.')
              : 'An unexpected error occurred. Please try again or contact support.'}
          </p>
          {process.env.NODE_ENV === 'development' && error.digest && (
            <p style={{ color: '#444', fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
              Digest: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: '#00E5FF',
              color: '#0A0A0A',
              border: 'none',
              padding: '0.625rem 1.5rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '0.8125rem',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
