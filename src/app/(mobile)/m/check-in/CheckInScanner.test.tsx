import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckInScanner, type CheckInLabels } from "./CheckInScanner";

/**
 * Guards the Phase 0/1 behavior of the field scan surface
 * (docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md §0, §1.3, §1.5, §1.6).
 *
 * The scanner is mocked: mounting the real one calls getUserMedia, which jsdom
 * has no camera for. What matters here is the surface contract — which modes
 * exist, which symbologies each mode asks for, and that the manual input stays
 * wedge-ready — not the decode loop.
 */
const scannerProps = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }));

vi.mock("@/components/scanners", () => ({
  GatedCameraScanner: (props: Record<string, unknown>) => {
    scannerProps.current = props;
    return <div data-testid="scanner" />;
  },
  useScanSubmit: () => ({ submit: vi.fn(), pending: false, outcome: null }),
}));

const labels: CheckInLabels = {
  eyebrow: "Field",
  title: "Scan",
  access: "Access",
  asset: "Asset",
  pos: "POS",
  qr: "QR",
  scanHintCamera: "Point at a code",
  scanHintAccess: "Point at a credential",
  ctaAccess: "Check In",
  ctaAsset: "Check Out",
  ctaPos: "Look Up",
  manual: "Manual",
  manualLabel: "Code",
  manualPlaceholder: "e.g. R7-014",
  batch: "Batch",
  scanning: "Scanning…",
  recentTitle: "Recent",
  recentEmpty: "No scans yet",
  logged: "Logged",
};

const renderScanner = () => render(<CheckInScanner recent={[]} labels={labels} />);

describe("CheckInScanner — mode surface", () => {
  it("offers exactly Access / Asset / POS", () => {
    renderScanner();
    expect(screen.getByRole("button", { name: "Access" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Asset" })).toBeDefined();
    expect(screen.getByRole("button", { name: "POS" })).toBeDefined();
  });

  it("has NO NFC mode — it read nothing and cannot work in the Capacitor shell (§1.5)", () => {
    renderScanner();
    expect(screen.queryByRole("button", { name: /nfc/i })).toBeNull();
    // The decorative pulse rings must be gone with it.
    expect(document.querySelector(".nfcframe")).toBeNull();
    expect(document.querySelector(".nfc-ring")).toBeNull();
  });
});

describe("CheckInScanner — per-mode symbologies (§1.3)", () => {
  it("access mode requests credential formats and NO retail 1D", () => {
    renderScanner(); // defaults to access
    const formats = scannerProps.current?.formats as string[];
    expect(formats).toContain("qr_code");
    expect(formats).toContain("pdf417"); // licences + event tickets
    expect(formats).toContain("aztec"); // transit/ticketing standard
    // The load-bearing assertion: a gate must never decode a grocery item.
    expect(formats).not.toContain("ean_13");
    expect(formats).not.toContain("upc_a");
    expect(formats).not.toContain("itf");
  });
});

describe("CheckInScanner — alias presets (kit 29 §C)", () => {
  it("initialMode='asset' opens on the Asset segment with asset symbologies", () => {
    render(<CheckInScanner recent={[]} labels={labels} initialMode="asset" />);
    // The Inventory preset (/m/inventory/scan, /m/check-in?mode=inventory)
    // is a PRESET, not a lock — the segment is selected, not removed.
    expect(screen.getByRole("button", { name: "Asset" }).className).toContain("on");
    const formats = scannerProps.current?.formats as string[];
    expect(formats).toContain("code_39"); // industrial asset tagging
    expect(formats).not.toContain("pdf417"); // not the credential set
  });
});

describe("CheckInScanner — HID keyboard-wedge (§1.6)", () => {
  it("auto-focuses the manual input so a Bluetooth sled can type into it", () => {
    renderScanner();
    // No phone reads UHF RFID. A sled in HID mode types the EPC into whatever
    // has focus — so the focused input IS the RFID integration.
    expect(document.activeElement).toBe(screen.getByLabelText("Code"));
  });
});
