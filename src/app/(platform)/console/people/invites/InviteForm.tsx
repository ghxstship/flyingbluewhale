"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createInviteAction } from "./actions";

const ROLES = [
  { value: "admin", label: "Admin — full org control" },
  { value: "controller", label: "Controller — finance + ops" },
  { value: "collaborator", label: "Collaborator — read/write ops" },
  { value: "contractor", label: "Contractor — scoped access" },
  { value: "crew", label: "Crew — field / mobile" },
  { value: "client", label: "Client — external portal" },
  { value: "viewer", label: "Viewer — read only" },
  { value: "community", label: "Community — minimal" },
];

export function InviteForm() {
  return (
    <FormShell
      action={createInviteAction}
      cancelHref="/console/people/invites"
      submitLabel="Send invite"
    >
      <Input label="Email" name="email" type="email" required autoComplete="off" />
      <label className="block text-xs font-medium">
        <span className="mb-1 block">Role</span>
        <select
          name="role"
          defaultValue="collaborator"
          className="input-base focus-ring w-full"
          required
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
    </FormShell>
  );
}
