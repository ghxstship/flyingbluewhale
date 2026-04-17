import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">404</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        The page you&apos;re looking for doesn&apos;t exist, or the link has expired.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="btn btn-primary">Home</Link>
        <Link href="/contact" className="btn btn-secondary">Contact us</Link>
      </div>
    </div>
  );
}
