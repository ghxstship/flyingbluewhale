"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(function DropdownMenuSubTrigger({ className = "", children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={`flex cursor-default select-none items-center gap-2 rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[var(--surface-inset)] ${className}`}
      {...props}
    >
      {children}
      <ChevronRight size={12} className="ms-auto" aria-hidden="true" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(function DropdownMenuSubContent({ className = "", ...props }, ref) {
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={`z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] p-1 shadow-lg data-[state=open]:animate-fade-in ${className}`}
      {...props}
    />
  );
});

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className = "", sideOffset = 4, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={`z-50 min-w-[10rem] overflow-hidden rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] p-1 shadow-lg data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out ${className}`}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean; destructive?: boolean }
>(function DropdownMenuItem({ className = "", inset, destructive, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={`relative flex cursor-default select-none items-center gap-2 rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[var(--surface-inset)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
        inset ? "ps-8" : ""
      } ${destructive ? "text-[var(--color-error)]" : ""} ${className}`}
      {...props}
    />
  );
});

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className = "", children, checked, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={`relative flex cursor-default select-none items-center rounded py-1.5 ps-8 pe-2 text-sm outline-none data-[highlighted]:bg-[var(--surface-inset)] ${className}`}
      {...props}
    >
      <span className="absolute start-2 inline-flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check size={12} aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(function DropdownMenuRadioItem({ className = "", children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={`relative flex cursor-default select-none items-center rounded py-1.5 ps-8 pe-2 text-sm outline-none data-[highlighted]:bg-[var(--surface-inset)] ${className}`}
      {...props}
    >
      <span className="absolute start-2 inline-flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle size={8} className="fill-current" aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(function DropdownMenuLabel({ className = "", ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] ${className}`}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className = "", ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={`my-1 h-px bg-[var(--border-color)] ${className}`}
      {...props}
    />
  );
});

export function DropdownMenuShortcut({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`ms-auto text-[10px] font-mono text-[var(--text-muted)] ${className}`}>
      {children}
    </span>
  );
}
