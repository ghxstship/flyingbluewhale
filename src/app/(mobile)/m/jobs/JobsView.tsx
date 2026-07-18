"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionBar, EmptySkeleton, FormScreen, GroupedList, KIcon, TogRow, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { useT } from "@/lib/i18n/LocaleProvider";
import { applyToJob, postJob, type State } from "./actions";

/**
 * JobsView — Jobs client leaf. Search + the job cards with cert/flag chips, rate
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

export function JobsView({ gigs, canPost }: { gigs: Gig[]; canPost?: boolean }) {
  const router = useRouter();
  const [postOpen, setPostOpen] = useState(false);
  const [postPending, startPost] = useTransition();
  const [postError, setPostError] = useState<string | null>(null);

  function onPost(_def: FormDef, vals: Record<string, unknown>) {
    if (postPending) return;
    const fd = toFormData(vals);
    startPost(async () => {
      const res = await postJob(null, fd);
      if (res?.error) {
        setPostError(res.error);
        return;
      }
      setPostError(null);
      setPostOpen(false);
      router.refresh();
    });
  }

  const t = useT();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");
  const [group, setGroup] = useState("none");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const typeList = useMemo(() => Array.from(new Set(gigs.map((g) => g.employmentType))).sort(), [gigs]);
  const toggleType = (ty: string) =>
    setTypes((s) => {
      const n = new Set(s);
      if (n.has(ty)) n.delete(ty);
      else n.add(ty);
      return n;
    });

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = gigs.filter(
      (g) =>
        (!needle || (g.role + " " + g.org + " " + g.tags.join(" ")).toLowerCase().includes(needle)) &&
        (types.size === 0 || types.has(g.employmentType)),
    );
    const rate = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0;
    if (sort === "role") return filtered.slice().sort((a, b) => a.role.localeCompare(b.role));
    if (sort === "rate") return filtered.slice().sort((a, b) => rate(b.rate) - rate(a.rate));
    if (sort === "date") return filtered.slice().sort((a, b) => String(a.when).localeCompare(String(b.when)));
    if (sort === "applicants") return filtered.slice().sort((a, b) => b.applicants - a.applicants);
    return filtered;
  }, [gigs, q, sort, types]);

  // Kit 31 resolution #5 — group enum (None / Organization / Type).
  const grouped = useMemo<[string, Gig[]][] | null>(() => {
    if (group === "none") return null;
    const keyF = group === "org" ? (g: Gig) => g.org : (g: Gig) => g.employmentType;
    const m = new Map<string, Gig[]>();
    items.forEach((g) => {
      const k = keyF(g);
      m.set(k, [...(m.get(k) ?? []), g]);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [group, items]);

  const gigCard = (g: Gig) => (
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
  );

  return (
    <>
      <ActionBar
        k="gigs"
        query={q}
        setQuery={setQ}
        placeholder={t("m.gigs.search", undefined, "Search jobs…")}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", t("m.gigs.group.none", undefined, "None")],
          ["org", t("m.gigs.group.org", undefined, "Organization")],
          ["type", t("m.gigs.group.type", undefined, "Type")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["recent", t("m.gigs.sort.recent", undefined, "Recent")],
          ["rate", t("m.gigs.sort.rate", undefined, "Rate")],
          ["role", t("m.gigs.sort.role", undefined, "Role")],
          ["date", t("m.gigs.sort.date", undefined, "Date")],
          ["applicants", t("m.gigs.sort.applicants", undefined, "Applicants")],
        ]}
        filterActive={types.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            {typeList.map((ty) => (
              <TogRow key={ty} label={ty} on={types.has(ty)} set={() => toggleType(ty)} />
            ))}
          </div>
        }
      />

      <div className="composer-cta" style={{ marginBottom: 12 }} role="button" tabIndex={0}>
        <span className="more-ic">
          <KIcon name="Plus" size={18} />
        </span>
        <span className="cc-box">{t("m.gigs.postJob", undefined, "Post a job…")}</span>
      </div>

      {grouped ? (
        <GroupedList<Gig>
          skey="gigs"
          groups={grouped}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          renderRow={gigCard}
        />
      ) : (
        items.map(gigCard)
      )}

      {!items.length && (
        <EmptySkeleton
          cols={[
            t("m.gigs.col.role", undefined, "Role"),
            t("m.gigs.col.rate", undefined, "Rate"),
            t("m.gigs.col.when", undefined, "When"),
          ]}
          title={t("m.gigs.empty.title", undefined, "No Jobs")}
          hint={t("m.gigs.empty.hint", undefined, "Open shifts and gigs from orgs on your network land here.")}
        />
      )}
      {/* Kit FAB: Post Job — perm `approve` in the kit's CREATE map, the
          manager band here. The action re-checks server-side. */}
      {canPost && (
        <button type="button" className="fab" aria-label="Post Job" onClick={() => setPostOpen(true)}>
          <KIcon name="Plus" size={24} />
        </button>
      )}
      {postOpen && (
        <>
          {postError && (
            <div
              className="ps-alert ps-alert--danger"
              role="alert"
              style={{ position: "fixed", top: 12, left: 18, right: 18, zIndex: 46 }}
            >
              {postError}
            </div>
          )}
          <FormScreen formId="job" onClose={() => setPostOpen(false)} onSubmit={onPost} />
        </>
      )}
    </>
  );
}
