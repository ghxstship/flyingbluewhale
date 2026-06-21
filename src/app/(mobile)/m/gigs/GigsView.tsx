"use client";

import { useActionState, useState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { applyToJob, type State } from "./actions";

/**
 * GigsView — Jobs client leaf. Search + the job cards with cert/flag chips, rate
 * tag, and an Apply button per row (routes through applyToJob). Includes a
 * Post-a-Job CTA placeholder.
 *
 * Design truth: prototype jobs tab (app.jsx 2236-2283) + JOBS (830-844).
 */

export type Gig = {
  id: string;
  role: string;
  org: string;
  logo: string;
  rate: string;
  when: string;
  certs: string[];
  tags: string[];
  employmentType: string;
  applicants: number;
  applied: boolean;
};

function ApplyButton({ gig }: { gig: Gig }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(applyToJob, null);
  const done = gig.applied || state?.ok === "applied";
  return (
    <form action={formAction}>
      <input type="hidden" name="jobId" value={gig.id} />
      {done ? (
        <span className="ps-badge ps-badge--ok">{t("m.gigs.applied", undefined, "Applied")}</span>
      ) : (
        <button type="submit" className="ps-btn ps-btn--sm" disabled={pending}>
          {pending ? t("m.gigs.applying", undefined, "Applying…") : t("m.gigs.apply", undefined, "Apply")}
        </button>
      )}
    </form>
  );
}

export function GigsView({ gigs }: { gigs: Gig[] }) {
  const t = useT();
  const [q, setQ] = useState("");
  const items = gigs.filter(
    (g) => !q || (g.role + " " + g.org + " " + g.tags.join(" ")).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <div className="actionbar" style={{ marginBottom: 12 }}>
        <div className="searchbar">
          <KIcon name="Search" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("m.gigs.search", undefined, "Search jobs…")}
            aria-label={t("m.gigs.search", undefined, "Search jobs…")}
          />
        </div>
      </div>

      <div className="composer-cta" style={{ marginBottom: 12 }} role="button" tabIndex={0}>
        <span className="more-ic">
          <KIcon name="Plus" size={18} />
        </span>
        <span className="cc-box">{t("m.gigs.postJob", undefined, "Post a job…")}</span>
      </div>

      {items.map((g) => (
        <div className="item tap" key={g.id} style={{ display: "block" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
            <span className="job-logo">{g.logo}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{g.role}</div>
              <div className="s">{g.org}</div>
            </div>
            <span className="ps-badge ps-badge--neutral">{g.employmentType}</span>
          </div>
          {(g.certs.length > 0 || g.tags.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {g.certs.map((c) => (
                <span className="job-cert" key={c}>
                  <KIcon name="BadgeCheck" size={11} /> {c}
                </span>
              ))}
              {g.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="pricetag">{g.rate}</span>
            <span className="time" style={{ color: "var(--p-text-3)" }}>
              {g.when} · {t("m.gigs.applicants", { count: g.applicants }, `${g.applicants} applied`)}
            </span>
            <span style={{ flex: 1 }} />
            <ApplyButton gig={g} />
          </div>
        </div>
      ))}

      {!items.length && (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "16px 4px" }}>
          {t("m.gigs.noMatch", undefined, "Nothing matches your search.")}
        </div>
      )}
    </>
  );
}
