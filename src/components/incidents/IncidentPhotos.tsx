import { createClient } from "@/lib/supabase/server";
import { signPhotoRefs, type SignedPhoto } from "@/lib/mobile/photo-sign";
import type { PhotoRef } from "@/lib/mobile/photo-geo";

/**
 * Incident evidence panel — the reviewer half of field photo capture.
 *
 * Photos were being uploaded and stored and then rendered nowhere: the
 * incident detail page dumps every column generically, so `photos` came out
 * as a monospace JSON blob. A crew member's evidence reached the database and
 * stopped there. Capturing evidence nobody can look at is the same failure as
 * not capturing it, one step later.
 *
 * `incident-photos` is private, so paths are signed through `signPhotoRefs`
 * — the one signing path, shared with the handover and marketplace surfaces.
 */

/** Metres above which a fix locates a neighbourhood, not a place. Past this
 *  we still show the coordinates but stop implying they pinpoint anything. */
const VAGUE_FIX_M = 100;

const BUCKET = "incident-photos";

function mapsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function formatFix(p: PhotoRef): { text: string; precise: boolean } | null {
  if (p.lat == null || p.lng == null) return null;
  const coords = `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
  if (p.accuracyM == null) return { text: coords, precise: true };
  const precise = p.accuracyM <= VAGUE_FIX_M;
  return { text: `${coords} · ±${Math.round(p.accuracyM)}m`, precise };
}

export async function IncidentPhotos({ photos }: { photos: unknown }) {
  const supabase = await createClient();
  const signed: SignedPhoto[] = await signPhotoRefs(supabase, BUCKET, photos);
  if (signed.length === 0) return null;

  return (
    <section className="surface p-5">
      <h2 className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">Evidence</h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {signed.map((p) => {
          const fix = formatFix(p);
          return (
            <li key={p.path} className="overflow-hidden rounded-md border border-[var(--p-border)]">
              {p.url ? (
                <a href={p.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.caption ?? "Incident photo"}
                    className="aspect-video w-full bg-[var(--p-surface-2)] object-cover"
                  />
                </a>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-[var(--p-surface-2)] text-xs text-[var(--p-text-3)]">
                  Preview unavailable
                </div>
              )}
              <div className="space-y-1 p-2 text-xs">
                {p.caption && <div className="text-[var(--p-text-1)]">{p.caption}</div>}
                {fix ? (
                  <a
                    href={mapsHref(p.lat!, p.lng!)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[var(--p-accent-text)] underline"
                  >
                    {fix.text}
                  </a>
                ) : (
                  <span className="text-[var(--p-text-3)]">No location captured</span>
                )}
                {/* An imprecise fix rendered as bare coordinates reads as
                    certainty it doesn't have. Say so rather than let a
                    reviewer treat a cell-tower estimate as a pin. */}
                {fix && !fix.precise && (
                  <div className="text-[var(--p-warning)]">Approximate — device reported low accuracy</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
