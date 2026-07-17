import Link from "next/link";

/**
 * Kit 30 · capability lock screen for the /m/roster surfaces.
 *
 * The member band lands here instead of a blank 403: kit screen chrome
 * (scr-eye + scr-h) plus a .ps-alert that NAMES the missing capability, per
 * the clickthrough's permission-denied state. Presentational only — callers
 * pass already-translated strings (kit primitives carry no i18n).
 */
export function RosterLock({
  eyebrow,
  title,
  body,
  capability,
  backHref,
  backLabel,
}: {
  eyebrow: string;
  title: string;
  body: string;
  capability: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>
      <div className="ps-alert ps-alert--warn" role="alert" style={{ marginBottom: 12 }}>
        {body} <code>{capability}</code>
      </div>
      <Link href={backHref} className="ps-btn ps-btn--secondary" style={{ justifyContent: "center" }}>
        {backLabel}
      </Link>
    </div>
  );
}
