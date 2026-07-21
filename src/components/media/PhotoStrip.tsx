/**
 * A compact row of captured photos, for list surfaces.
 *
 * Props are structural rather than importing `SignedPhoto` from
 * `lib/mobile/photo-sign` — that module is `server-only`, and this component
 * has to render inside client surfaces (MarketView) as well as server ones
 * (handover). The shape is the same; the dependency isn't.
 *
 * Tapping opens the signed URL full-size. Nothing here is clickable when the
 * URL is null, because a tile that looks tappable and does nothing is its own
 * small lie.
 */

export type StripPhoto = {
  path: string;
  url: string | null;
  lat: number | null;
};

export function PhotoStrip({
  photos,
  size = 56,
  label = "Photo",
}: {
  photos: StripPhoto[];
  size?: number;
  label?: string;
}) {
  if (photos.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {photos.map((p) => {
        const tile = (
          <span
            style={{
              position: "relative",
              display: "block",
              width: size,
              height: size,
              borderRadius: 8,
              overflow: "hidden",
              background: "var(--p-surface-2)",
              border: "1px solid var(--p-border)",
            }}
          >
            {p.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.url}
                alt={label}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <span
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "var(--p-text-3)",
                  textAlign: "center",
                  padding: 2,
                }}
              >
                Unavailable
              </span>
            )}
            {/* A geotagged photo says so on its face — the operator shouldn't
                have to open a record to learn which shots carry a location. */}
            {p.lat != null && (
              <span
                aria-label="Has location"
                title="Has location"
                style={{
                  position: "absolute",
                  right: 2,
                  bottom: 2,
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--p-success)",
                  boxShadow: "0 0 0 1.5px var(--p-surface)",
                }}
              />
            )}
          </span>
        );
        return p.url ? (
          <a key={p.path} href={p.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
            {tile}
          </a>
        ) : (
          <span key={p.path}>{tile}</span>
        );
      })}
    </div>
  );
}
