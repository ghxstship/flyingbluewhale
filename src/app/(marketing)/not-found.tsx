import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function MarketingNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">404 · Off the chart</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">This page isn&apos;t in the manifest.</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        The link may be old or the page has set sail. Head back to the homepage or try one of these.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">Home</Button>
        <Button href="/features" variant="secondary">
          Features
        </Button>
        <Button href="/pricing" variant="secondary">
          Pricing
        </Button>
        <Link href="/contact" className="btn btn-ghost">
          Contact
        </Link>
      </div>
    </main>
  );
}
