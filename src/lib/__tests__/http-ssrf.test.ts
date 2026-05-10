import { describe, it, expect } from "vitest";
import { isBlockedIp, validateOutboundUrl } from "@/lib/http-ssrf";

describe("http-ssrf — IP block list", () => {
  it("blocks IPv4 loopback / link-local / RFC1918 / metadata", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("127.99.1.1")).toBe(true);
    expect(isBlockedIp("10.0.0.1")).toBe(true);
    expect(isBlockedIp("172.16.0.1")).toBe(true);
    expect(isBlockedIp("172.31.255.255")).toBe(true);
    expect(isBlockedIp("192.168.0.1")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true); // AWS metadata
    expect(isBlockedIp("0.0.0.0")).toBe(true);
    expect(isBlockedIp("224.0.0.1")).toBe(true); // multicast
    expect(isBlockedIp("255.255.255.255")).toBe(true);
  });

  it("blocks IPv6 loopback / link-local / ULA / multicast / IPv4-mapped private", () => {
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("::")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
    expect(isBlockedIp("fc00::1")).toBe(true);
    expect(isBlockedIp("fd12:3456::1")).toBe(true);
    expect(isBlockedIp("ff02::1")).toBe(true);
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true); // v4-mapped loopback
    expect(isBlockedIp("::ffff:10.0.0.1")).toBe(true); // v4-mapped RFC1918
  });

  it("allows public IPv4 / IPv6", () => {
    expect(isBlockedIp("8.8.8.8")).toBe(false); // Google DNS
    expect(isBlockedIp("1.1.1.1")).toBe(false); // Cloudflare DNS
    expect(isBlockedIp("172.15.0.1")).toBe(false); // outside RFC1918 172.16-31 range
    expect(isBlockedIp("172.32.0.1")).toBe(false); // also outside
    expect(isBlockedIp("2606:4700::1")).toBe(false); // Cloudflare v6
    expect(isBlockedIp("2001:4860:4860::8888")).toBe(false); // Google DNS v6
  });

  it("treats invalid IPs as blocked", () => {
    expect(isBlockedIp("")).toBe(true);
    expect(isBlockedIp("not-an-ip")).toBe(true);
    expect(isBlockedIp("999.999.999.999")).toBe(true);
  });
});

describe("http-ssrf — validateOutboundUrl", () => {
  it("rejects non-http(s) protocols", async () => {
    const ftp = await validateOutboundUrl("ftp://example.com");
    expect(ftp.ok).toBe(false);
    if (!ftp.ok) expect(ftp.reason).toMatch(/Protocol/);

    const file = await validateOutboundUrl("file:///etc/passwd");
    expect(file.ok).toBe(false);

    const gopher = await validateOutboundUrl("gopher://example.com");
    expect(gopher.ok).toBe(false);
  });

  it("rejects literal blocked IPs without hitting DNS", async () => {
    const aws = await validateOutboundUrl("http://169.254.169.254/latest/meta-data/");
    expect(aws.ok).toBe(false);
    if (!aws.ok) expect(aws.reason).toMatch(/169\.254\.169\.254/);

    const local = await validateOutboundUrl("http://127.0.0.1:8080/admin");
    expect(local.ok).toBe(false);

    const rfc1918 = await validateOutboundUrl("https://10.0.0.1/");
    expect(rfc1918.ok).toBe(false);

    const v6loop = await validateOutboundUrl("http://[::1]:9000/");
    expect(v6loop.ok).toBe(false);
  });

  it("rejects malformed URLs", async () => {
    const bad = await validateOutboundUrl("not a url");
    expect(bad.ok).toBe(false);
  });
});
