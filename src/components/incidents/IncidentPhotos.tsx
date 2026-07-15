import { createServiceClient } from "@/lib/supabase/server";
import { normalisePhotoRefs, type PhotoRef } from "@/lib/mobile/photo-geo";

/**
 * Incident evidence panel — the reviewer half of field photo capture.
 *
 * Photos were being uploaded and stored and then rendered nowhere: the
 * incident detail page dumps every column generically, so `photos` came out
 * as a monospace JSON blob. A crew member's evidence reached the database and
 * stopped there. Capturing evidence nobody can look at is the same failure as
 * not capturing it, one step later.
 *
 * `incident-photos` is a private bucket, so each path is signed for a short
 * read window. Signing is best-effort per photo: one unreachable object must
 * not blank the whole panel on a safety record.
 */

/** How long a reviewer's image URLs stay valid. Long enough to read a
 *  report, short enough that a copied URL isn't a durable leak. */
const SIGN_TTL_SECONDS = 600;

type SignedPhoto = PhotoRef & { signedUrl: string | null };

/** Metres above which a fix locates a neighbourhood, not a place. Past this
 *  we still show the coordinates but stop implying they pinpoint anything. */
const VAGUE_FIX_M = 100;

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
  const refs = normalisePhotoRefs(photos);
  if (refs.length === 0) return null;

  let signed: SignedPhoto[] = refs.map((p) => ({ ...p, signedUrl: null }));
  try {
    const service = createServiceClient();
    signed = await Promise.all(
      refs.map(async (p) => {
        const { data } = await service.storage.from("incident-photos").createSignedUrl(p.path, SIGN_TTL_SECONDS);
        return { ...p, signedUrl: data?.signedUrl ?? null };
      }),
    );
  } catch {
    // Storage or service config unavailable — render the geotags and the
    // filenames rather than nothing. A reviewer can still see that four
    // photos exist and where they were taken.
  }

  return (
    <section className="surface p-5">
      <h2 className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">Evidence</h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {signed.map((p) => {
          const fix = formatFix(p);
          return (
            <li key={p.path} className="overflow-hidden rounded-md border border-[var(--p-border)]">
              {p.signedUrl ? (
                <a href={p.signedUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.signedUrl}
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
