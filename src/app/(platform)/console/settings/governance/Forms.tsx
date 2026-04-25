"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { createCommittee, createPolicy, type CommitteeState, type PolicyState } from "./actions";

export function CommitteeForm() {
  const [state, action, pending] = useActionState<CommitteeState, FormData>(createCommittee, null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (state === null) setOpen(false); }, [state]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">+ Committee</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New committee</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <Input label="Name" name="name" required maxLength={120} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Cadence</label>
            <select name="cadence" defaultValue="monthly" className="input-base mt-1.5 w-full">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="ad_hoc">Ad hoc</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Charter</label>
            <textarea
              name="charter"
              rows={3}
              maxLength={2000}
              className="input-base mt-1.5 w-full"
            />
          </div>
          {state?.error && <p className="text-xs text-[var(--color-error)]">{state.error}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={pending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PolicyForm() {
  const [state, action, pending] = useActionState<PolicyState, FormData>(createPolicy, null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (state === null) setOpen(false); }, [state]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">+ Policy</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New policy</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <Input label="Name" name="name" required maxLength={160} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Category</label>
            <select name="category" defaultValue="operations" className="input-base mt-1.5 w-full">
              <option value="finance">Finance</option>
              <option value="safety">Safety</option>
              <option value="hr">HR</option>
              <option value="data">Data</option>
              <option value="operations">Operations</option>
            </select>
          </div>
          {state?.error && <p className="text-xs text-[var(--color-error)]">{state.error}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={pending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
