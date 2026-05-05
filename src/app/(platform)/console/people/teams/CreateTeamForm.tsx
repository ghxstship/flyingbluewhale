"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
// The /[teamId]/actions module exports createTeamAction even though it lives
// under the dynamic segment — this keeps every team-related action colocated.
import { createTeamAction } from "./[teamId]/actions";

export function CreateTeamForm() {
  return (
    <FormShell action={createTeamAction} submitLabel="Create Team">
      <Input
        label="Slug"
        name="slug"
        required
        autoComplete="off"
        placeholder="prod"
        hint="Becomes @team-<slug>. Lowercase letters, digits, hyphens only."
      />
      <Input label="Name" name="name" required autoComplete="off" placeholder="Production" />
      <Input
        label="Description"
        name="description"
        autoComplete="off"
        placeholder="What this team is responsible for"
      />
    </FormShell>
  );
}
