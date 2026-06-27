"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./Button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "./DropdownMenu";

/**
 * ButtonGroup — a segmented row of `<Button>`s that share an outer border and
 * radius. Inner corners are flattened and the seam between adjacent buttons is
 * collapsed so the cluster reads as one control. Exposed as `role="group"`.
 *
 * Pass `<Button>` children; the group rewrites their `className` to join them.
 */
export type ButtonGroupProps = {
  children: React.ReactNode;
  /** Accessible name for the group (e.g. "View mode"). */
  "aria-label"?: string;
  className?: string;
};

export function ButtonGroup({ children, "aria-label": ariaLabel, className = "" }: ButtonGroupProps) {
  const items = React.Children.toArray(children).filter(React.isValidElement);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-stretch [&>*:not(:first-child)]:-ms-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none ${className}`.trim()}
    >
      {items}
    </div>
  );
}

/**
 * SplitButton — a primary action button welded to a dropdown caret. The caret
 * opens a `DropdownMenu` of secondary actions (pass `DropdownMenuItem`s via
 * `menu`). The two halves share the segmented seam treatment of ButtonGroup.
 */
export type SplitButtonProps = {
  /** Primary action label. */
  children: React.ReactNode;
  /** The primary button's click handler. */
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: Exclude<ButtonSize, "icon">;
  /** Dropdown contents — typically `<DropdownMenuItem>`s. */
  menu: React.ReactNode;
  /** Accessible name for the caret trigger. Defaults to "More actions". */
  menuLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function SplitButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  menu,
  menuLabel = "More actions",
  disabled,
  className = "",
}: SplitButtonProps) {
  const primaryProps = {
    variant,
    size,
    onClick,
    disabled,
    className: "rounded-e-none",
  } as ButtonProps;

  return (
    <div role="group" className={`inline-flex items-stretch ${className}`.trim()}>
      <Button {...primaryProps}>{children}</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            disabled={disabled}
            aria-label={menuLabel}
            className="-ms-px rounded-s-none"
          >
            <ChevronDown size={16} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">{menu}</DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
