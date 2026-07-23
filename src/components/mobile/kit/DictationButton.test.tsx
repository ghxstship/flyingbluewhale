import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetDictationProbe, appendTranscriptToTextarea, DictationButton } from "./DictationButton";

/**
 * T1-3 — the dictation affordance's honest state machine:
 * hidden until the server confirms transcription is configured; then
 * idle → recording (elapsed + cancel + stop) → uploading → transcript
 * delivered via onText; denial/offline produce helpful inline errors,
 * and cancel discards without ever uploading.
 */

type FetchCall = { method: string; body?: unknown; contentType?: string };

class MockMediaRecorder {
  static instances: MockMediaRecorder[] = [];
  static isTypeSupported = vi.fn(() => true);
  state: "inactive" | "recording" = "inactive";
  mimeType = "audio/webm;codecs=opus";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(
    public stream: unknown,
    public options?: unknown,
  ) {
    MockMediaRecorder.instances.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["audio-bytes"], { type: "audio/webm" }) });
    this.onstop?.();
  }
}

const stoppedTracks: number[] = [];
const fakeStream = { getTracks: () => [{ stop: () => stoppedTracks.push(1) }] };

let fetchCalls: FetchCall[];
let probeEnabled: boolean;
let postResponse: { status: number; json: unknown };
let getUserMedia: ReturnType<typeof vi.fn>;

function jsonResponse(status: number, json: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => json };
}

beforeEach(() => {
  __resetDictationProbe();
  MockMediaRecorder.instances = [];
  stoppedTracks.length = 0;
  fetchCalls = [];
  probeEnabled = true;
  postResponse = { status: 200, json: { ok: true, data: { text: "hello world" } } };

  vi.stubGlobal("MediaRecorder", MockMediaRecorder);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      fetchCalls.push({
        method,
        body: init?.body,
        contentType: (init?.headers as Record<string, string> | undefined)?.["content-type"],
      });
      if (method === "GET") return jsonResponse(200, { ok: true, data: { enabled: probeEnabled } });
      return jsonResponse(postResponse.status, postResponse.json);
    }),
  );
  getUserMedia = vi.fn(async () => fakeStream);
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia },
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderIdle(onText = vi.fn()) {
  render(<DictationButton onText={onText} />);
  // The button appears only after the feature probe resolves enabled.
  await screen.findByRole("button", { name: "Dictate" });
  return onText;
}

describe("DictationButton (T1-3)", () => {
  it("renders nothing when the server reports transcription disabled", async () => {
    probeEnabled = false;
    render(<DictationButton onText={vi.fn()} />);
    // Let the probe resolve, then confirm no mic ever appeared.
    await waitFor(() => expect(fetchCalls.filter((c) => c.method === "GET")).toHaveLength(1));
    expect(screen.queryByRole("button", { name: "Dictate" })).toBeNull();
  });

  it("records, stops, uploads, and delivers the transcript (idle → recording → uploading → idle)", async () => {
    const onText = await renderIdle();

    fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
    // Recording state: live status + cancel + stop, mic button gone.
    await screen.findByRole("button", { name: "Stop and transcribe" });
    expect(screen.getByRole("status").textContent).toContain("Recording");
    expect(screen.getByRole("status").textContent).toContain("0:00 / 2:00");
    expect(screen.getByRole("button", { name: "Cancel dictation" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Dictate" })).toBeNull();
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });

    fireEvent.click(screen.getByRole("button", { name: "Stop and transcribe" }));
    // Transcript arrives at the host and the control returns to idle.
    await waitFor(() => expect(onText).toHaveBeenCalledWith("hello world"));
    await screen.findByRole("button", { name: "Dictate" });
    // Exactly one POST, raw audio body with its MIME type; mic released.
    const posts = fetchCalls.filter((c) => c.method === "POST");
    expect(posts).toHaveLength(1);
    expect(posts[0]!.contentType).toContain("audio/");
    expect(stoppedTracks.length).toBeGreaterThan(0);
  });

  it("cancel discards the take without uploading", async () => {
    const onText = await renderIdle();
    fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel dictation" }));
    await screen.findByRole("button", { name: "Dictate" });
    expect(fetchCalls.filter((c) => c.method === "POST")).toHaveLength(0);
    expect(onText).not.toHaveBeenCalled();
    expect(stoppedTracks.length).toBeGreaterThan(0);
  });

  it("shows the helpful error state on mic denial, dismissible back to idle", async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
    await renderIdle();
    fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Microphone is blocked");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await screen.findByRole("button", { name: "Dictate" });
  });

  it("surfaces the upload failure state honestly", async () => {
    postResponse = { status: 500, json: { ok: false, error: { message: "Transcription provider returned 500" } } };
    const onText = await renderIdle();
    fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
    fireEvent.click(await screen.findByRole("button", { name: "Stop and transcribe" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Transcription provider returned 500");
    expect(onText).not.toHaveBeenCalled();
  });

  it("says plainly that dictation needs a connection when offline", async () => {
    await renderIdle();
    const onLine = Object.getOwnPropertyDescriptor(Navigator.prototype, "onLine");
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    try {
      fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toContain("needs a connection");
      expect(getUserMedia).not.toHaveBeenCalled();
    } finally {
      if (onLine) Object.defineProperty(Navigator.prototype, "onLine", onLine);
      // Remove the instance override so later tests see the prototype value.
      delete (navigator as unknown as Record<string, unknown>).onLine;
    }
  });
});

describe("appendTranscriptToTextarea", () => {
  it("appends with a single separating space and fires an input event", () => {
    document.body.innerHTML = '<textarea id="ta"></textarea>';
    const el = document.getElementById("ta") as HTMLTextAreaElement;
    const seen: string[] = [];
    el.addEventListener("input", () => seen.push(el.value));

    appendTranscriptToTextarea("ta", "first take");
    expect(el.value).toBe("first take");
    el.value = "typed text  ";
    appendTranscriptToTextarea("ta", "second take");
    expect(el.value).toBe("typed text second take");
    expect(seen).toEqual(["first take", "typed text second take"]);
  });
});
