import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AuthNotFound() {
  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Auth Path Not Found.</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        That sign-in link is no longer valid or never existed. Pick a route below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/login">Sign In</Button>
        <Button href="/signup" variant="secondary">
          Create Account
        </Button>
        <Link href="/forgot-password" className="btn btn-ghost">
          Reset Password
        </Link>
      </div>
    </main>
  );
}
