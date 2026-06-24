// Pitch-deck slide primitives — token-styled 16:9 frames.
//
// Every slide is a 16:9 Slide frame sized off the --p-ar-video aspect token.
// Headings ride Anton via the .ps-h primitive (--p-heading / --p-display-case);
// all paint routes through --p-* tokens (no raw hex, no Tailwind palette).
// Voice is world-builder (docs/brand/voice.md): the invitations carry wonder,
// the chrome stays calm.
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Slide — the shared 16:9 stage. Fills its container width and locks the
 * aspect ratio to --p-ar-video (16/9). Children lay out inside the padded
 * frame. `accent` flips the data-product so a slide can carry a product hue.
 */
export function Slide({
  children,
  className = "",
  tone = "surface",
  align = "start",
}: {
  children: ReactNode;
  className?: string;
  /** surface = page bg · raised = card bg · accent = full accent flood */
  tone?: "surface" | "raised" | "accent";
  /** vertical content alignment */
  align?: "start" | "center";
}) {
  const bg =
    tone === "accent"
      ? "bg-[var(--p-accent)] text-[var(--p-accent-contrast)]"
      : tone === "raised"
        ? "bg-[var(--p-surface-2)] text-[var(--p-text-1)]"
        : "bg-[var(--p-surface)] text-[var(--p-text-1)]";
  const justify = align === "center" ? "justify-center" : "justify-start";
  return (
    <div
      className={`relative flex aspect-[var(--p-ar-video)] w-full flex-col ${justify} overflow-hidden rounded-xl border border-[var(--p-border)] p-[5%] shadow-[var(--p-elev-2)] ${bg} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/** Eyebrow — Space Mono overline, accent-text colored. */
function Eyebrow({ children, onAccent }: { children: ReactNode; onAccent?: boolean }) {
  return (
    <p
      className={`text-[clamp(0.6rem,1.1vw,0.85rem)] font-semibold tracking-[0.18em] uppercase ${
        onAccent ? "text-[var(--p-accent-contrast)] opacity-80" : "text-[var(--p-accent-text)]"
      }`}
    >
      {children}
    </p>
  );
}

/**
 * TitleSlide — cover. Eyebrow, big Anton title, subtitle, optional wordmark
 * footer. The opener: where the wonder lives.
 */
export function TitleSlide({
  eyebrow,
  title,
  subtitle,
  wordmark = "ATLVS",
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  wordmark?: string;
  footer?: string;
}) {
  return (
    <Slide align="center">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[6px] bg-[var(--p-accent)]" />
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="ps-h mt-[2%] text-[clamp(2rem,6.5vw,5rem)] leading-[0.95] text-[var(--p-text-1)]">{title}</h2>
      {subtitle && (
        <p className="mt-[3%] max-w-[80%] text-[clamp(0.9rem,2vw,1.5rem)] leading-relaxed text-[var(--p-text-2)]">
          {subtitle}
        </p>
      )}
      <div className="mt-auto flex items-end justify-between pt-[4%]">
        <Wordmark word={wordmark} style={{ color: "var(--p-accent-text)", fontSize: "clamp(14px, 2vw, 22px)" }} />
        {footer && (
          <span className="text-[clamp(0.6rem,1.1vw,0.85rem)] tracking-[0.12em] text-[var(--p-text-3)] uppercase">
            {footer}
          </span>
        )}
      </div>
    </Slide>
  );
}

/** StatSlide — one big metric + caption. A number beats an adjective. */
export function StatSlide({
  stat,
  caption,
  eyebrow,
  source,
}: {
  stat: string;
  caption: string;
  eyebrow?: string;
  source?: string;
}) {
  return (
    <Slide align="center">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <div className="ps-h text-[clamp(4rem,16vw,12rem)] leading-[0.9] text-[var(--p-accent)]">{stat}</div>
      <p className="mt-[2%] max-w-[70%] text-[clamp(1rem,2.4vw,1.9rem)] leading-snug text-[var(--p-text-1)]">
        {caption}
      </p>
      {source && (
        <p className="mt-auto pt-[4%] text-[clamp(0.6rem,1vw,0.8rem)] text-[var(--p-text-3)]">{source}</p>
      )}
    </Slide>
  );
}

/** QuoteSlide — pull-quote + attribution. */
export function QuoteSlide({
  quote,
  attribution,
  byline,
}: {
  quote: string;
  attribution: string;
  byline?: string;
}) {
  return (
    <Slide tone="raised" align="center">
      <span aria-hidden className="ps-h text-[clamp(3rem,9vw,7rem)] leading-none text-[var(--p-accent)] opacity-30">
        &ldquo;
      </span>
      <blockquote className="-mt-[2%] max-w-[88%] text-[clamp(1.1rem,3vw,2.4rem)] leading-snug font-semibold text-[var(--p-text-1)]">
        {quote}
      </blockquote>
      <figcaption className="mt-[4%] text-[clamp(0.75rem,1.4vw,1.05rem)] text-[var(--p-text-2)]">
        <span className="font-semibold text-[var(--p-text-1)]">{attribution}</span>
        {byline && <span className="text-[var(--p-text-3)]"> · {byline}</span>}
      </figcaption>
    </Slide>
  );
}

/** AgendaSlide — numbered list. */
export function AgendaSlide({
  eyebrow,
  title,
  items,
}: {
  eyebrow?: string;
  title: string;
  items: string[];
}) {
  return (
    <Slide>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="ps-h mt-[1%] text-[clamp(1.6rem,4.5vw,3.5rem)] leading-tight text-[var(--p-text-1)]">{title}</h2>
      <ol className="mt-[4%] flex flex-col gap-[2.5%]">
        {items.map((item, i) => (
          <li key={item} className="flex items-baseline gap-[3%]">
            <span className="ps-h w-[1.6em] flex-none text-[clamp(1rem,2.6vw,2rem)] text-[var(--p-accent)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[clamp(0.9rem,2.2vw,1.6rem)] leading-snug text-[var(--p-text-1)]">{item}</span>
          </li>
        ))}
      </ol>
    </Slide>
  );
}

/** SectionSlide — full-accent divider between acts. */
export function SectionSlide({
  index,
  title,
  subtitle,
}: {
  index?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Slide tone="accent" align="center">
      {index && <Eyebrow onAccent>{index}</Eyebrow>}
      <h2 className="ps-h mt-[1%] text-[clamp(2rem,7vw,5.5rem)] leading-[0.95] text-[var(--p-accent-contrast)]">{title}</h2>
      {subtitle && (
        <p className="mt-[3%] max-w-[75%] text-[clamp(0.9rem,2.2vw,1.6rem)] leading-relaxed text-[var(--p-accent-contrast)] opacity-90">
          {subtitle}
        </p>
      )}
    </Slide>
  );
}

/**
 * TwoColSlide — text on the left, a visual node on the right. The visual
 * defaults to a token-driven placeholder panel if none is supplied.
 */
export function TwoColSlide({
  eyebrow,
  title,
  body,
  visual,
  bullets,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  bullets?: string[];
  visual?: ReactNode;
}) {
  return (
    <Slide>
      <div className="grid h-full grid-cols-[1.1fr_0.9fr] items-center gap-[6%]">
        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 className="ps-h mt-[2%] text-[clamp(1.4rem,4vw,3rem)] leading-tight text-[var(--p-text-1)]">{title}</h2>
          {body && (
            <p className="mt-[4%] text-[clamp(0.8rem,1.9vw,1.4rem)] leading-relaxed text-[var(--p-text-2)]">{body}</p>
          )}
          {bullets && (
            <ul className="mt-[4%] flex flex-col gap-[2.5%]">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-baseline gap-[3%] text-[clamp(0.78rem,1.8vw,1.3rem)] leading-snug text-[var(--p-text-1)]"
                >
                  <span aria-hidden className="mt-[0.4em] h-[0.5em] w-[0.5em] flex-none rounded-sm bg-[var(--p-accent)]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex h-full items-center">
          {visual ?? (
            <div className="flex aspect-[var(--p-ar-photo)] w-full items-center justify-center rounded-lg border border-[var(--p-border)] bg-[var(--p-surface-2)]">
              <span className="text-[clamp(0.6rem,1vw,0.8rem)] tracking-[0.14em] text-[var(--p-text-3)] uppercase">
                Visual
              </span>
            </div>
          )}
        </div>
      </div>
    </Slide>
  );
}

/** CloseSlide — the ask. CTA + contact line. */
export function CloseSlide({
  eyebrow,
  title,
  cta,
  contact,
}: {
  eyebrow?: string;
  title: string;
  cta: string;
  contact?: string;
}) {
  return (
    <Slide tone="accent" align="center">
      {eyebrow && <Eyebrow onAccent>{eyebrow}</Eyebrow>}
      <h2 className="ps-h mt-[2%] text-[clamp(2rem,6.5vw,5rem)] leading-[0.95] text-[var(--p-accent-contrast)]">{title}</h2>
      <p className="mt-[5%] inline-flex w-fit rounded-md bg-[var(--p-accent-contrast)] px-[1.4em] py-[0.7em] text-[clamp(0.85rem,1.8vw,1.3rem)] font-semibold text-[var(--p-accent)]">
        {cta}
      </p>
      {contact && (
        <p className="mt-auto pt-[4%] text-[clamp(0.7rem,1.3vw,1rem)] tracking-[0.1em] text-[var(--p-accent-contrast)] uppercase opacity-90">
          {contact}
        </p>
      )}
    </Slide>
  );
}
