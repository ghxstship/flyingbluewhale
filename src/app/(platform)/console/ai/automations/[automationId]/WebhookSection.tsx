"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { generateWebhookSecretAction, type State } from "./actions";

/**
 * Inbound-webhook configuration block — Phase 4.3.
 *
 * Renders the public webhook URL (always derivable from the automation id)
 * and a "Generate Secret" button that rotates `automations.webhook_secret`.
 * The secret is intentionally NOT echoed back to the UI after generation —
 * we display a "Secret set" / "No secret configured" hint and let the user
 * regenerate if they lose it. A rotation invalidates the previous value
 * by definition; upstream callers must update their HMAC keying.
 */
export function WebhookSection({
  automationId,
  webhookUrl,
  hasSecret,
}: {
  automationId: string;
  webhookUrl: string;
  hasSecret: boolean;
}) {
  const [state, formAction] = useActionState<State, FormData>(
    generateWebhookSecretAction.bind(null, automationId),
    null,
  );
  const [pending, startTransition] = useTransition();
  const t = useT();

  return (
    <section className="surface p-4">
      <h3 className="text-sm font-semibold">
        {t("console.ai.automations.webhook.title", undefined, "Inbound Webhook")}
      </h3>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "console.ai.automations.webhook.descriptionPrefix",
          undefined,
          "POST a JSON body to this URL to trigger the automation. Sign the body with HMAC-SHA256 of your secret in",
        )}{" "}
        <code className="font-mono">X-Signature: sha256=&lt;hex&gt;</code>.
      </p>

      <div className="mt-3 space-y-2">
        <label className="block text-xs font-medium text-[var(--p-text-2)]">
          {t("console.ai.automations.webhook.urlLabel", undefined, "Webhook URL")}
        </label>
        <code className="block rounded bg-[var(--p-surface)] p-3 font-mono text-xs break-all">{webhookUrl}</code>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs text-[var(--p-text-2)]">
          {hasSecret
            ? t("console.ai.automations.webhook.secretConfigured", undefined, "Secret configured")
            : t(
                "console.ai.automations.webhook.noSecretConfigured",
                undefined,
                "No Secret Configured — Unsigned Posts Accepted",
              )}
        </span>
        <form
          action={(fd) => {
            startTransition(() => {
              formAction(fd);
            });
          }}
        >
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {hasSecret
              ? t("console.ai.automations.webhook.rotateSecret", undefined, "Rotate Secret")
              : t("console.ai.automations.webhook.generateSecret", undefined, "Generate Secret")}
          </Button>
        </form>
      </div>

      {state?.error && <p className="mt-2 text-xs text-[var(--accent-error)]">{state.error}</p>}
      {state?.ok && (
        <p className="mt-2 text-xs text-[var(--accent-success)]">
          {t(
            "console.ai.automations.webhook.rotatedSuccess",
            undefined,
            "Secret rotated. The new value is stored server-side; reload to confirm.",
          )}
        </p>
      )}
    </section>
  );
}
