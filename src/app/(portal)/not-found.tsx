import Link from "next/link";

export default function PortalNotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Not found</div>
      <h1 className="mt-3 text-2xl font-semibold">Project unavailable</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        The project portal you&apos;re looking for doesn&apos;t exist, isn&apos;t published, or the link has expired.
      </p>
      <Link href="/" className="btn btn-secondary mt-6 inline-block">Home</Link>
    </div>
  );
}
