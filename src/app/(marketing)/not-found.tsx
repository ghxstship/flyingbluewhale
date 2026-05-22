import { Button } from "@/components/ui/Button";

export default function MarketingNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="eyebrow eyebrow-brand">404</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">Not Found.</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        The page doesn&apos;t exist or has moved. Try one of these.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">Home</Button>
        <Button href="/features" variant="secondary">
          Features
        </Button>
        <Button href="/pricing" variant="secondary">
          Pricing
        </Button>
        <Button href="/contact" variant="ghost">
          Contact
        </Button>
      </div>
    </main>
  );
}
