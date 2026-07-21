"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Fab, FormScreen, KIcon, NormalizedList, RecordDetail, type FieldDef, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
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

export function JobsView({
  gigs,
  canPost,
  initialSaved = [],
}: {
  gigs: Gig[];
  canPost?: boolean;
  initialSaved?: string[];
}) {
  const router = useRouter();
  const { prefs, setPrefs } = useUserPreferences();
  const [postOpen, setPostOpen] = useState(false);
  const [postPending, startPost] = useTransition();
  const [postError, setPostError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Gig | null>(null);

  // Kit 32 A4 — saved jobs. Seeded from the server (SSR) and reconciled with
  // the shared preferences cache once it loads; toggling persists to
  // user_preferences.ui_state so the Saved set survives across sessions.
  const [savedOnly, setSavedOnly] = useState(false);
  const saved = useMemo(
    () => new Set(prefs.saved_jobs ?? initialSaved),
    [prefs.saved_jobs, initialSaved],
  );
  const toggleSave = (id: string) => {
    const next = new Set(saved);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    void setPrefs({ saved_jobs: Array.from(next) });
  };
  const shareJob = (g: Gig) => router.push(`/m/referrals?job=${encodeURIComponent(g.role)}`);

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

  const typeList = useMemo(() => Array.from(new Set(gigs.map((g) => g.employmentType))).sort(), [gigs]);
  const rateNum = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0;

  // The saved-jobs pre-filter (All/Saved chips); NormalizedList handles the rest
  // (search + type pills + drawer sort/filter/group) via the field schema.
  const listItems = useMemo(() => (savedOnly ? gigs.filter((g) => saved.has(g.id)) : gigs), [gigs, savedOnly, saved]);
  const savedCount = useMemo(() => gigs.filter((g) => saved.has(g.id)).length, [gigs, saved]);

  const FIELDS: FieldDef<Gig>[] = [
    { id: "role", label: t("m.gigs.col.role", undefined, "Role"), type: "text", get: (g) => g.role },
    { id: "org", label: t("m.gigs.group.org", undefined, "Organization"), type: "select", options: [...new Set(gigs.map((g) => g.org))], get: (g) => g.org },
    { id: "type", label: t("m.gigs.group.type", undefined, "Type"), type: "select", options: typeList, get: (g) => g.employmentType },
    { id: "rate", label: t("m.gigs.col.rate", undefined, "Rate"), type: "num", get: (g) => rateNum(g.rate) },
    { id: "applicants", label: t("m.gigs.sort.applicants", undefined, "Applicants"), type: "num", get: (g) => g.applicants },
    { id: "when", label: t("m.gigs.col.when", undefined, "When"), type: "text", get: (g) => g.when },
  ];

  const gigCard = (g: Gig) => (
        <div
          className="item tap"
          key={g.id}
          style={{ display: "block" }}
          role="button"
          tabIndex={0}
          onClick={() => setDetail(g)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetail(g); } }}
        >
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
            {/* Kit 32 A4 — bookmark toggle (persisted) + Job Share to referrals. */}
            <button
              type="button"
              className="sec-act"
              aria-label={saved.has(g.id) ? t("m.gigs.unsave", undefined, "Unsave") : t("m.gigs.save", undefined, "Save")}
              aria-pressed={saved.has(g.id)}
              onClick={(e) => { e.stopPropagation(); toggleSave(g.id); }}
              style={saved.has(g.id) ? { color: "var(--p-accent-text)" } : undefined}
            >
              <KIcon name="Bookmark" size={15} />
            </button>
            <button
              type="button"
              className="sec-act"
              aria-label={t("m.gigs.share", undefined, "Share Job")}
              onClick={(e) => { e.stopPropagation(); shareJob(g); }}
            >
              <KIcon name="UserPlus" size={15} />
            </button>
            {/* Propagation guard so tapping Apply doesn't also open the card
                detail; the interactive element is the ApplyButton within. */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
            <span onClick={(e) => e.stopPropagation()}>
              <ApplyButton gig={g} />
            </span>
          </div>
        </div>
  );

  return (
    <>
      {/* Kit 32 A4 — All / Saved filter chips (Saved shows a live count). */}
      <div className="chips" style={{ paddingBottom: 8 }}>
        <button type="button" className={`chip ${!savedOnly ? "on" : ""}`} onClick={() => setSavedOnly(false)}>
          {t("m.gigs.all", undefined, "All")}
        </button>
        <button type="button" className={`chip ${savedOnly ? "on" : ""}`} onClick={() => setSavedOnly(true)}>
          <KIcon name="Bookmark" size={12} /> {t("m.gigs.saved", undefined, "Saved")}
          {savedCount > 0 ? ` · ${savedCount}` : ""}
        </button>
      </div>

      {/* Post-a-Job opener. Manager-band only (mirrors the FAB's `canPost`
          gate + the postJob server re-check). */}
      {canPost && (
        <div
          className="composer-cta"
          style={{ marginBottom: 12 }}
          role="button"
          tabIndex={0}
          onClick={() => setPostOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setPostOpen(true);
            }
          }}
        >
          <span className="more-ic">
            <KIcon name="Plus" size={18} />
          </span>
          <span className="cc-box">{t("m.gigs.postJob", undefined, "Post a job…")}</span>
        </div>
      )}

      <NormalizedList
        k="gigs"
        items={listItems}
        fields={FIELDS}
        search={(g) => `${g.role} ${g.org} ${g.tags.join(" ")}`}
        searchPlaceholder={t("m.gigs.search", undefined, "Search jobs…")}
        renderRow={gigCard}
        views={["list", "table"]}
        pill={{ get: (g) => g.employmentType, order: typeList }}
        empty={{
          cols: [
            t("m.gigs.col.role", undefined, "Role"),
            t("m.gigs.col.rate", undefined, "Rate"),
            t("m.gigs.col.when", undefined, "When"),
          ],
          title: t("m.gigs.empty.title", undefined, "No Jobs"),
          hint: t("m.gigs.empty.hint", undefined, "Open shifts and gigs from orgs on your network land here."),
        }}
      />

      {/* Kit FAB: Post Job — perm `approve` in the kit's CREATE map, the
          manager band here. The action re-checks server-side. */}
      {canPost && (
        <Fab label="Post Job" onClick={() => setPostOpen(true)} />
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

      {detail && (
        <RecordDetail
          eyebrow={detail.org}
          title={detail.role}
          icon="Briefcase"
          status={detail.applied ? { tone: "success", label: t("m.gigs.applied", undefined, "Applied") } : undefined}
          tags={[...detail.certs, ...detail.tags]}
          fields={[
            { k: t("m.gigs.group.org", undefined, "Organization"), v: detail.org },
            { k: t("m.gigs.group.type", undefined, "Type"), v: detail.employmentType },
            { k: t("m.gigs.col.rate", undefined, "Rate"), v: detail.rate },
            { k: t("m.gigs.col.when", undefined, "When"), v: detail.when },
            { k: t("m.gigs.sort.applicants", undefined, "Applicants"), v: t("m.gigs.applicants", { count: detail.applicants }, `${detail.applicants} applied`) },
          ]}
          sections={[
            {
              h: t("m.gigs.apply", undefined, "Apply"),
              node: (
                <div style={{ marginTop: 8 }}>
                  <ApplyButton gig={detail} />
                </div>
              ),
            },
          ]}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
