"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";

type Platform = "instagram" | "tiktok" | "youtube" | "spotify" | "twitter" | "linkedin";

type SocialEntry = {
  handle: string;
  followers?: number;
};

type Props = {
  initialJson?: string;
};

const PLATFORMS: { key: Platform; label: string; followerLabel: string }[] = [
  { key: "instagram", label: "Instagram", followerLabel: "Followers" },
  { key: "tiktok", label: "TikTok", followerLabel: "Followers" },
  { key: "youtube", label: "YouTube", followerLabel: "Subscribers" },
  { key: "spotify", label: "Spotify", followerLabel: "Monthly listeners" },
  { key: "twitter", label: "X / Twitter", followerLabel: "Followers" },
  { key: "linkedin", label: "LinkedIn", followerLabel: "Connections (optional)" },
];

export function SocialLinksEditor({ initialJson }: Props) {
  const initial = React.useMemo<Partial<Record<Platform, SocialEntry>>>(() => {
    if (!initialJson) return {};
    try {
      return JSON.parse(initialJson);
    } catch {
      return {};
    }
  }, [initialJson]);

  const [links, setLinks] = React.useState<Partial<Record<Platform, SocialEntry>>>(initial);

  const set = (platform: Platform, field: keyof SocialEntry, value: string) => {
    setLinks((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: field === "followers" ? (value ? Number(value) : undefined) : value,
      },
    }));
  };

  // Strip entries where handle is empty
  const clean = Object.fromEntries(
    Object.entries(links).filter(([, v]) => v && (v as SocialEntry).handle?.trim()),
  );

  return (
    <>
      <input type="hidden" name="social_links_json" value={JSON.stringify(clean)} />
      <div className="space-y-4">
        {PLATFORMS.map(({ key, label, followerLabel }) => (
          <div key={key} className="grid grid-cols-[1fr_1fr] gap-3">
            <Input
              label={`${label} — handle`}
              value={links[key]?.handle ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(key, "handle", e.target.value)}
              placeholder={`@${key}handle`}
              maxLength={120}
            />
            <Input
              label={followerLabel}
              value={links[key]?.followers != null ? String(links[key]!.followers) : ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(key, "followers", e.target.value)}
              type="number"
              min={0}
            />
          </div>
        ))}
      </div>
    </>
  );
}
