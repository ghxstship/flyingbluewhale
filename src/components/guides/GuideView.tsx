import type { ReactNode } from "react";
import type { GuideConfig, GuideSection } from "@/lib/guides/types";

export function GuideView({
  title,
  subtitle,
  classification,
  config,
  tier,
  comments,
}: {
  title: string;
  subtitle?: string | null;
  classification?: string | null;
  config: GuideConfig;
  tier?: number;
  /** Optional comments slot rendered after sections (typically <GuideComments />). */
  comments?: ReactNode;
}) {
  const sections = config.sections ?? [];

  return (
    <article className="space-y-10">
      <header className="border-b border-[var(--border-color)] pb-6">
        {classification && (
          <div className="inline-flex rounded-full bg-[var(--color-error)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-error)]">
            {classification}
          </div>
        )}
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
        {typeof tier === "number" && (
          <div className="mt-3 font-mono text-xs text-[var(--text-muted)]">Access tier {tier}</div>
        )}
      </header>

      <nav className="shell-nav sticky top-0 -mx-4 flex gap-1 overflow-x-auto border-b border-[var(--border-color)] bg-[var(--background)]/90 px-4 py-2 backdrop-blur">
        {sections.map((s, i) => (
          <a key={i} href={`#section-${i}`} className="shrink-0 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--foreground)]">
            {(i + 1).toString().padStart(2, "0")} · {s.heading}
          </a>
        ))}
      </nav>

      {sections.map((s, i) => <SectionWrapper key={i} index={i} section={s} />)}

      {comments && <div className="border-t border-[var(--border-color)] pt-6">{comments}</div>}
    </article>
  );
}

function SectionWrapper({ index, section }: { index: number; section: GuideSection }) {
  return (
    <section id={`section-${index}`} className="space-y-4">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-5xl font-light text-[var(--text-muted)] opacity-30">
          {(index + 1).toString().padStart(2, "0")}
        </span>
        <div className="flex-1 border-t border-[var(--org-primary)] pt-2">
          <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
        </div>
      </div>
      <div className="pl-16">
        <SectionBody section={section} />
      </div>
    </section>
  );
}

function SectionBody({ section }: { section: GuideSection }) {
  switch (section.type) {
    case "overview":
      return (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{section.body}</p>
          {section.callouts?.map((c, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 text-sm ${
                c.kind === "red" ? "border-[var(--color-error)]/40 bg-[var(--color-error)]/10 text-[var(--color-error)]" :
                c.kind === "gold" ? "border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10" :
                "border-[var(--org-primary)]/40 bg-[var(--org-primary)]/10"
              }`}
            >
              {c.title && <div className="text-xs font-semibold uppercase tracking-wider">{c.title}</div>}
              <div className="mt-1">{c.body}</div>
            </div>
          ))}
        </div>
      );

    case "schedule":
    case "timeline":
      return (
        <ul className="space-y-2">
          {section.entries.map((e, i) => (
            <li key={i} className="surface-inset flex gap-4 p-3">
              <div className="w-20 shrink-0 font-mono text-xs text-[var(--org-primary)]">{e.time}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{e.activity}</div>
                {"location" in e && e.location && <div className="text-xs text-[var(--text-muted)]">{e.location}</div>}
                {"note" in e && e.note && <div className="mt-1 text-xs text-[var(--text-muted)]">{e.note}</div>}
              </div>
            </li>
          ))}
        </ul>
      );

    case "set_times":
      return (
        <table className="data-table">
          <thead><tr><th>Artist</th><th>Stage</th><th>Start</th><th>End</th></tr></thead>
          <tbody>
            {section.entries.map((e, i) => (
              <tr key={i}>
                <td>{e.artist}</td>
                <td className="font-mono text-xs">{e.stage ?? "—"}</td>
                <td className="font-mono text-xs">{e.start}</td>
                <td className="font-mono text-xs">{e.end}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "credentials":
      return (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Area</th>
                {section.columns.map((c) => <th key={c} className="font-mono text-xs">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((r, i) => (
                <tr key={i} className={section.highlightRowIndex === i ? "bg-[var(--org-primary)]/10" : ""}>
                  <td>{r.area}</td>
                  {section.columns.map((c) => {
                    const v = r.access[c];
                    const on = v === true || v === "yes";
                    return (
                      <td key={c} className="text-center">
                        {typeof v === "string" && v !== "yes" && v !== "no"
                          ? <span className="font-mono text-xs">{v}</span>
                          : on
                            ? <span className="text-[var(--color-success)]">✓</span>
                            : <span className="text-[var(--text-muted)]">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "contacts":
      return (
        <table className="data-table">
          <tbody>
            {section.entries.map((e, i) =>
              e.header ? (
                <tr key={i}><td colSpan={3} className="font-semibold">{e.header}</td></tr>
              ) : (
                <tr key={i}>
                  <td>{e.name ?? "—"}</td>
                  <td className="font-mono text-xs text-[var(--text-muted)]">{e.role ?? "—"}</td>
                  <td className="font-mono text-xs">{[e.phone, e.email].filter(Boolean).join(" · ")}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      );

    case "faq":
      return (
        <div className="space-y-2">
          {section.entries.map((e, i) => (
            <details key={i} className="surface p-3">
              <summary className="cursor-pointer text-sm font-medium">{e.q}</summary>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{e.a}</p>
            </details>
          ))}
        </div>
      );

    case "sops":
      return (
        <div className="space-y-3">
          {section.entries.map((e, i) => (
            <div key={i} className="surface p-4">
              <div className="flex items-center gap-2">
                {e.code && <span className="rounded bg-[var(--color-error)]/10 px-2 py-0.5 font-mono text-xs text-[var(--color-error)]">{e.code}</span>}
                <div className="text-sm font-semibold">{e.title}</div>
              </div>
              <ol className="mt-3 space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                {e.steps.map((step, j) => <li key={j} className="list-decimal">{step}</li>)}
              </ol>
              {e.note && <div className="mt-3 text-xs text-[var(--text-muted)]">{e.note}</div>}
            </div>
          ))}
        </div>
      );

    case "ppe":
      return (
        <table className="data-table">
          <thead><tr><th>Item</th><th>Required</th><th>Note</th></tr></thead>
          <tbody>
            {section.entries.map((e, i) => (
              <tr key={i}><td>{e.item}</td><td>{e.required ? "✓" : "—"}</td><td className="text-[var(--text-muted)]">{e.note ?? ""}</td></tr>
            ))}
          </tbody>
        </table>
      );

    case "radio":
      return (
        <div className="space-y-3">
          <table className="data-table">
            <thead><tr><th>Channel</th><th>Purpose</th></tr></thead>
            <tbody>
              {section.channels.map((c, i) => (
                <tr key={i}><td className="font-mono text-xs">{c.channel}</td><td>{c.purpose}</td></tr>
              ))}
            </tbody>
          </table>
          {section.codeWords && (
            <table className="data-table">
              <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
              <tbody>
                {section.codeWords.map((c, i) => (
                  <tr key={i}><td className="font-mono text-xs">{c.code}</td><td>{c.meaning}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );

    case "resources":
      return (
        <ul className="space-y-2">
          {section.entries.map((r, i) => (
            <li key={i} className="surface-inset p-3">
              <div className="text-sm font-medium">{r.name}</div>
              <div className="font-mono text-xs text-[var(--text-muted)]">{r.location}</div>
              {r.details && <div className="mt-1 text-xs text-[var(--text-secondary)]">{r.details}</div>}
            </li>
          ))}
        </ul>
      );

    case "evacuation":
      return (
        <div className="space-y-3">
          <table className="data-table">
            <thead><tr><th>From</th><th>To</th><th>Via</th></tr></thead>
            <tbody>
              {section.routes.map((r, i) => (
                <tr key={i}><td>{r.from}</td><td>{r.to}</td><td className="font-mono text-xs text-[var(--text-muted)]">{r.via ?? "direct"}</td></tr>
              ))}
            </tbody>
          </table>
          {section.assemblyPoint && (
            <div className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wider">Assembly point</div>
              <div className="mt-1">{section.assemblyPoint}</div>
            </div>
          )}
        </div>
      );

    case "fire_safety":
    case "accessibility":
    case "sustainability":
    case "code_of_conduct":
      return (
        <ul className="space-y-2">
          {section.entries.map((e, i) => (
            <li key={i} className="surface-inset p-3">
              <div className="text-sm font-medium">{"item" in e ? e.item : ""}</div>
              {("detail" in e && e.detail) && <div className="mt-1 text-xs text-[var(--text-secondary)]">{e.detail}</div>}
              {("location" in e && e.location) && <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">{e.location}</div>}
              {("note" in e && e.note) && <div className="mt-1 text-xs text-[var(--text-muted)]">{e.note}</div>}
            </li>
          ))}
        </ul>
      );

    case "custom":
      return <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{section.body}</p>;
  }
}
