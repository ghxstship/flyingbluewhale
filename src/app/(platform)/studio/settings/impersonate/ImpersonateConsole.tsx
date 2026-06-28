"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

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
        setError(json?.error?.message ?? "Could not start impersonation.");
        setBusyId(null);
        return;
      }
      window.location.assign("/studio");
    } catch {
      setError("Network error starting impersonation.");
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      {error && <Alert kind="error">{error}</Alert>}

      {/* ── Act as an existing user ─────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="hed-lg">Users</h2>
        <input
          type="search"
          className="ps-input"
          placeholder="Search by email, org, role, persona"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search users"
        />
        <div className="surface overflow-x-auto">
          <table className="ps-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Org</th>
                <th>Role</th>
                <th>Persona</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-sm">
                    No matching users.
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
                        {r.userId === selfUserId ? "You" : "Act as"}
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
        setError(json?.error?.message ?? "Could not spawn sandbox user.");
        return;
      }
      setCreds(json.data as SpawnedCreds);
    } catch {
      setError("Network error spawning sandbox user.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="surface p-6 space-y-4">
      <div>
        <h2 className="hed-lg">Spawn sandbox user</h2>
        <p className="text-sm">Creates a throwaway account in the named org with the chosen role and persona.</p>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="eyebrow">Org slug</span>
          <input className="ps-input" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="eyebrow">Display name</span>
          <input
            className="ps-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="space-y-1">
          <span className="eyebrow">Role</span>
          <select className="ps-input" value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="eyebrow">Persona</span>
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
          Spawn
        </Button>
      </div>

      {creds && (
        <Alert kind="success">
          <div className="space-y-2">
            <div className="font-medium">Sandbox user created.</div>
            <dl className="grid gap-1 text-sm" style={{ gridTemplateColumns: "auto 1fr" }}>
              <dt className="eyebrow">Email</dt>
              <dd>
                <code>{creds.email}</code>
              </dd>
              <dt className="eyebrow">Password</dt>
              <dd>
                <code>{creds.password}</code>
              </dd>
            </dl>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onActAs(creds.userId)}>
              Act as this user
            </Button>
          </div>
        </Alert>
      )}
    </section>
  );
}
