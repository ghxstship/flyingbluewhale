"use client";

import { useState } from "react";
import { toast } from "sonner";

type Provider = { id: "google" | "github" | "azure"; label: string; icon: () => React.ReactNode };

const PROVIDERS: Provider[] = [
  {
    id: "google",
    label: "Google",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.4h5.9c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8.3z"/>
        <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.4v2.9C4.2 20.7 7.9 23 12 23z"/>
        <path fill="#FBBC05" d="M6 14.3c-.2-.7-.3-1.4-.3-2.1 0-.7.1-1.4.3-2.1V7.2H2.4C1.6 8.7 1 10.3 1 12.2c0 1.9.4 3.5 1.4 5l3.6-2.9z"/>
        <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2 14.9 1 12 1 7.9 1 4.2 3.3 2.4 7.2L6 10.1c1-2.6 3.3-4.7 6-4.7z"/>
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2.2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.7 1.2 3.4.9.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.4 1.2-3.2-.1-.3-.5-1.4.1-3 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4 1 0 2 .1 2.9.4 2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.7.1 3 .8.8 1.2 1.9 1.2 3.2 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/>
      </svg>
    ),
  },
  {
    id: "azure",
    label: "Microsoft",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#F25022" d="M2 2h10v10H2z"/>
        <path fill="#7FBA00" d="M12 2h10v10H12z"/>
        <path fill="#00A4EF" d="M2 12h10v10H2z"/>
        <path fill="#FFB900" d="M12 12h10v10H12z"/>
      </svg>
    ),
  },
];

export function OAuthButtons({ next }: { next?: string }) {
  const [pending, setPending] = useState<string | null>(null);

  async function go(provider: Provider["id"]) {
    setPending(provider);
    try {
      const url = `/api/v1/auth/oauth?provider=${provider}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
      window.location.assign(url);
    } catch (err) {
      toast.error(`Couldn't start ${provider} sign-in`);
      // Kept as console.error because a client-side OAuth redirect crash
      // precedes our observability pipeline (no session cookie yet, no
      // Sentry hook attached). The toast carries user-facing context.
      if (process.env.NODE_ENV !== "production") console.error(err);
      setPending(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => go(p.id)}
          disabled={pending !== null}
          aria-label={`Continue with ${p.label}`}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-inset)] disabled:opacity-50"
        >
          {p.icon()}
          <span>{pending === p.id ? "…" : p.label}</span>
        </button>
      ))}
    </div>
  );
}

export function AuthDivider({ label = "or continue with email" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
      <div className="h-px flex-1 bg-[var(--border-color)]" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-[var(--border-color)]" />
    </div>
  );
}
