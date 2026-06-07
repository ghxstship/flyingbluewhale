"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";

export type RegisteredAction = {
  type: string;
  label: string;
  description: string;
};

export function AddStepMenu({
  registeredActions,
  onAdd,
  variant = "ghost",
}: {
  registeredActions: RegisteredAction[];
  onAdd: (type: string) => void;
  variant?: "ghost" | "secondary" | "primary";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size="sm">
          <Plus size={14} aria-hidden="true" />
          <span className="ms-1">Add Step</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 p-1">
        <div className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-[var(--p-text-2)]">ACTIONS</div>
        <ul className="grid gap-0.5">
          {registeredActions.length === 0 && (
            <li className="px-2 py-2 text-xs text-[var(--p-text-2)]">No actions registered.</li>
          )}
          {registeredActions.map((a) => (
            <li key={a.type}>
              <button
                type="button"
                onClick={() => {
                  onAdd(a.type);
                  setOpen(false);
                }}
                className="w-full rounded-md px-2 py-1.5 text-start transition-colors hover:bg-[var(--p-surface-2)]"
              >
                <div className="text-sm font-medium text-[var(--p-text-1)]">{a.label}</div>
                <div className="text-[11px] text-[var(--p-text-2)]">{a.description}</div>
                <div className="mt-0.5 font-mono text-[10px] text-[var(--p-text-2)]">{a.type}</div>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
