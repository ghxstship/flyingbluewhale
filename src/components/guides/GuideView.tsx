import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { GuideConfig, GuideSection } from "@/lib/guides/types";
import { Alert } from "@/components/ui/Alert";
import { getRequestT } from "@/lib/i18n/request";

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

export async function GuideView({
  title,
  subtitle,
  classification,
  config,
  tier,
  updatedAt,
  hideTitle = false,
  comments,
}: {
  title: string;
  subtitle?: string | null;
  classification?: string | null;
  config: GuideConfig;
  tier?: number;
  /** Last-updated timestamp. Rendered as "Last updated {date}" below the
   *  classification chip — replaces version strings in guide subtitles. */
  updatedAt?: string | null;
  /** When true, suppress title + subtitle (caller's shell already renders
   *  them via ModuleHeader). Classification pill, access tier, and
   *  last-updated line still render. */
  hideTitle?: boolean;
  /** Optional comments slot rendered after sections (typically <GuideComments />). */
  comments?: ReactNode;
}) {
  const { t } = await getRequestT();
  const sections = config.sections ?? [];
  const lastUpdated = updatedAt ? formatLastUpdated(updatedAt) : null;

  return (
    <article className="space-y-10">
      <header className="border-b border-[var(--p-border)] pb-6">
        {classification && (
          <div className="inline-flex rounded-full bg-[var(--p-danger)]/10 px-3 py-1 text-[11px] font-semibold tracking-widest text-[var(--p-danger)] uppercase">
            {classification}
          </div>
        )}
        {!hideTitle && (
          <>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-[var(--p-text-2)]">{subtitle}</p>}
          </>
        )}
        {(typeof tier === "number" || lastUpdated) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[var(--p-text-2)]">
            {typeof tier === "number" && (
              <span>{t("components.guideView.accessTier", { tier }, "Access tier {tier}")}</span>
            )}
            {typeof tier === "number" && lastUpdated && <span aria-hidden>·</span>}
            {lastUpdated && (
              <span>{t("components.guideView.lastUpdated", { date: lastUpdated }, "Last updated {date}")}</span>
            )}
          </div>
        )}
      </header>

      <nav className="shell-nav sticky top-0 -mx-4 flex gap-1 overflow-x-auto border-b border-[var(--p-border)] bg-[var(--p-bg)]/90 px-4 py-2 backdrop-blur">
        {sections.map((s, i) => (
          <a
            key={i}
            href={`#section-${i}`}
            className="shrink-0 rounded-full px-3 py-1 font-mono text-[10px] tracking-wider text-[var(--p-text-2)] uppercase hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
          >
            {(i + 1).toString().padStart(2, "0")} · {s.heading}
          </a>
        ))}
      </nav>

      {sections.map((s, i) => (
        <SectionWrapper key={i} index={i} section={s} t={t} />
      ))}

      {comments && <div className="border-t border-[var(--p-border)] pt-6">{comments}</div>}
    </article>
  );
}

function SectionWrapper({ index, section, t }: { index: number; section: GuideSection; t: Translator }) {
  return (
    <section id={`section-${index}`} className="space-y-4">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-5xl font-light text-[var(--p-text-2)] opacity-30">
          {(index + 1).toString().padStart(2, "0")}
        </span>
        <div className="flex-1 border-t border-[var(--p-accent)] pt-2">
          <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
        </div>
      </div>
      <div className="ps-16">
        <SectionBody section={section} t={t} />
      </div>
    </section>
  );
}

function SectionBody({ section, t }: { section: GuideSection; t: Translator }) {
  switch (section.type) {
    case "overview":
      return (
        <div className="space-y-3">
          <p className="text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{section.body}</p>
          {section.callouts?.map((c, i) => (
            <Alert
              key={i}
              kind={c.kind === "red" ? "error" : c.kind === "gold" ? "warning" : "info"}
              title={c.title}
              className="p-4 text-sm"
              hideIcon
            >
              {c.body}
            </Alert>
          ))}
        </div>
      );

    case "schedule":
    case "timeline":
      return (
        <ul className="space-y-2">
          {section.entries.map((e, i) => (
            <li key={i} className="surface-inset flex gap-4 p-3">
              <div className="w-20 shrink-0 font-mono text-xs text-[var(--p-accent)]">{e.time}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{e.activity}</div>
                {"location" in e && e.location && <div className="text-xs text-[var(--p-text-2)]">{e.location}</div>}
                {"note" in e && e.note && <div className="mt-1 text-xs text-[var(--p-text-2)]">{e.note}</div>}
              </div>
            </li>
          ))}
        </ul>
      );

    case "set_times":
      return (
        <table className="ps-table">
          <thead>
            <tr>
              <th>{t("components.guideView.setTimes.artist", undefined, "Artist")}</th>
              <th>{t("components.guideView.setTimes.stage", undefined, "Stage")}</th>
              <th>{t("components.guideView.setTimes.start", undefined, "Start")}</th>
              <th>{t("components.guideView.setTimes.end", undefined, "End")}</th>
            </tr>
          </thead>
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
          <table className="ps-table">
            <thead>
              <tr>
                <th>{t("components.guideView.credentials.area", undefined, "Area")}</th>
                {section.columns.map((c) => (
                  <th key={c} className="font-mono text-xs">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((r, i) => (
                <tr key={i} className={section.highlightRowIndex === i ? "bg-[var(--p-accent)]/10" : ""}>
                  <td>{r.area}</td>
                  {section.columns.map((c) => {
                    const v = r.access[c];
                    const on = v === true || v === "yes";
                    return (
                      <td key={c} className="text-center">
                        {typeof v === "string" && v !== "yes" && v !== "no" ? (
                          <span className="font-mono text-xs">{v}</span>
                        ) : on ? (
                          <Check
                            size={14}
                            strokeWidth={3}
                            className="inline-block text-[var(--p-success)]"
                            aria-label={t("components.guideView.allowed", undefined, "Allowed")}
                          />
                        ) : (
                          <span
                            className="text-[var(--p-text-2)]"
                            aria-label={t("components.guideView.notAllowed", undefined, "Not allowed")}
                          >
                            —
                          </span>
                        )}
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
        <table className="ps-table">
          <tbody>
            {section.entries.map((e, i) =>
              e.header ? (
                <tr key={i}>
                  <td colSpan={3} className="font-semibold">
                    {e.header}
                  </td>
                </tr>
              ) : (
                <tr key={i}>
                  <td>{e.name ?? "—"}</td>
                  <td className="font-mono text-xs text-[var(--p-text-2)]">{e.role ?? "—"}</td>
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
              <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{e.a}</p>
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
                {e.code && (
                  <span className="rounded bg-[var(--p-danger)]/10 px-2 py-0.5 font-mono text-xs text-[var(--p-danger)]">
                    {e.code}
                  </span>
                )}
                <div className="text-sm font-semibold">{e.title}</div>
              </div>
              <ol className="mt-3 space-y-1 ps-5 text-sm text-[var(--p-text-2)]">
                {e.steps.map((step, j) => (
                  <li key={j} className="list-decimal">
                    {step}
                  </li>
                ))}
              </ol>
              {e.note && <div className="mt-3 text-xs text-[var(--p-text-2)]">{e.note}</div>}
            </div>
          ))}
        </div>
      );

    case "ppe":
      return (
        <table className="ps-table">
          <thead>
            <tr>
              <th>{t("components.guideView.ppe.item", undefined, "Item")}</th>
              <th>{t("components.guideView.ppe.required", undefined, "Required")}</th>
              <th>{t("components.guideView.ppe.note", undefined, "Note")}</th>
            </tr>
          </thead>
          <tbody>
            {section.entries.map((e, i) => (
              <tr key={i}>
                <td>{e.item}</td>
                <td>
                  {e.required ? (
                    <Check
                      size={14}
                      strokeWidth={3}
                      className="inline-block"
                      aria-label={t("components.guideView.ppe.requiredLabel", undefined, "Required")}
                    />
                  ) : (
                    <span
                      className="text-[var(--p-text-2)]"
                      aria-label={t("components.guideView.ppe.notRequiredLabel", undefined, "Not required")}
                    >
                      —
                    </span>
                  )}
                </td>
                <td className="text-[var(--p-text-2)]">{e.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "radio":
      return (
        <div className="space-y-3">
          <table className="ps-table">
            <thead>
              <tr>
                <th>{t("components.guideView.radio.channel", undefined, "Channel")}</th>
                <th>{t("components.guideView.radio.purpose", undefined, "Purpose")}</th>
              </tr>
            </thead>
            <tbody>
              {section.channels.map((c, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs">{c.channel}</td>
                  <td>{c.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {section.codeWords && (
            <table className="ps-table">
              <thead>
                <tr>
                  <th>{t("components.guideView.radio.code", undefined, "Code")}</th>
                  <th>{t("components.guideView.radio.meaning", undefined, "Meaning")}</th>
                </tr>
              </thead>
              <tbody>
                {section.codeWords.map((c, i) => (
                  <tr key={i}>
                    <td className="font-mono text-xs">{c.code}</td>
                    <td>{c.meaning}</td>
                  </tr>
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
              <div className="font-mono text-xs text-[var(--p-text-2)]">{r.location}</div>
              {r.details && <div className="mt-1 text-xs text-[var(--p-text-2)]">{r.details}</div>}
            </li>
          ))}
        </ul>
      );

    case "evacuation":
      return (
        <div className="space-y-3">
          <table className="ps-table">
            <thead>
              <tr>
                <th>{t("components.guideView.evacuation.from", undefined, "From")}</th>
                <th>{t("components.guideView.evacuation.to", undefined, "To")}</th>
                <th>{t("components.guideView.evacuation.via", undefined, "Via")}</th>
              </tr>
            </thead>
            <tbody>
              {section.routes.map((r, i) => (
                <tr key={i}>
                  <td>{r.from}</td>
                  <td>{r.to}</td>
                  <td className="font-mono text-xs text-[var(--p-text-2)]">
                    {r.via ?? t("components.guideView.evacuation.direct", undefined, "direct")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {section.assemblyPoint && (
            <Alert
              kind="error"
              title={t("components.guideView.evacuation.assemblyPoint", undefined, "Assembly Point")}
              className="text-sm"
            >
              {section.assemblyPoint}
            </Alert>
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
              {"detail" in e && e.detail && <div className="mt-1 text-xs text-[var(--p-text-2)]">{e.detail}</div>}
              {"location" in e && e.location && (
                <div className="mt-1 font-mono text-xs text-[var(--p-text-2)]">{e.location}</div>
              )}
              {"note" in e && e.note && <div className="mt-1 text-xs text-[var(--p-text-2)]">{e.note}</div>}
            </li>
          ))}
        </ul>
      );

    case "custom":
      return <p className="text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{section.body}</p>;
  }
}

function formatLastUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}
