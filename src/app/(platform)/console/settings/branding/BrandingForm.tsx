"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateBrandingAction, type BrandingState } from "./actions";

type Initial = {
  productName: string;
  logoUrl: string;
  accentColor: string;
  accentForeground: string;
  faviconUrl: string;
  heroImageUrl: string;
  ogImageUrl: string;
};

export function BrandingForm({ initial }: { initial: Initial }) {
  const [state, formAction, pending] = useActionState<BrandingState, FormData>(
    async (prev, fd) => {
      const result = await updateBrandingAction(prev, fd);
      if (result?.ok) toast.success("Branding saved");
      else if (result?.error) toast.error(result.error);
      return result;
    },
    null,
  );

  const [accent, setAccent] = useState(initial.accentColor || "#DC2626");
  const [foreground, setForeground] = useState(initial.accentForeground || "#ffffff");
  const [productName, setProductName] = useState(initial.productName);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);

  return (
    <form action={formAction} className="space-y-5">
      <section className="surface p-5">
        <h3 className="text-sm font-semibold">Identity</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Override the product name + logo that your crew, clients, and vendors see.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="Product name override"
            name="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            maxLength={48}
            placeholder="flyingbluewhale"
          />
          <Input
            label="Logo URL (HTTPS)"
            name="logoUrl"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://cdn.example.com/logo.svg"
          />
        </div>
      </section>

      <section className="surface p-5">
        <h3 className="text-sm font-semibold">Color</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Overrides <code className="font-mono">--org-primary</code> across every branded surface + PDF.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Accent color</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-[var(--border-color)]"
                aria-label="Pick accent color"
              />
              <input
                type="text"
                name="accentColor"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                pattern="#[0-9a-fA-F]{6}"
                className="input-base w-full font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Text on accent</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-[var(--border-color)]"
                aria-label="Pick foreground color"
              />
              <input
                type="text"
                name="accentForeground"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                pattern="#[0-9a-fA-F]{6}"
                className="input-base w-full font-mono"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="surface p-5">
        <h3 className="text-sm font-semibold">Assets</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Hero image + favicon + Open Graph fallback. Used on marketing + shared links.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="Favicon URL" name="faviconUrl" type="url" defaultValue={initial.faviconUrl} placeholder="https://.../favicon.ico" />
          <Input label="Hero image URL" name="heroImageUrl" type="url" defaultValue={initial.heroImageUrl} placeholder="https://.../hero.jpg" />
          <Input label="Open Graph image URL" name="ogImageUrl" type="url" defaultValue={initial.ogImageUrl} placeholder="https://.../og.png" />
        </div>
      </section>

      <section className="surface p-5" style={{ ["--org-primary" as string]: accent, ["--org-on-primary" as string]: foreground }}>
        <h3 className="text-sm font-semibold">Preview</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Live preview reflects your pending changes; save to apply everywhere.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary btn-sm" disabled>
            {productName || "Primary action"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled>
            Ghost
          </button>
          <span className="text-xs" style={{ color: accent }}>
            Sample brand text · {productName || "flyingbluewhale"}
          </span>
        </div>
      </section>

      {state?.error ? (
        <div className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-2 text-xs text-[var(--color-error)]">
          {state.error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save branding"}
        </Button>
      </div>
    </form>
  );
}
