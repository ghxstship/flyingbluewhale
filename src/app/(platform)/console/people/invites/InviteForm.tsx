"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createInviteAction } from "./actions";

const ROLES: { value: "admin" | "manager" | "member"; label: string }[] = [
  { value: "admin", label: "Admin — full org control except billing" },
  { value: "manager", label: "Manager — projects + people, no billing" },
  { value: "member", label: "Member — access via per-project membership" },
];

export function InviteForm() {
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
      <p className="text-xs text-[var(--text-muted)]">
        Project-level access is granted on each project after they accept. Owner role is reserved for org transfer.
      </p>
    </FormShell>
  );
}
