import { ModuleHeader } from "@/components/Shell";
import { CopilotPanel } from "@/components/ai/CopilotPanel";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";

// Auth-gated; the panel calls the AI endpoint client-side per question.
export const dynamic = "force-dynamic";

/**
 * Copilot — the v7.7 grounded answer surface. Distinct from /studio/assistant
 * (free chat): the Copilot answers only from the org's indexed corpus and shows
 * its real source citations + a confidence grade.
 */
export default async function CopilotPage() {
  const { t } = await getRequestT();
  await requireSession();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.copilot.eyebrow", undefined, "Workspace")}
        title={t("console.copilot.title", undefined, "Copilot")}
        subtitle={t(
          "console.copilot.subtitle",
          undefined,
          "Ask a question; get a grounded answer with citations from your workspace",
        )}
      />
      <div className="page-content">
        <CopilotPanel
          labels={{
            placeholder: t("console.copilot.placeholder", undefined, "Ask about your projects, documents, or data..."),
            ask: t("console.copilot.ask", undefined, "Ask"),
            asking: t("console.copilot.asking", undefined, "Thinking..."),
            confidence: t("console.copilot.confidence", undefined, "Confidence"),
            sources: t("console.copilot.sources", undefined, "Sources"),
            ungrounded: t("console.copilot.ungrounded", undefined, "No indexed sources matched"),
            error: t("console.copilot.error", undefined, "Something went wrong. Try again."),
          }}
        />
      </div>
    </>
  );
}
