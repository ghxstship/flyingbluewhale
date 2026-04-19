"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AppearanceGallery } from "@/app/theme/AppearanceGallery";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/Sheet";
import { track } from "@/lib/marketing-telemetry";
import { useTheme } from "@/app/theme/ThemeProvider";

/**
 * CHROMA BEACON on the marketing site.
 *
 * Wraps the existing authenticated-only <AppearanceGallery /> in a right-
 * side sheet triggered from the marketing header. Anonymous visitors see
 * the 8 themes immediately — no signup wall — and their choice persists
 * via the same cookie + localStorage chain that authenticated users use.
 *
 * Signup upsell copy at the bottom is intentionally soft; the marketing
 * bet is that showing product personality earns the click later.
 */
export function ThemeGallerySheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  // Telemetry — fire when the user lands on a new theme via this sheet.
  // We watch `theme` from the provider (not the sheet's own state) so we
  // catch clicks inside AppearanceGallery without plumbing a callback.
  const { theme } = useTheme();
  const prevThemeRef = useRef(theme);
  useEffect(() => {
    if (!open) return;
    if (theme !== prevThemeRef.current) {
      track("marketing.theme.picked", { from: prevThemeRef.current, to: theme });
      prevThemeRef.current = theme;
    }
  }, [theme, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Pick a design theme</SheetTitle>
          <SheetDescription>
            Eight fully-realized themes. Your choice applies instantly across every page —
            no reload, no signup. We&apos;ll remember it on this device.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <AppearanceGallery />
        </div>

        <div className="mt-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-sm">
          <p className="text-[var(--foreground)]">
            Like what you see? <Link href="/signup" className="font-medium underline">Create an account</Link> to
            sync themes across all your devices.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
