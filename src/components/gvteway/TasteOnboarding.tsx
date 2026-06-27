"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepper, type OnboardingStep } from "@/components/auth/OnboardingStepper";
import { AuthCard, type AuthProvider } from "@/components/auth/AuthCard";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";

/**
 * TasteOnboarding — the GVTEWAY taste/genre onboarding (design_handoff §2/§4).
 * The consumer entry point, composing the CANON onboarding primitives
 * (`OnboardingStepper` + `AuthCard`, see guidelines/atlvs-kit-coherence-audit.md
 * → "Canon: authentication & onboarding") plus a genre picker that seeds
 * Discover. Distinct in copy from the operator/field auth, same primitives — no
 * forked auth UI.
 *
 * The account + taste selections persist to the social graph once
 * 20260623120000_gvteway_consumer.sql is applied; firstRun the flow routes into
 * `/p/discover`. Token-only colors.
 */
const GENRES = [
  "House", "Techno", "Disco", "DnB", "Garage", "Ambient",
  "Hip-Hop", "Afrobeats", "Indie", "Jazz", "Punk", "Experimental",
] as const;

const PROVIDERS: AuthProvider[] = [
  { id: "google", label: "Google" },
  { id: "azure", label: "Microsoft" },
];

const STEPS: OnboardingStep[] = [
  { id: "account", label: "Account", hint: "Create your GVTEWAY account. We'll keep your nights in sync across web and onsite." },
  { id: "taste", label: "Your sounds", hint: "Pick a few sounds you love. We'll tune Discover to them. Change them anytime." },
  { id: "ready", label: "Ready", hint: "You're in. Your first picks are warming up Discover now." },
];

const GvtewayBrand = (
  <p className="eyebrow eyebrow-accent">GVTEWAY · Welcome</p>
);

export function TasteOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(genre: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  }

  function startOAuth(id: string) {
    window.location.assign(`/api/v1/auth/oauth?provider=${id}&next=${encodeURIComponent("/p/welcome")}`);
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12">
      <OnboardingStepper steps={STEPS} current={step} brand={GvtewayBrand} title={STEP_TITLE[step]}>
        {step === 0 && (
          <AuthCard
            providers={PROVIDERS}
            onProvider={startOAuth}
            footer={
              <span>
                Already on GVTEWAY?{" "}
                <a href="/login" className="font-medium text-[var(--p-accent-text)] hover:underline">
                  Sign in
                </a>
              </span>
            }
          >
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(1);
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor="gvteway-email" className="block text-xs font-medium text-[var(--p-text-2)]">
                  Email
                </label>
                <input
                  id="gvteway-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="ps-input focus-ring w-full"
                  placeholder="you@example.com"
                />
              </div>
              <PasswordField label="Password" autoComplete="new-password" showStrength required />
              <Button type="submit" variant="cta" size="lg" className="w-full">
                Continue
              </Button>
            </form>
          </AuthCard>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-[var(--p-text-2)]">
                Your sounds <span className="text-[var(--p-text-3)]">({selected.size} selected)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => {
                  const on = selected.has(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(genre)}
                      className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        on
                          ? "border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-cta-contrast)]"
                          : "border-[var(--p-border-2)] text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)]"
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button type="button" variant="cta" disabled={selected.size === 0} onClick={() => setStep(2)}>
                {selected.size === 0 ? "Pick at least one" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="surface rounded-[var(--p-r-md)] p-4">
              <p className="text-xs font-medium text-[var(--p-text-2)]">Tuned to</p>
              <p className="mt-1 text-sm text-[var(--p-text-1)]">{[...selected].join(" · ")}</p>
            </div>
            <Button type="button" variant="cta" size="lg" className="w-full" onClick={() => router.push("/p/discover")}>
              Start exploring
            </Button>
          </div>
        )}
      </OnboardingStepper>
    </div>
  );
}

const STEP_TITLE = ["Find your nights", "What do you love?", "You're in"];
