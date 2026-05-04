import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Each test reloads the module so the SUBDOMAINS_ENABLED snapshot
// (read at import time) reflects the env var we set in beforeEach.
async function loadUrls(opts: { subdomains: boolean; appUrl?: string }) {
  vi.resetModules();
  if (opts.subdomains) {
    process.env.NEXT_PUBLIC_USE_SUBDOMAINS = "1";
  } else {
    delete process.env.NEXT_PUBLIC_USE_SUBDOMAINS;
  }
  if (opts.appUrl !== undefined) {
    process.env.NEXT_PUBLIC_APP_URL = opts.appUrl;
  } else {
    delete process.env.NEXT_PUBLIC_APP_URL;
  }
  return await import("./urls");
}

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("urlFor — subdomain mode", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_SUBDOMAINS = "1";
    process.env.NEXT_PUBLIC_APP_URL = "https://lytehaus.tech";
  });

  it("marketing/auth/personal stay on apex", async () => {
    const { urlFor } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(urlFor("marketing", "/pricing")).toBe("https://lytehaus.tech/pricing");
    expect(urlFor("auth", "/login")).toBe("https://lytehaus.tech/login");
    expect(urlFor("personal", "/me")).toBe("https://lytehaus.tech/me");
  });

  it("platform → atlvs subdomain, no /console prefix in user URL", async () => {
    const { urlFor } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(urlFor("platform", "/projects/abc")).toBe("https://atlvs.lytehaus.tech/projects/abc");
    expect(urlFor("platform")).toBe("https://atlvs.lytehaus.tech");
  });

  it("portal → gvteway subdomain, slug stays in path", async () => {
    const { urlFor } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(urlFor("portal", "/mmw26-hialeah/guide")).toBe("https://gvteway.lytehaus.tech/mmw26-hialeah/guide");
  });

  it("mobile → compvss subdomain", async () => {
    const { urlFor } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(urlFor("mobile", "/scan")).toBe("https://compvss.lytehaus.tech/scan");
  });

  it("normalizes path with or without leading slash", async () => {
    const { urlFor } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(urlFor("platform", "projects")).toBe("https://atlvs.lytehaus.tech/projects");
    expect(urlFor("platform", "/projects")).toBe("https://atlvs.lytehaus.tech/projects");
  });
});

describe("urlFor — path-prefix fallback", () => {
  it("preserves shell prefix in path when subdomains disabled", async () => {
    const { urlFor } = await loadUrls({ subdomains: false, appUrl: "https://preview-x.vercel.app" });
    expect(urlFor("platform", "/projects/abc")).toBe("https://preview-x.vercel.app/console/projects/abc");
    expect(urlFor("portal", "/mmw26/guide")).toBe("https://preview-x.vercel.app/p/mmw26/guide");
    expect(urlFor("mobile", "/scan")).toBe("https://preview-x.vercel.app/m/scan");
    expect(urlFor("auth", "/login")).toBe("https://preview-x.vercel.app/login");
  });
});

describe("shellForHost", () => {
  it("apex and www → marketing", async () => {
    const { shellForHost } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(shellForHost("lytehaus.tech")).toEqual({ shell: "marketing", tenantSlug: null });
    expect(shellForHost("www.lytehaus.tech")).toEqual({ shell: "marketing", tenantSlug: null });
  });

  it("each app subdomain maps to its shell", async () => {
    const { shellForHost } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(shellForHost("atlvs.lytehaus.tech").shell).toBe("platform");
    expect(shellForHost("gvteway.lytehaus.tech").shell).toBe("portal");
    expect(shellForHost("compvss.lytehaus.tech").shell).toBe("mobile");
  });

  it("strips port + handles dev (lvh.me)", async () => {
    const { shellForHost } = await loadUrls({ subdomains: true, appUrl: "http://lvh.me:3000" });
    expect(shellForHost("atlvs.lvh.me:3000").shell).toBe("platform");
    expect(shellForHost("lvh.me:3000").shell).toBe("marketing");
  });

  it("unknown subdomain falls back to marketing", async () => {
    const { shellForHost } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(shellForHost("foo.lytehaus.tech").shell).toBe("marketing");
  });

  it("hosts outside the apex fall back to marketing (preview deploys, custom domains)", async () => {
    const { shellForHost } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(shellForHost("preview-x.vercel.app").shell).toBe("marketing");
  });
});

describe("internalPathFor", () => {
  it("prefixes shell path when not already prefixed", async () => {
    const { internalPathFor } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(internalPathFor("platform", "/projects/abc")).toBe("/console/projects/abc");
    expect(internalPathFor("portal", "/mmw26")).toBe("/p/mmw26");
    expect(internalPathFor("mobile", "/scan")).toBe("/m/scan");
  });

  it("is idempotent — already-prefixed paths pass through", async () => {
    const { internalPathFor } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(internalPathFor("platform", "/console/projects")).toBe("/console/projects");
  });

  it("handles root path (/)", async () => {
    const { internalPathFor } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(internalPathFor("platform", "/")).toBe("/console");
    expect(internalPathFor("marketing", "/")).toBe("/");
  });
});

describe("shellFromResolved", () => {
  it("maps the auth.resolveShell return values to Shell", async () => {
    const { shellFromResolved } = await loadUrls({ subdomains: true, appUrl: "https://lytehaus.tech" });
    expect(shellFromResolved("/console")).toBe("platform");
    expect(shellFromResolved("/p")).toBe("portal");
    expect(shellFromResolved("/m")).toBe("mobile");
    expect(shellFromResolved("/me")).toBe("personal");
  });
});
