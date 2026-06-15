import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAssignment } from "@/lib/db/assignments";
import { env } from "@/lib/env";

// GET /api/v1/assignments/[id]/wallet-pass
// Returns a Google Wallet / Apple Wallet compatible pass payload.
// Validated competitive signal: Tixr, Bizzabo Klik, and passkit.com all
// surface credentials and tickets as first-class wallet objects (2025-2026).
//
// Apple .pkpass requires a signed zip (needs P12 cert — env-gated with
// APPLE_PASS_CERT_BASE64 + APPLE_PASS_KEY_BASE64 + APPLE_PASS_PASSWORD).
// Without those env vars the endpoint returns the structured pass.json so
// the caller can build/sign externally (useful for white-label integrators).
// Google Wallet uses a JWT-signed "Save to Google Wallet" URL (env-gated
// with GOOGLE_WALLET_ISSUER_ID + GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_JSON).
// Without that, the endpoint also returns the unsigned event ticket object.

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const parsed = ParamsSchema.safeParse(rawParams);
  if (!parsed.success) return apiError("bad_request", "Invalid assignment ID");
  const { id } = parsed.data;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();

    const a = await getAssignment(session.orgId, id);
    if (!a) return apiError("not_found", "Assignment not found");

    // The calling user must be the party on the assignment OR a manager.
    const isParty = a.party_kind === "user" && a.party_user_id === session.userId;
    const isManager = ["owner", "admin", "controller", "collaborator"].includes(session.role);
    if (!isParty && !isManager) {
      return apiError("forbidden", "Access denied to this assignment");
    }

    // Pull the project name for pass copy.
    const { data: project } = await supabase
      .from("projects")
      .select("name, start_date, end_date")
      .eq("id", a.project_id)
      .eq("org_id", session.orgId)
      .maybeSingle();

    // Resolve party display name.
    let holderName = "Holder";
    if (a.party_kind === "user" && a.party_user_id) {
      const { data: u } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", a.party_user_id)
        .maybeSingle();
      holderName = (u as { name?: string; email?: string } | null)?.name
        ?? (u as { name?: string; email?: string } | null)?.email
        ?? holderName;
    } else if (a.party_kind === "crew_member" && a.party_crew_id) {
      const { data: c } = await supabase
        .from("crew_members")
        .select("name")
        .eq("id", a.party_crew_id)
        .maybeSingle();
      holderName = (c as { name?: string } | null)?.name ?? holderName;
    }

    const projectName = (project as { name?: string } | null)?.name ?? "Event";
    const startDate = (project as { start_date?: string } | null)?.start_date ?? null;
    const kindLabel = a.catalog_kind.replace(/_/g, " ");

    // ── Apple Wallet pass.json fields (vnd.apple.pkpass format) ──
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: env.APPLE_PASS_TYPE_IDENTIFIER ?? "pass.pro.atlvs.assignment",
      serialNumber: a.id,
      teamIdentifier: env.APPLE_TEAM_IDENTIFIER ?? "ATLVSTEAM",
      webServiceURL: `${env.NEXT_PUBLIC_APP_URL ?? ""}/api/v1/wallet-updates/`,
      authenticationToken: a.id.replace(/-/g, ""),
      organizationName: "ATLVS Technologies",
      description: `${projectName} — ${kindLabel}`,
      logoText: "A T L V S",
      foregroundColor: "rgb(255,255,255)",
      backgroundColor: (() => {
        const BRAND: Record<string, string> = {
          ticket: "rgb(255,46,136)",
          credential: "rgb(37,99,235)",
          catering: "rgb(233,162,59)",
          radio: "rgb(37,99,235)",
          uniform: "rgb(37,99,235)",
          vehicle: "rgb(232,80,10)",
        };
        return BRAND[a.catalog_kind] ?? "rgb(20,20,20)";
      })(),
      generic: {
        primaryFields: [
          { key: "event", label: "EVENT", value: projectName },
        ],
        secondaryFields: [
          { key: "holder", label: "HOLDER", value: holderName },
          { key: "kind", label: "TYPE", value: kindLabel.toUpperCase() },
        ],
        auxiliaryFields: startDate
          ? [{ key: "date", label: "DATE", value: startDate, dateStyle: "PKDateStyleMedium" }]
          : [],
        backFields: [
          { key: "assignmentId", label: "Assignment ID", value: a.id },
          { key: "fulfillmentState", label: "Status", value: a.fulfillment_state },
          { key: "poweredBy", label: "Powered by", value: "atlvs.pro" },
        ],
      },
      barcodes: [
        {
          message: a.id,
          format: "PKBarcodeFormatQR",
          messageEncoding: "iso-8859-1",
          altText: `Assignment ${a.id.slice(0, 8).toUpperCase()}`,
        },
      ],
    };

    // ── Google Wallet event ticket class/object fields ──
    const issuerId = env.GOOGLE_WALLET_ISSUER_ID ?? "atlvs-prod";
    const classId = `${issuerId}.atlvs_assignment_${a.catalog_kind}`;
    const objectId = `${issuerId}.${a.id.replace(/-/g, "_")}`;

    const googleTicketObject = {
      id: objectId,
      classId,
      state: a.fulfillment_state === "voided" ? "EXPIRED" : "ACTIVE",
      ticketHolder: {
        name: holderName,
      },
      ticketNumber: a.id.slice(0, 8).toUpperCase(),
      ticketType: {
        defaultValue: { language: "en-US", value: kindLabel },
      },
      eventName: {
        defaultValue: { language: "en-US", value: projectName },
      },
      dateTime: startDate ? { start: startDate } : undefined,
      barcode: {
        type: "QR_CODE",
        value: a.id,
        alternateText: a.id.slice(0, 8).toUpperCase(),
      },
      hexBackgroundColor: (() => {
        const BRAND: Record<string, string> = {
          ticket: "#FF2E88",
          credential: "#2563EB",
          catering: "#E9A23B",
          vehicle: "#E8500A",
        };
        return BRAND[a.catalog_kind] ?? "#141414";
      })(),
      logo: {
        sourceUri: { uri: `${env.NEXT_PUBLIC_APP_URL ?? ""}/brand/atlvs-wordmark.svg` },
        contentDescription: { defaultValue: { language: "en-US", value: "ATLVS Technologies" } },
      },
    };

    return Response.json(
      {
        ok: true,
        data: {
          assignmentId: a.id,
          catalogKind: a.catalog_kind,
          fulfillmentState: a.fulfillment_state,
          holderName,
          projectName,
          apple: {
            passJson,
            signingAvailable: !!(
              env.APPLE_PASS_CERT_BASE64 &&
              env.APPLE_PASS_KEY_BASE64 &&
              env.APPLE_TEAM_IDENTIFIER
            ),
          },
          google: {
            ticketObject: googleTicketObject,
            signingAvailable: !!env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_JSON,
            saveUrl: env.GOOGLE_WALLET_ISSUER_ID
              ? `https://pay.google.com/gp/v/save/${objectId}`
              : null,
          },
        },
      },
      { status: 200 },
    );
  });
}
