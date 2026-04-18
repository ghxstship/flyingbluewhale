import Image from "next/image";

const DEFAULT_LOGOS: Array<{ name: string; src?: string }> = [
  { name: "BLACK COFFEE" },
  { name: "CARLITA" },
  { name: "KAZ JAMES" },
  { name: "HIALEAH PARK" },
  { name: "CORNBREAD HEMP" },
  { name: "ELEKTRA RECORDS" },
  { name: "RESONATE" },
  { name: "GHXSTSHIP" },
];

/**
 * LogoCloud v2 — customer logo strip.
 * - Accepts `logos` prop for per-tenant white-label ({ name, src? })
 * - Image logos auto-grayscale with hover color restoration
 * - Falls back to text-only wordmark when no src provided
 */
export function LogoCloud({
  eyebrow = "Trusted by teams shipping live experiences",
  logos = DEFAULT_LOGOS,
}: {
  eyebrow?: string;
  logos?: Array<{ name: string; src?: string }>;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
        {eyebrow}
      </div>
      <ul className="mt-6 grid grid-cols-2 items-center gap-8 sm:grid-cols-4 md:grid-cols-8 md:gap-4">
        {logos.map((l) => (
          <li key={l.name} className="flex items-center justify-center">
            {l.src ? (
              <Image
                src={l.src}
                alt={l.name}
                width={96}
                height={24}
                className="h-6 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 motion-reduce:transition-none"
              />
            ) : (
              <span className="text-center font-mono text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)]">
                {l.name}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
