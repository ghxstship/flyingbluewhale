import { Button } from "@/components/ui/Button";

/**
 * 404 boundary for the LEG3ND shell — renders inside the LEG3ND `<main>` so the
 * Knowledge/LMS chrome (sidebar + wordmark) is preserved instead of bubbling to
 * the root not-found.
 */
export default function LegendNotFound() {
  return (
    <div className="surface p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--p-text-3)]">404</p>
      <h1 className="mt-1 text-2xl font-semibold text-[var(--p-text-1)]">Not Found</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        That page or resource doesn&apos;t exist, or you don&apos;t have access.
      </p>
      <div className="mt-4">
        <Button href="/legend">Back to LEG3ND</Button>
      </div>
    </div>
  );
}
