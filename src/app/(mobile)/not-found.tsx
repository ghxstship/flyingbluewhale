import { Button } from "@/components/ui/Button";

export default function MobileNotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Surface not found</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">This mobile screen isn&apos;t in the manifest.</p>
      <Button href="/m" className="mt-6">
        Home
      </Button>
    </main>
  );
}
