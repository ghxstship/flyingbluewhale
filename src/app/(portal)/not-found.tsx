import { Button } from "@/components/ui/Button";

export default function PortalNotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Not Found</div>
      <h1 className="mt-3 text-2xl font-semibold">Project Unavailable</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        The project portal you&apos;re looking for doesn&apos;t exist, isn&apos;t published, or the link has expired.
      </p>
      <Button href="/" variant="secondary" className="mt-6">
        Home
      </Button>
    </div>
  );
}
