"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronsUpDown, ChevronUp, ArrowRightLeft, LayoutGrid, Check, Search } from "lucide-react";
import { SheetHead } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * COMPVSS workspace / project switcher — kit 28 `{switcher && …}`
 * (design_handoff_compvss_field/runtime/app.jsx).
 *
 * The drawer the app bar's context button opens. Kit structure, in order:
 *   Workspace section  → current org row (Building2 tile, name, sub) + Switch
 *                        pill that expands the other orgs inline
 *   Projects section   → search bar · All/Live/Planning/Closed chips ·
 *                        "All Projects" row · one row per project with a
 *                        status-coloured `.bar`, client · venue, location · sub
 *
 * The tick is on the ACTIVE row (kit: `p.id === projId`), which is what makes
 * the sheet readable at a glance in the dark.
 */
export type SwitcherOrg = { id: string; name: string; sub: string };
export type SwitcherProject = {
  id: string;
  name: string;
  client: string;
  venue: string;
  location: string;
  status: "Live" | "Planning" | "Closed";
  sub: string;
};

const STATUSES = ["All", "Live", "Planning", "Closed"] as const;

function barColor(status: SwitcherProject["status"]): string {
  return status === "Live" ? "var(--p-success)" : status === "Planning" ? "var(--p-warning)" : "var(--p-border)";
}

type SwitcherData = { orgs: SwitcherOrg[]; projects: SwitcherProject[] };

export function MobileSwitcherSheet({
  open,
  onClose,
  currentOrgId,
  currentProjectId,
}: {
  open: boolean;
  onClose: () => void;
  currentOrgId: string;
  currentProjectId: string | null;
}) {
  const router = useRouter();
  const t = useT();
  const [orgListOpen, setOrgListOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<(typeof STATUSES)[number]>("All");
  const [pending, setPending] = React.useState(false);
  // Switcher data is DEFERRED — the org list + project catalog (with client and
  // venue joins) used to load in the (mobile) layout on every nav just to fill
  // this drawer. It now loads the first time the sheet opens, so a normal nav
  // pays nothing for a closed switcher. Fetched once, then cached in state.
  const [data, setData] = React.useState<SwitcherData | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || data || loading) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/v1/me/switcher", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (cancelled) return;
        const payload = (json?.data ?? {}) as Partial<SwitcherData>;
        setData({ orgs: payload.orgs ?? [], projects: payload.projects ?? [] });
      })
      .catch(() => {
        // Network/offline: fall back to an empty catalog (the sheet still shows
        // the current workspace + "All Projects" so it never dead-ends).
        if (!cancelled) setData({ orgs: [], projects: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, data, loading]);

  const orgs = data?.orgs ?? [];
  const projects = data?.projects ?? [];
  const org =
    orgs.find((o) => o.id === currentOrgId) ?? orgs[0] ?? { id: currentOrgId, name: "Workspace", sub: "Organization" };

  // Esc closes — the sheet is a modal and a keyboard user must be able to
  // leave it without a mouse.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const switchOrg = async (id: string) => {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/v1/me/workspaces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: id }),
      });
      onClose();
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const pickProject = (id: string | "all") => {
    // Project scope is a URL concern on /m, not a stored preference: the
    // surfaces that care read it from the query string.
    onClose();
    router.push(id === "all" ? "/m" : `/m?project=${id}`);
    router.refresh();
  };

  const visible = projects
    .filter((p) => status === "All" || p.status === status)
    .filter((p) => !q || `${p.name} ${p.client} ${p.venue} ${p.location}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Switch workspace or project">
      <button
        type="button"
        className="sheet-bg"
        aria-label={t("m.switcher.close", undefined, "Close")}
        tabIndex={-1}
        style={{ border: "none", padding: 0, cursor: "default" }}
        onClick={onClose}
      />
      <div className="sheet-panel">
        <div className="sheet-grip" />

        {/* Kit 32 (drawer canon v2.8): the switcher is a CONTEXT drawer and
            carries the canonical SheetHead — icon · title · sub · explicit ✕
            (kit runtime: `<SheetHead icon="Building2" title="Workspace"
            sub={org · N Projects} …/>`). Scrim-tap alone is not a close
            affordance. */}
        <SheetHead
          icon="Building2"
          title={t("m.switcher.head", undefined, "Workspace")}
          sub={t(
            "m.switcher.headSub",
            { org: org.name, n: projects.length },
            `${org.name} · ${projects.length} Projects`,
          )}
          closeLabel={t("m.switcher.close", undefined, "Close")}
          onClose={onClose}
        />
        <div className="item" style={{ background: "var(--p-surface-2)" }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "var(--p-bg)",
              border: "1px solid var(--p-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <Building2 size={17} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="t">{org.name}</div>
            <div className="s">{org.sub}</div>
          </div>
          <span className="sp" />
          {orgs.length > 1 && (
            <button type="button" className="pill" onClick={() => setOrgListOpen((v) => !v)}>
              {orgListOpen ? "Close" : "Switch"}
              {orgListOpen ? <ChevronUp size={13} /> : <ChevronsUpDown size={13} />}
            </button>
          )}
        </div>

        {orgListOpen && (
          <div style={{ paddingLeft: 8, marginTop: 4 }}>
            {orgs
              .filter((o) => o.id !== currentOrgId)
              .map((o) => (
                <button
                  type="button"
                  className="item tap"
                  key={o.id}
                  style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
                  disabled={pending}
                  onClick={() => switchOrg(o.id)}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "var(--p-surface-2)",
                      border: "1px solid var(--p-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <Building2 size={14} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{o.name}</div>
                    <div className="s">{o.sub}</div>
                  </div>
                  <span className="sp" />
                  <ArrowRightLeft size={15} style={{ color: "var(--p-text-3)" }} />
                </button>
              ))}
          </div>
        )}

        <div className="sech" style={{ margin: "18px 0 8px" }}>
          <h2>Projects</h2>
          <span style={{ fontSize: 11, color: "var(--p-text-3)" }}>{org.name}</span>
        </div>

        <div className="searchbar" style={{ marginBottom: 8 }}>
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects, client, venue…" />
        </div>
        <div className="chips" style={{ paddingBottom: 10 }}>
          {STATUSES.map((s) => (
            <button type="button" key={s} className={`chip ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}>
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="item tap"
          style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
          onClick={() => pickProject("all")}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "color-mix(in oklab, var(--p-accent) 16%, transparent)",
              color: "var(--p-accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <LayoutGrid size={15} />
          </span>
          <div>
            <div className="t">All Projects</div>
            <div className="s">Combined view · no filter</div>
          </div>
          <span className="sp" />
          {currentProjectId === null && <Check size={18} style={{ color: "var(--p-success)" }} />}
        </button>

        {visible.map((p) => (
          <button
            type="button"
            className="item tap"
            key={p.id}
            style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
            onClick={() => pickProject(p.id)}
          >
            <span className="bar" style={{ background: barColor(p.status) }} />
            <div style={{ minWidth: 0 }}>
              <div className="t">{p.name}</div>
              <div className="s">
                {p.client} · {p.venue}
              </div>
              <div className="s" style={{ color: "var(--p-text-3)", marginTop: 1 }}>
                {p.location} · {p.sub}
              </div>
            </div>
            <span className="sp" />
            {p.id === currentProjectId && <Check size={18} style={{ color: "var(--p-success)" }} />}
          </button>
        ))}

        {!visible.length && (
          <div className="s" style={{ padding: "12px 4px", color: "var(--p-text-3)" }}>
            {!data ? "Loading projects…" : "No projects match these filters."}
          </div>
        )}
      </div>
    </div>
  );
}
