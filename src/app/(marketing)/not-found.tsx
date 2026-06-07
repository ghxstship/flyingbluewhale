import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function MarketingNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      {/* Waypoint brand anchor — gives the error page brand integrity
          per v4 logo-kit. The mark is the bare ink star (will render
          on whatever theme the shell paints under). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/atlvs-mark.svg" alt="" width={32} height={32} aria-hidden="true" className="mx-auto mb-6" />
      <p className="eyebrow eyebrow-brand">404</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">Not Found.</h1>
      <p className="mt-3 text-sm text-[var(--p-text-2)]">The page doesn&apos;t exist or has moved. Try one of these.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">Home</Button>
        <Button href="/features" variant="secondary">
          Features
        </Button>
        <Button href="/pricing" variant="secondary">
          Pricing
        </Button>
        <Link href="/contact" className="ps-btn ps-btn--ghost">
          Contact
        </Link>
      </div>
    </main>
  );
}
