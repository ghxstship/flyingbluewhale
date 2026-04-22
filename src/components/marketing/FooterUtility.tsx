"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Hint } from "@/components/ui/Tooltip";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";
import { ThemeGallerySheet } from "@/components/marketing/ThemeGallerySheet";

/**
 * Footer utility cluster — houses the chrome controls that used to crowd
 * the marketing header. Matches Vercel / Linear footer-right patterns:
 * theme palette, locale, light/dark quick-switch. All icon-only with
 * tooltips; all functional.
 */
export function FooterUtility() {
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Hint label="Design themes">
          <button
            type="button"
            onClick={() => setThemePickerOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-inset)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--org-primary)]"
            aria-label="Open design themes"
          >
            <Palette size={14} aria-hidden="true" />
          </button>
        </Hint>
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
      <ThemeGallerySheet open={themePickerOpen} onOpenChange={setThemePickerOpen} />
    </>
  );
}
