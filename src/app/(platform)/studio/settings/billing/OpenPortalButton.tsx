"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";

export function OpenPortalButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = React.useState(false);
  const toast = useToast();
  const t = useT();

  async function open() {
    setLoading(true);
    try {
      const r = await fetch("/api/v1/stripe/portal", { method: "POST" });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(
          json?.error?.message ??
            t("console.settings.billing.openPortal.errorFallback", undefined, "Could not open billing portal"),
        );
      }
      window.location.href = json.data.url;
    } catch (e) {
      toast.error(t("console.settings.billing.openPortal.errorToast", undefined, "Could not open billing portal"), {
        description: e instanceof Error ? e.message : String(e),
      });
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="primary" onClick={open} disabled={disabled || loading} loading={loading}>
      {t("console.settings.billing.openPortal.button", undefined, "Open billing portal")}
    </Button>
  );
}
