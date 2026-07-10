"use client";

import { useState, useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { COMPLIANCE_SCOPE_KINDS, SCOPE_KIND_LABELS } from "@/lib/xmce_engine";
import { runEngineAction } from "./actions";

export function RunEngineButton() {
  const [pending, startTransition] = useTransition();
  const [scope, setScope] = useState<(typeof COMPLIANCE_SCOPE_KINDS)[number]>("org");

  function run() {
    const fd = new FormData();
    fd.set("scope_kind", scope);
    startTransition(async () => {
      const res = await runEngineAction(null, fd);
      if (res?.error) toast.error(res.error);
      // success path redirects to the new run detail
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="run-scope">
        Run scope
      </label>
      <select
        id="run-scope"
        value={scope}
        disabled={pending}
        onChange={(e) => setScope(e.target.value as (typeof COMPLIANCE_SCOPE_KINDS)[number])}
        className="ps-input text-xs"
      >
        {COMPLIANCE_SCOPE_KINDS.map((s) => (
          <option key={s} value={s}>
            {SCOPE_KIND_LABELS[s]}
          </option>
        ))}
      </select>
      <Button type="button" onClick={run} loading={pending}>
        Run engine
      </Button>
    </div>
  );
}
