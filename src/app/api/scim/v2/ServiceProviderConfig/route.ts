import { buildServiceProviderConfig } from "@/lib/auth/scim";

// SCIM 2.0 ServiceProviderConfig — published unauthenticated per RFC 7644
// section 4. Identifies which subset of SCIM we support.
export async function GET() {
  return new Response(JSON.stringify(buildServiceProviderConfig()), {
    status: 200,
    headers: { "content-type": "application/scim+json" },
  });
}

export const dynamic = "force-static";
