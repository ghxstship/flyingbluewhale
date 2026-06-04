"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
// The /[teamId]/actions module exports createTeamAction even though it lives
// under the dynamic segment — this keeps every team-related action colocated.
import { createTeamAction } from "./[teamId]/actions";

export function CreateTeamForm() {
  const t = useT();
  return (
    <FormShell
      action={createTeamAction}
      submitLabel={t("console.people.teams.create.submit", undefined, "Create Team")}
    >
      <Input
        label={t("console.people.teams.create.slugLabel", undefined, "Slug")}
        name="slug"
        required
        autoComplete="off"
        placeholder="prod"
        hint={t(
          "console.people.teams.create.slugHint",
          undefined,
          "Becomes @team-<slug>. Lowercase letters, digits, hyphens only.",
        )}
      />
      <Input
        label={t("console.people.teams.create.nameLabel", undefined, "Name")}
        name="name"
        required
        autoComplete="off"
        placeholder="Production"
      />
      <Input
        label={t("console.people.teams.create.descriptionLabel", undefined, "Description")}
        name="description"
        autoComplete="off"
        placeholder={t(
          "console.people.teams.create.descriptionPlaceholder",
          undefined,
          "What this team is responsible for",
        )}
      />
    </FormShell>
  );
}
