import { Button } from "@/components/ui/Button";

export default function PersonalNotFound() {
  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Page Not Found.</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        That section of your account doesn&apos;t exist or has moved. Pick a route below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/me">Account</Button>
        <Button href="/me/security" variant="secondary">
          Security
        </Button>
        <Button href="/" variant="ghost">
          Home
        </Button>
      </div>
    </main>
  );
}
