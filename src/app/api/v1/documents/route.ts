import { apiOk, apiError } from "@/lib/api";
import { withAuth, assertScope } from "@/lib/auth";
import { DOC_TEMPLATES } from "@/lib/documents/registry";
import { supportsRecordBinding } from "@/lib/documents/resolvers";

/**
 * GET /api/v1/documents
 *
 * Lists every document type the platform can generate. Each entry advertises
 * its OpenAPI schema name (`schema`) and whether it supports internal
 * record-binding (`recordBinding`) — i.e. whether `POST .../{docType}` accepts
 * a `recordId`. The full per-type data contract (JSON Schema + sample) is at
 * `GET /api/v1/documents/{docType}`.
 *
 * Read-only; gated by the `documents:read` PAT scope (cookie sessions skip
 * the scope check). This is the discovery entry point for 3rd-party
 * integrations generating ATLVS documents.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (session) => {
    const denied = assertScope(session, "documents:read");
    if (denied) return denied;
    const documents = DOC_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.title,
      app: t.app,
      schema: t.schema,
      size: t.size ?? "letter",
      recordBinding: supportsRecordBinding(t.id),
    }));
    return apiOk({ documents });
  }).catch(() => apiError("internal", "Failed to list documents"));
}
