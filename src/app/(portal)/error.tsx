'use client';

import { useEffect } from 'react';

export default function PortalError({
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
      <div className="card-elevated p-8 max-w-md w-full">
        <h2 className="text-heading text-xl text-primary mb-2">Something went wrong</h2>
        <p className="text-sm text-secondary mb-6">
          We had trouble loading this portal view.
        </p>
        <button onClick={() => reset()} className="btn btn-primary w-full">
          Refresh View
        </button>
      </div>
    </div>
  );
}
