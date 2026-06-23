"use client";
import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createInviteAction } from "./actions";
import { PROJECT_ROLES, type ProjectRole } from "@/lib/supabase/types";
import { PORTAL_PERSONAS } from "@/lib/nav";
import { useT } from "@/lib/i18n/LocaleProvider";

export type ProjectOption = { id: string; name: string };

export function InviteForm({ projects }: { projects: ProjectOption[] }) {
  const t = useT();
  const [projectId, setProjectId] = useState<string>("");
  const isProjectScoped = projectId !== "";

  const ROLES: { value: "admin" | "manager" | "member"; label: string }[] = [
    {
      value: "admin",
      label: t("console.people.invites.role.admin", undefined, "Admin — full org control except billing"),
    },
    {
      value: "manager",
      label: t("console.people.invites.role.manager", undefined, "Manager — projects + people, no billing"),
    },
    {
      value: "member",
      label: t("console.people.invites.role.member", undefined, "Member — access via per-project membership"),
    },
  ];

  return (
    <FormShell
      action={createInviteAction}
      cancelHref="/studio/people/invites"
      submitLabel={t("console.people.invites.submit", undefined, "Send Invite")}
    >
      <Input
        label={t("console.people.invites.emailLabel", undefined, "Email")}
        name="email"
        type="email"
        required
        autoComplete="off"
      />
      <label className="block text-xs font-medium">
        <span className="mb-1 block">{t("console.people.invites.platformRole", undefined, "Platform role")}</span>
        <select name="role" defaultValue="member" className="ps-input focus-ring w-full" required>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium">
        <span className="mb-1 block">
          {t("console.people.invites.persona", undefined, "Portal persona · Optional")}
        </span>
        <select name="persona" defaultValue="" className="ps-input focus-ring w-full">
          <option value="">{t("console.people.invites.personaAuto", undefined, "— Derive from role —")}</option>
          {PORTAL_PERSONAS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium">
        <span className="mb-1 block">
          {t("console.people.invites.scopeProject", undefined, "Scope to a Project · Optional")}
        </span>
        <select
          name="projectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="ps-input focus-ring w-full"
        >
          <option value="">{t("console.people.invites.orgWide", undefined, "— Org-wide invite —")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {isProjectScoped && (
        <label className="block text-xs font-medium">
          <span className="mb-1 block">{t("console.people.invites.projectRole", undefined, "Project role")}</span>
          <select name="projectRole" defaultValue="contributor" className="ps-input focus-ring w-full" required>
            {PROJECT_ROLES.map((r: ProjectRole) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className="text-xs text-[var(--p-text-2)]">
        {isProjectScoped
          ? t(
              "console.people.invites.helpScoped",
              undefined,
              "When they accept, they'll join the org as a member AND get the selected project role. Use this for external collaborators (vendors, clients, talent) who only need access to one project.",
            )
          : t(
              "console.people.invites.helpOrgWide",
              undefined,
              "Project-level access is granted on each project after they accept. Owner role is reserved for org transfer.",
            )}
      </p>
    </FormShell>
  );
}
