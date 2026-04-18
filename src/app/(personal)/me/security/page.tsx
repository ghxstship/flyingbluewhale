import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PasskeyManager } from "./PasskeyManager";

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">
        Account
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Security</h1>

      <div className="surface mt-8 divide-y divide-[var(--border-color)]">
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="text-sm font-semibold">Password</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Last changed when you signed up
            </div>
          </div>
          <Button href="/forgot-password" variant="secondary">
            Reset
          </Button>
        </div>
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="text-sm font-semibold">Two-factor auth</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">TOTP authenticator app</div>
          </div>
          <Badge variant="warning">Disabled</Badge>
        </div>
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="text-sm font-semibold">Active sessions</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Sign out of all other devices
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-danger btn-sm">
              Sign out everywhere
            </button>
          </form>
        </div>
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="text-sm font-semibold">API tokens</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Personal access tokens for the API
            </div>
          </div>
          <Button variant="secondary" disabled>
            Generate token
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Passkeys
        </h2>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Passkeys are a phishing-resistant alternative to passwords. Add one for each device you sign in from.
        </p>
        <div className="mt-4">
          <PasskeyManager />
        </div>
      </div>
    </div>
  );
}
