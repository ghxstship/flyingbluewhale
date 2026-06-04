"use client";
import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createInviteAction } from "./actions";
import { PROJECT_ROLES, type ProjectRole } from "@/lib/supabase/types";

const ROLES: { value: "admin" | "manager" | "member"; label: string }[] = [
  { value: "admin", label: "Admin — full org control except billing" },
  { value: "manager", label: "Manager — projects + people, no billing" },
  { value: "member", label: "Member — access via per-project membership" },
];

export type ProjectOption = { id: string; name: string };

export function InviteForm({ projects }: { projects: ProjectOption[] }) {
  const [projectId, setProjectId] = useState<string>("");
  const isProjectScoped = projectId !== "";

  return (
    <FormShell action={createInviteAction} cancelHref="/console/people/invites" submitLabel="Send Invite">
      <Input label="Email" name="email" type="email" required autoComplete="off" />
      <label className="block text-xs font-medium">
        <span className="mb-1 block">Platform role</span>
        <select name="role" defaultValue="member" className="input-base focus-ring w-full" required>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium">
        <span className="mb-1 block">Scope to a project (optional)</span>
        <select
          name="projectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="input-base focus-ring w-full"
        >
          <option value="">— Org-wide invite —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {isProjectScoped && (
        <label className="block text-xs font-medium">
          <span className="mb-1 block">Project role</span>
          <select name="projectRole" defaultValue="contributor" className="input-base focus-ring w-full" required>
            {PROJECT_ROLES.map((r: ProjectRole) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        {isProjectScoped
          ? "When they accept, they'll join the org as a member AND get the selected project role. Use this for external collaborators (vendors, clients, talent) who only need access to one project."
          : "Project-level access is granted on each project after they accept. Owner role is reserved for org transfer."}
      </p>
    </FormShell>
  );
}
