import { SITE } from "@/lib/seo";

/**
 * WebAuthn relying-party config.
 * rpID is the eTLD+1 of the deployment domain.
 */
export function getRpConfig() {
  const url = new URL(SITE.baseUrl);
  return {
    rpID: url.hostname,
    rpName: SITE.name,
    origin: SITE.baseUrl,
  };
}
