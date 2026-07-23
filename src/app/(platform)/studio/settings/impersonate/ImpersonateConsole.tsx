"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useT } from "@/lib/i18n/LocaleProvider";

export type MemberRow = {
  userId: string;
  email: string;
  name: string | null;
  orgSlug: string;
  orgName: string;
  role: string;
  persona: string;
  isDeveloper: boolean;
};

type SpawnedCreds = { email: string; password: string; userId: string };

/**
 * Client console for the developer "Act As" surface. All privileged work
 * happens server-side behind the isDeveloper gate; this component only POSTs
 * to those endpoints and reflects the result. No secret or gate decision
 * lives here.
 */
export function ImpersonateConsole({
  rows,
  roles,
  personas,
  selfUserId,
}: {
  rows: MemberRow[];
  roles: readonly string[];
  personas: readonly string[];
  selfUserId: string;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.name ?? "").toLowerCase().includes(q) ||
        r.orgSlug.toLowerCase().includes(q) ||
        r.orgName.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.persona.toLowerCase().includes(q),
    );
  }, [rows, query]);

  async function actAs(userId: string) {
    if (busyId) return;
    setError(null);
    setBusyId(userId);
    try {
      const res = await fetch("/api/v1/admin/impersonate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          json?.error?.message ??
            t("console.settings.impersonate.errors.startFailed", undefined, "Could not start impersonation."),
        );
        setBusyId(null);
        return;
      }
      window.location.assign("/studio");
    } catch {
      setError(
        t("console.settings.impersonate.errors.networkStart", undefined, "Network error starting impersonation."),
      );
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      {error && <Alert kind="error">{error}</Alert>}

      {/* ── Act as an existing user ─────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="hed-lg">{t("console.settings.impersonate.users", undefined, "Users")}</h2>
        <input
          type="search"
          className="ps-input"
          placeholder={t(
            "console.settings.impersonate.searchPlaceholder",
            undefined,
            "Search by email, org, role, persona",
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("console.settings.impersonate.searchAria", undefined, "Search users")}
        />
        <div className="surface overflow-x-auto">
          <table className="ps-table">
            <thead>
              <tr>
                <th>{t("console.settings.impersonate.columns.user", undefined, "User")}</th>
                <th>{t("console.settings.impersonate.columns.org", undefined, "Org")}</th>
                <th>{t("console.settings.impersonate.columns.role", undefined, "Role")}</th>
                <th>{t("console.settings.impersonate.columns.persona", undefined, "Persona")}</th>
                <th aria-label={t("console.settings.impersonate.columns.actionsAria", undefined, "Actions")} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-sm">
                    {t("console.settings.impersonate.noMatches", undefined, "No matching users.")}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={`${r.userId}-${r.orgSlug}`}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.name || r.email}</div>
                      {r.name && <div className="text-xs">{r.email}</div>}
                    </td>
                    <td>{r.orgName}</td>
                    <td>{r.role}</td>
                    <td>{r.persona}</td>
                    <td style={{ textAlign: "end" }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busyId === r.userId}
                        disabled={r.userId === selfUserId || (busyId !== null && busyId !== r.userId)}
                        onClick={() => actAs(r.userId)}
                      >
                        {r.userId === selfUserId
                          ? t("console.settings.impersonate.you", undefined, "You")
                          : t("console.settings.impersonate.actAs", undefined, "Act as")}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Spawn a sandbox user ────────────────────────────────────── */}
      <SpawnSandbox roles={roles} personas={personas} onActAs={actAs} busy={busyId !== null} />
    </div>
  );
}

function SpawnSandbox({
  roles,
  personas,
  onActAs,
  busy,
}: {
  roles: readonly string[];
  personas: readonly string[];
  onActAs: (userId: string) => void;
  busy: boolean;
}) {
  const t = useT();
  const [orgSlug, setOrgSlug] = useState("demo");
  const [role, setRole] = useState<string>(roles[0] ?? "member");
  const [persona, setPersona] = useState<string>(personas[0] ?? "member");
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending] = useState(false);
  const [creds, setCreds] = useState<SpawnedCreds | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function spawn() {
    if (pending) return;
    setError(null);
    setCreds(null);
    setPending(true);
    try {
      const res = await fetch("/api/v1/admin/sandbox-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgSlug: orgSlug.trim(),
          role,
          persona,
          displayName: displayName.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          json?.error?.message ??
            t("console.settings.impersonate.errors.spawnFailed", undefined, "Could not spawn sandbox user."),
        );
        return;
      }
      setCreds(json.data as SpawnedCreds);
    } catch {
      setError(
        t("console.settings.impersonate.errors.networkSpawn", undefined, "Network error spawning sandbox user."),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="surface p-6 space-y-4">
      <div>
        <h2 className="hed-lg">{t("console.settings.impersonate.spawn.heading", undefined, "Spawn sandbox user")}</h2>
        <p className="text-sm">
          {t(
            "console.settings.impersonate.spawn.description",
            undefined,
            "Creates a throwaway account in the named org with the chosen role and persona.",
          )}
        </p>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="eyebrow">{t("console.settings.impersonate.spawn.fields.orgSlug", undefined, "Org slug")}</span>
          <input className="ps-input" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="eyebrow">
            {t("console.settings.impersonate.spawn.fields.displayName", undefined, "Display name")}
          </span>
          <input
            className="ps-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("console.settings.impersonate.spawn.placeholders.displayName", undefined, "Optional")}
          />
        </label>
        <label className="space-y-1">
          <span className="eyebrow">{t("console.settings.impersonate.spawn.fields.role", undefined, "Role")}</span>
          <select className="ps-input" value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="eyebrow">{t("console.settings.impersonate.spawn.fields.persona", undefined, "Persona")}</span>
          <select className="ps-input" value={persona} onChange={(e) => setPersona(e.target.value)}>
            {personas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex justify-end">
        <Button onClick={spawn} loading={pending}>
          {t("console.settings.impersonate.spawn.submit", undefined, "Spawn")}
        </Button>
      </div>

      {creds && (
        <Alert kind="success">
          <div className="space-y-2">
            <div className="font-medium">
              {t("console.settings.impersonate.spawn.created", undefined, "Sandbox user created.")}
            </div>
            <dl className="grid gap-1 text-sm" style={{ gridTemplateColumns: "auto 1fr" }}>
              <dt className="eyebrow">{t("console.settings.impersonate.spawn.email", undefined, "Email")}</dt>
              <dd>
                <code>{creds.email}</code>
              </dd>
              <dt className="eyebrow">{t("console.settings.impersonate.spawn.password", undefined, "Password")}</dt>
              <dd>
                <code>{creds.password}</code>
              </dd>
            </dl>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onActAs(creds.userId)}>
              {t("console.settings.impersonate.spawn.actAsThisUser", undefined, "Act as this user")}
            </Button>
          </div>
        </Alert>
      )}
    </section>
  );
}
