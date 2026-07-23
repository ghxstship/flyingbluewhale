import "server-only";

import { env, hasTranscription } from "@/lib/env";

/**
 * Provider-neutral speech-to-text — T1-3 (COMPVSS field dictation).
 *
 * Why not Anthropic: @anthropic-ai/sdk 0.104.0 has no audio input block
 * (`ContentBlockParam` carries text/image/document/tool variants only), so
 * transcription cannot ride the existing AI integration. This module speaks
 * the OpenAI `/v1/audio/transcriptions` HTTP contract instead — the de facto
 * standard shape that Groq, Fireworks, and self-hosted whisper.cpp servers
 * all implement — gated on the optional OPENAI_API_KEY env. Unset key =
 * feature off everywhere (route 503s, kit button hidden). No SDK dependency:
 * one multipart POST, mirroring the Stripe-webhook "no SDK dep" precedent.
 *
 * Re-point without code changes:
 *   TRANSCRIBE_API_URL  — alternative Whisper-compatible endpoint
 *   TRANSCRIBE_MODEL    — model name the endpoint expects (default whisper-1)
 */

const DEFAULT_URL = "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_MODEL = "whisper-1";

/** Server-side audio cap. ~2 min of opus is well under 2 MB; 10 MB absorbs
 *  the fatter iOS `audio/mp4` fallback with headroom without letting the
 *  endpoint become a free file host. The client caps duration at 120 s. */
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

/** Container extension per MIME — Whisper keys the decoder off the filename. */
const EXT_BY_MIME: Array<[string, string]> = [
  ["audio/webm", "webm"],
  ["audio/mp4", "mp4"],
  ["audio/mpeg", "mp3"],
  ["audio/ogg", "ogg"],
  ["audio/wav", "wav"],
  ["audio/x-wav", "wav"],
  ["audio/flac", "flac"],
];

export function audioExtension(mime: string): string | null {
  const base = mime.split(";")[0]!.trim().toLowerCase();
  return EXT_BY_MIME.find(([m]) => m === base)?.[1] ?? null;
}

export { hasTranscription };

/**
 * Transcribe an audio recording to text. Throws on any failure — callers
 * (the API route) translate into the canonical apiError shape.
 */
export async function transcribeAudio({
  bytes,
  mime,
}: {
  bytes: ArrayBuffer;
  mime: string;
}): Promise<string> {
  if (!hasTranscription) throw new Error("Transcription is not configured (OPENAI_API_KEY unset)");
  if (bytes.byteLength === 0) throw new Error("Empty audio payload");
  if (bytes.byteLength > MAX_AUDIO_BYTES) throw new Error("Audio payload exceeds the size cap");
  const ext = audioExtension(mime);
  if (!ext) throw new Error(`Unsupported audio type: ${mime}`);

  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mime }), `dictation.${ext}`);
  form.append("model", env.TRANSCRIBE_MODEL || DEFAULT_MODEL);
  form.append("response_format", "json");

  const res = await fetch(env.TRANSCRIBE_API_URL || DEFAULT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
    cache: "no-store",
  });

  if (!res.ok) {
    // Never forward the provider's raw body to a client — log-side detail
    // only; the route returns a generic message.
    const detail = await res.text().catch(() => "");
    console.error("[transcribe] provider error", res.status, detail.slice(0, 300));
    throw new Error(`Transcription provider returned ${res.status}`);
  }

  const json = (await res.json().catch(() => null)) as { text?: unknown } | null;
  if (!json || typeof json.text !== "string") throw new Error("Transcription provider returned no text");
  return json.text.trim();
}
