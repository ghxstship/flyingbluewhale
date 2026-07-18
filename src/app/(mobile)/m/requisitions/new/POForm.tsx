"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormScreen, FORMS, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { submitPoRequest, type State } from "../actions";

/**
 * COMPVSS · PO Request — client leaf (kit FORMS.po, resolution #20).
 *
 * Product-link auto-import, honestly: when a URL lands in the link field we
 * derive what the URL itself carries — a title from the path slug and a
 * vendor from the hostname — into still-empty fields. No scraping, no
 * pretend price lookups; everything stays editable.
 */

const TRACKING_SEGMENTS = /^(p|dp|product|products|item|items|itm|listing|shop|store|us|en|b|gp)$/i;

/** "/heavy-duty-gel-frame-6in/dp/B0..." → "Heavy Duty Gel Frame 6in". */
export function titleFromUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const segments = url.pathname
    .split("/")
    .map((s) => decodeURIComponent(s).trim())
    .filter((s) => s && !TRACKING_SEGMENTS.test(s));
  // The longest slug-looking segment is almost always the product name.
  const best = segments
    .filter((s) => /[a-zA-Z]/.test(s) && !/^[A-Z0-9]{8,}$/.test(s))
    .sort((a, b) => b.length - a.length)[0];
  if (!best) return null;
  const words = best
    .replace(/\.(html?|php|aspx?)$/i, "")
    .split(/[-_+.\s]+/)
    .filter(Boolean);
  if (words.length === 0) return null;
  return words
    .map((w) => (/^[a-z]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
    .slice(0, 120);
}

/** "https://www.harborsupply.co.uk/…" → "Harborsupply". */
export function vendorFromUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./i, "");
  const label = host.split(".")[0];
  if (!label || !/[a-zA-Z]/.test(label)) return null;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function POForm({ costCodeOptions }: { costCodeOptions: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const base = FORMS.po!;
  const def: FormDef = {
    ...base,
    fields: base.fields.map((f) => (f.id === "code" ? { ...f, options: costCodeOptions } : f)),
  };

  function onFieldChange(
    id: string,
    value: unknown,
    vals: Record<string, unknown>,
    patch: (updates: Record<string, unknown>) => void,
  ) {
    if (id !== "link" || typeof value !== "string" || !/^https?:\/\//i.test(value.trim())) return;
    const updates: Record<string, unknown> = {};
    if (!vals.item) {
      const title = titleFromUrl(value.trim());
      if (title) updates.item = title;
    }
    if (!vals.vendor) {
      const vendor = vendorFromUrl(value.trim());
      if (vendor) updates.vendor = vendor;
    }
    if (Object.keys(updates).length > 0) patch(updates);
  }

  function onSubmit(_def: FormDef, vals: Record<string, unknown>) {
    if (pending) return;
    const fd = toFormData(vals);
    startTransition(async () => {
      const res: State = await submitPoRequest(null, fd);
      // A successful submit redirects server-side; a warning means the row
      // landed without its quote.
      if (res?.error) {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      if (res?.warning) {
        router.push(`/m/requisitions?warn=${encodeURIComponent(res.warning)}`);
      }
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          <div>{error}</div>
          {Object.keys(fieldErrors).length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {Object.entries(fieldErrors).map(([k, m]) => (
                <li key={k} style={{ fontSize: 12 }}>
                  {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <FormScreen def={def} onClose={() => history.back()} onSubmit={onSubmit} onFieldChange={onFieldChange} />
    </div>
  );
}
