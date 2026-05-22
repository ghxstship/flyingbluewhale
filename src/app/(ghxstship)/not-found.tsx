import { Button } from "@/components/ui/Button";

export default function GhxstshipNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">404</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">Not Found.</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        The page doesn&apos;t exist or has moved. Try one of these.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/ghxstship">
          GHXSTSHIP
        </Button>
        <Button href="/ghxstship/services" variant="secondary">
          Services
        </Button>
        <Button href="/ghxstship/contact" variant="ghost">
          Contact
        </Button>
      </div>
    </main>
  );
}
