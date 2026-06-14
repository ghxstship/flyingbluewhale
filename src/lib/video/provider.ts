import "server-only";

import { env, hasVideoProvider } from "@/lib/env";
import type { VideoParticipantRole } from "@/lib/video";

/**
 * F6 — Video huddle provider adapter.
 *
 * The platform ships NO heavy WebRTC client dependency. Instead, this
 * adapter is the single seam between the huddle UI and whatever real-time
 * media provider an operator wires up (Daily, LiveKit, 100ms, Twilio,
 * Agora, …). The schema (video_calls + video_call_participants) tracks
 * call lifecycle and presence; this adapter mints the short-lived join
 * credential the browser SDK needs.
 *
 * Provider-agnostic by design: point VIDEO_PROVIDER_URL + VIDEO_PROVIDER_KEY
 * at any token-minting endpoint that accepts a room + identity and returns a
 * join token. When the env is unset, `getVideoProvider()` returns null and
 * the UI renders a "configure a provider" state instead of a broken join —
 * live media activates the moment both vars are set, no code change.
 */

export type JoinTokenRequest = {
  /** Stable provider room identifier (video_calls.room_name). */
  roomName: string;
  /** The joining user's id — becomes the participant identity. */
  identity: string;
  /** Display name shown in the remote SDK's roster. */
  displayName?: string;
  /** host gets moderation capability; participant is a normal attendee. */
  role: VideoParticipantRole;
};

export type JoinToken = {
  /** The minted join token the browser SDK presents to the provider. */
  token: string;
  /** The provider's join URL/base the SDK connects to. */
  url: string;
  /** The room the token is scoped to (echoes roomName). */
  roomName: string;
  /** Unix-epoch ms expiry, when the provider returns one. */
  expiresAt?: number;
};

export interface VideoProvider {
  /** Human label for the configured provider (for diagnostics/UI). */
  readonly name: string;
  /** Mint a short-lived join token scoped to a room + identity + role. */
  mintJoinToken(req: JoinTokenRequest): Promise<JoinToken>;
}

/**
 * Generic HTTP token-minting adapter. POSTs the join request to
 * VIDEO_PROVIDER_URL with a Bearer VIDEO_PROVIDER_KEY and expects a JSON
 * body of at least `{ token }` (with optional `url` / `expiresAt`). Most
 * SaaS RTC providers can be fronted by a tiny token endpoint matching this
 * shape; swap this class for a provider-native SDK call if richer claims
 * are needed.
 */
class HttpVideoProvider implements VideoProvider {
  readonly name = "http";
  constructor(
    private readonly url: string,
    private readonly key: string,
  ) {}

  async mintJoinToken(req: JoinTokenRequest): Promise<JoinToken> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.key}`,
      },
      body: JSON.stringify({
        room: req.roomName,
        identity: req.identity,
        name: req.displayName ?? req.identity,
        role: req.role,
        // host capability flag — provider endpoints that gate moderation
        // on a boolean can read this directly.
        moderator: req.role === "host",
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`video provider returned ${res.status}`);
    }
    const data = (await res.json()) as {
      token?: string;
      url?: string;
      expiresAt?: number;
    };
    if (!data.token) {
      throw new Error("video provider response missing token");
    }
    return {
      token: data.token,
      url: data.url ?? this.url,
      roomName: req.roomName,
      expiresAt: data.expiresAt,
    };
  }
}

/**
 * Resolve the configured provider, or null when env is unset. Callers MUST
 * null-check and render the "configure a provider" state on null rather
 * than attempting a join.
 */
export function getVideoProvider(): VideoProvider | null {
  if (!hasVideoProvider || !env.VIDEO_PROVIDER_URL || !env.VIDEO_PROVIDER_KEY) {
    return null;
  }
  return new HttpVideoProvider(env.VIDEO_PROVIDER_URL, env.VIDEO_PROVIDER_KEY);
}
