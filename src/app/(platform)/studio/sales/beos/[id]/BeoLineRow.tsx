"use client";

import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/i18n/format";
import { lineTotalCents, type BeoLineItem } from "@/lib/beos";
import { deleteBeoLineAction } from "../actions";

import { useActionErrorResolver } from "@/lib/errors-client";
export function BeoLineRow({ line, beoId }: { line: BeoLineItem; beoId: string }) {
  const [pending, start] = useTransition();
  const resolveErr = useActionErrorResolver();
  return (
    <tr>
      <td>
        <div className="font-medium">{line.name}</div>
        {line.description && <div className="text-xs text-[var(--p-text-2)]">{line.description}</div>}
      </td>
      <td className="num">{line.quantity}</td>
      <td className="num">{formatMoney(line.unit_price_cents)}</td>
      <td className="num">{formatMoney(lineTotalCents(line))}</td>
      <td className="text-right">
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await deleteBeoLineAction(line.id, beoId);
              if (res?.error) toast.error(resolveErr(res.error));
              else toast.success("Line removed");
            })
          }
        >
          Remove
        </Button>
      </td>
    </tr>
  );
}
