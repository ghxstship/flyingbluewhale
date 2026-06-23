"use client";

import * as React from "react";
import Link from "next/link";
import { Settings, User, LogOut, Keyboard, HelpCircle, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Top-right avatar menu — admin (Settings) lives here, not in the primary
 * sidebar. See `docs/ia/03-ia-compression-proposal.md`.
 *
 * The trigger is the user's avatar; the panel surfaces personal-account
 * actions, the Settings entry-point, help/shortcuts, and Sign out. Settings
 * has its own 2-col layout under `/studio/settings`.
 */
export function AvatarMenu({ name, email, src }: { name: string; email?: string | null; src?: string | null }) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("avatarMenu.openAriaLabel", undefined, "Open account menu")}
          className="rounded-full ring-offset-2 ring-offset-[var(--p-bg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--p-accent)]"
        >
          <Avatar name={name} src={src} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="px-2 py-1.5">
          <div className="text-sm font-medium text-[var(--p-text-1)]">{name}</div>
          {email ? <div className="truncate text-xs text-[var(--p-text-2)]">{email}</div> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/me" className="flex items-center gap-2">
            <User size={14} aria-hidden="true" />
            {t("avatarMenu.account", undefined, "Account")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/me/preferences" className="flex items-center gap-2">
            <Sparkles size={14} aria-hidden="true" />
            {t("avatarMenu.preferences", undefined, "Preferences")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/studio/settings" className="flex items-center gap-2">
            <Settings size={14} aria-hidden="true" />
            {t("common.settings", undefined, "Settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            window.dispatchEvent(new CustomEvent("shortcut-dialog:open"));
          }}
          className="flex items-center gap-2"
        >
          <Keyboard size={14} aria-hidden="true" />
          {t("avatarMenu.keyboardShortcuts", undefined, "Keyboard shortcuts")}
          <kbd className="ms-auto font-mono text-[10px] text-[var(--p-text-2)]">?</kbd>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help" className="flex items-center gap-2">
            <HelpCircle size={14} aria-hidden="true" />
            {t("common.help", undefined, "Help")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild destructive>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut size={14} aria-hidden="true" />
              {t("common.signOut", undefined, "Sign Out")}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
