import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">404</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Not Found</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        The page you&apos;re looking for doesn&apos;t exist, or the link has expired.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button href="/">
          Home
        </Button>
        <Button href="/contact" variant="secondary">
          Contact Us
        </Button>
      </div>
    </div>
  );
}
