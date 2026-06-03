"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { broadcastDmAction, type State } from "./actions";

type Person = { id: string; name: string | null; email: string };

export function BroadcastDmForm({ people }: { people: Person[] }) {
  const [state, formAction, pending] = useActionState<State, FormData>(broadcastDmAction, null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = people.filter((p) => {
    const q = search.toLowerCase();
    return (p.name ?? "").toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((p) => p.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  return (
    <form action={formAction} className="surface space-y-5 p-6">
      <input type="hidden" name="recipient_ids" value={Array.from(selected).join(",")} />

      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Message *</label>
        <textarea
          name="message"
          rows={5}
          required
          maxLength={2000}
          placeholder="Write your message here…"
          className="input-base focus-ring mt-1.5 w-full"
        />
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">Each recipient receives a private, individual thread.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            Recipients ({selected.size} selected)
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={selectAll} className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-2">
              All visible
            </button>
            <button type="button" onClick={clearAll} className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-2">
              Clear
            </button>
          </div>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name or email…"
          className="input-base focus-ring w-full text-sm"
        />
        <div className="max-h-64 overflow-y-auto rounded-md border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-[var(--text-muted)]">No people match.</p>
          ) : (
            filtered.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-[var(--surface-raised)]">
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="h-4 w-4 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name ?? "—"}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{p.email}</p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
      {state?.sent !== undefined ? (
        <Alert kind="success">Sent to {state.sent} recipient{state.sent === 1 ? "" : "s"}.</Alert>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button href="/console/comms/announcements" variant="ghost">Cancel</Button>
        <Button type="submit" disabled={pending || selected.size === 0}>
          {pending ? "Sending…" : `Send to ${selected.size} recipient${selected.size === 1 ? "" : "s"}`}
        </Button>
      </div>
    </form>
  );
}
