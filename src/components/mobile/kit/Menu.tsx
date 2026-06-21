"use client";

import type { ReactNode } from "react";
import { KIcon } from "./icon";

/**
 * Dropdown-menu pieces for the COMPVSS mobile action bar.
 *
 * Ported from the prototype's `PillMenu` / `Popover` / `TogRow` / `mkItems`.
 * The prototype leaned on the design-system `Menu` + `Switch` globals; here
 * the menu list is rendered locally (`.ps-menu.pop` markup, matching CSS in
 * kit-mobile.css) and the toggle is a plain checkbox-backed switch.
 */

export type MenuItem = {
  label: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
};

/** Internal: the `.ps-menu pop` list both PillMenu and the legacy menu use. */
function MenuList({ items, className = "" }: { items: MenuItem[]; className?: string }) {
  return (
    <div className={`ps-menu ${className}`.trim()} role="menu">
      {items.map((it, i) => (
        <button key={i} type="button" className="ps-menu-item" role="menuitem" onClick={it.onSelect}>
          {it.icon != null && <span className="ps-menu-ico">{it.icon}</span>}
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

export type PillMenuProps = {
  label: string;
  icon: string;
  active?: boolean;
  count?: number;
  openKey: string;
  menuOpen: string | null;
  setMenuOpen: (key: string | null) => void;
  items: MenuItem[];
  align?: "left" | "right";
};

export function PillMenu({
  label,
  icon,
  active,
  count,
  openKey,
  menuOpen,
  setMenuOpen,
  items,
  align = "left",
}: PillMenuProps) {
  const open = menuOpen === openKey;
  return (
    <div style={{ position: "relative", flex: "none" }}>
      <button
        type="button"
        className="pill ico"
        data-active={active || count ? true : undefined}
        onClick={() => setMenuOpen(open ? null : openKey)}
        title={label}
        aria-label={label}
      >
        <KIcon name={icon} size={16} />
        {count ? <span className="acount">{count}</span> : null}
      </button>
      {open && (
        <>
          <div className="menu-back" onClick={() => setMenuOpen(null)} />
          <MenuList className={`pop ${align === "right" ? "r" : ""}`.trim()} items={items} />
        </>
      )}
    </div>
  );
}

export type PopoverProps = {
  label: string;
  icon: string;
  active?: boolean;
  count?: number;
  openKey: string;
  menuOpen: string | null;
  setMenuOpen: (key: string | null) => void;
  width?: number;
  align?: "left" | "right";
  children?: ReactNode;
};

export function Popover({
  label,
  icon,
  active,
  count,
  openKey,
  menuOpen,
  setMenuOpen,
  width = 248,
  align = "left",
  children,
}: PopoverProps) {
  const open = menuOpen === openKey;
  return (
    <div style={{ position: "relative", flex: "none" }}>
      <button
        type="button"
        className="pill ico"
        data-active={active || count ? true : undefined}
        onClick={() => setMenuOpen(open ? null : openKey)}
        title={label}
        aria-label={label}
      >
        <KIcon name={icon} size={16} />
        {count ? <span className="acount">{count}</span> : null}
      </button>
      {open && (
        <>
          <div className="menu-back" onClick={() => setMenuOpen(null)} />
          <div className={`ps-menu pop ${align === "right" ? "r" : ""}`.trim()} style={{ width, padding: 14 }}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export type TogRowProps = {
  label: string;
  on: boolean;
  set: (next: boolean) => void;
};

export function TogRow({ label, on, set }: TogRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 0",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <label className="ps-switch" style={{ cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => set(e.target.checked)}
          aria-label={label}
        />
        <span className="ps-switch-track" aria-hidden />
      </label>
    </div>
  );
}

/**
 * Build menu items from `[id, label]` option tuples, marking the current
 * selection with a check and wiring select + close on each.
 */
export function mkItems<T extends string>(
  opts: ReadonlyArray<readonly [T, string]>,
  current: T,
  set: (id: T) => void,
  close: () => void,
): MenuItem[] {
  return opts.map(([id, label]) => ({
    label,
    icon: current === id ? <KIcon name="Check" size={14} /> : <span style={{ width: 14 }} />,
    onSelect: () => {
      set(id);
      close();
    },
  }));
}
