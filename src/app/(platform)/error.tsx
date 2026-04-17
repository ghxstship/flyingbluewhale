'use client';

import { useEffect } from 'react';

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="card-elevated p-8 max-w-md w-full border-error/50">
        <div className="w-2 h-2 rounded-full bg-error mx-auto mb-6" />
        <h2 className="text-display text-xl text-primary mb-2">Module Error</h2>
        <p className="text-sm text-secondary mb-6">
          {error.message || 'The platform module encountered a rendering error.'}
        </p>
        <button onClick={() => reset()} className="btn btn-primary w-full">
          Try Again
        </button>
      </div>
    </div>
  );
}
