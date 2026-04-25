"use client";

import * as React from "react";
import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { addDomainAction, type State } from "./actions";

export function AddDomainForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(addDomainAction, null);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[220px] flex-1">
        <Input label="Hostname" name="hostname" placeholder="portal.example.com" required />
      </div>
      <div className="min-w-[160px]">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Purpose</label>
        <select name="purpose" defaultValue="portal" className="input-base mt-1.5 w-full">
          <option value="portal">Portal</option>
          <option value="marketing">Marketing</option>
          <option value="email">Email</option>
        </select>
      </div>
      <Button type="submit" loading={pending}>Add</Button>
      {state && "error" in state && state.error && (
        <p className="basis-full text-xs text-[var(--color-error)]">{state.error}</p>
      )}
    </form>
  );
}
