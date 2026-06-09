"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitOpenCallAction, type State } from "./actions";

type Props = {
  openCallId: string;
  orgId: string;
  slug: string;
};

export function OpenCallSubmitForm({ openCallId, orgId, slug }: Props) {
  const [mediaRows, setMediaRows] = React.useState<{ url: string; label: string }[]>([]);
  const [state, formAction, pending] = useActionState<State, FormData>(submitOpenCallAction, null);

  const addMedia = () => setMediaRows((p) => [...p, { url: "", label: "" }]);
  const removeMedia = (i: number) => setMediaRows((p) => p.filter((_, idx) => idx !== i));
  const setMedia = (i: number, field: "url" | "label", val: string) =>
    setMediaRows((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  if (state?.ok) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4 text-4xl">✓</div>
        <h2 className="hed-xl mb-3">Submission received</h2>
        <p className="mb-6 text-sm text-[var(--p-text-2)]">
          The casting team will review your submission and follow up at the email you provided.
        </p>
        <Button href={`/marketplace/calls/${slug}`} variant="ghost" size="sm">
          ← Back to call
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="open_call_id" value={openCallId} />
      <input type="hidden" name="org_id" value={orgId} />
      <input
        type="hidden"
        name="media_links_json"
        value={JSON.stringify(mediaRows.filter((r) => r.url.trim()))}
      />

      {state?.error && (
        <div className="rounded border border-[var(--color-error)] bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
          {state.error}
        </div>
      )}

      {/* Contact */}
      <section className="surface p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Your Details</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Full name" name="guest_name" required maxLength={200} autoComplete="name" />
          <Input label="Email" name="guest_email" type="email" required autoComplete="email" />
        </div>
        <p className="text-xs text-[var(--p-text-2)]">
          Already have an account?{" "}
          <a
            href={`/login?redirect=/marketplace/calls/${slug}/submit`}
            className="text-[var(--p-accent)] underline"
          >
            Sign in
          </a>{" "}
          to link your profile.
        </p>
      </section>

      {/* Cover note */}
      <section className="surface p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Cover Note</h2>
        <textarea
          name="cover_note"
          rows={5}
          maxLength={4000}
          placeholder="Tell the team why you're the right fit…"
          className="ps-input w-full"
        />
      </section>

      {/* Fee */}
      <section className="surface p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Fee Proposal</h2>
        <Input
          label="Proposed fee (USD)"
          name="fee_proposed"
          type="number"
          min={0}
          hint="Optional — leave blank to discuss"
        />
      </section>

      {/* Media links */}
      <section className="surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Media &amp; Links</h2>
          <button
            type="button"
            onClick={addMedia}
            className="text-xs text-[var(--p-accent)] hover:underline"
          >
            + Add link
          </button>
        </div>
        {mediaRows.length === 0 && (
          <p className="text-xs text-[var(--p-text-2)]">
            Add links to your reel, EPK, demo tracks, portfolio, or social profiles.
          </p>
        )}
        {mediaRows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_24px] gap-2 items-end">
            <Input
              label={i === 0 ? "URL" : undefined}
              value={row.url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMedia(i, "url", e.target.value)}
              placeholder="https://…"
              type="url"
            />
            <Input
              label={i === 0 ? "Label" : undefined}
              value={row.label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMedia(i, "label", e.target.value)}
              placeholder="e.g. Reel"
              maxLength={80}
            />
            <button
              type="button"
              onClick={() => removeMedia(i)}
              className="mb-1 text-xs text-[var(--p-text-2)] hover:text-[var(--color-error)]"
              aria-label="Remove link"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit Application"}
        </Button>
        <Button href={`/marketplace/calls/${slug}`} variant="ghost" disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
