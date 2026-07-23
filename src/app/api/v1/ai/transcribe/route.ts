import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { audioExtension, hasTranscription, MAX_AUDIO_BYTES, transcribeAudio } from "@/lib/ai/transcribe";

/**
 * Speech-to-text for the COMPVSS dictation affordance (T1-3).
 *
 * POST — raw audio body (Content-Type: audio/*), size-capped, → { text }.
 * Mirrors the ai/chat idioms: rate-limit BEFORE model dispatch (transcription
 * costs real dollars), env-gate with the canonical 503, withAuth session
 * guard, per-tenant usage metering (fire-and-forget).
 *
 * GET — feature probe: { enabled }. The kit DictationButton calls this once
 * per page load and renders nothing when transcription isn't configured, so
 * an unset OPENAI_API_KEY never shows a dead mic button.
 */

export async function GET() {
  const guard = await withAuth(async () => apiOk({ enabled: hasTranscription }));
  return guard;
}

export async function POST(req: Request) {
  // Same budget family as AI chat — 30/min per user, limited before any
  // provider dispatch so a flooding client never burns transcription credit.
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:transcribe"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "Transcription rate limit reached; try again shortly");

  if (!hasTranscription) {
    return apiError("service_unavailable", "Transcription is not configured");
  }

  const mime = (req.headers.get("content-type") ?? "").toLowerCase();
  if (!audioExtension(mime)) {
    return apiError("bad_request", "Send the recording as a raw audio body (audio/webm, audio/mp4, …)");
  }

  // Cheap pre-read rejection when the client declares a length; the real
  // enforcement is on the bytes actually read.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_AUDIO_BYTES) {
    return apiError("bad_request", "Recording too large. Keep dictation under 2 minutes.");
  }

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  let bytes: ArrayBuffer;
  try {
    bytes = await req.arrayBuffer();
  } catch {
    return apiError("bad_request", "Could not read the audio body");
  }
  if (bytes.byteLength === 0) return apiError("bad_request", "Empty recording");
  if (bytes.byteLength > MAX_AUDIO_BYTES) {
    return apiError("bad_request", "Recording too large. Keep dictation under 2 minutes.");
  }

  let text: string;
  try {
    text = await transcribeAudio({ bytes, mime });
  } catch (e) {
    // Provider detail is already logged inside transcribeAudio; clients get
    // the canonical generic 500.
    return apiError("internal", e instanceof Error ? e.message : "Transcription failed");
  }

  // Meter per tenant (H3-01 pattern) — fire-and-forget, never blocks the
  // response. Bytes are the honest unit here: the provider bills on audio
  // duration but only the client knows elapsed time, and trusting a client
  // header for billing would be fiction.
  void Promise.all([
    recordUsage({
      orgId: session.orgId,
      actorId: session.userId,
      metric: "ai.request",
      quantity: 1,
      unit: "count",
      metadata: { endpoint: "ai.transcribe" },
    }),
    recordUsage({
      orgId: session.orgId,
      actorId: session.userId,
      metric: "ai.transcribe.bytes",
      quantity: bytes.byteLength,
      unit: "bytes",
      metadata: { mime },
    }),
  ]);

  return apiOk({ text });
}
