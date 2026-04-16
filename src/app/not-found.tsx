import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-display text-8xl text-cyan mb-4">404</div>
        <h1 className="text-heading text-lg text-text-primary mb-2">Page Not Found</h1>
        <p className="text-sm text-text-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn btn-primary text-xs py-2 px-6">Home</Link>
          <Link href="/console" className="btn btn-secondary text-xs py-2 px-6">Console</Link>
        </div>
      </div>
    </div>
  );
}
