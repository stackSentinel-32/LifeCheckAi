"use client";

/**
 * DropdownMenu — Radix UI primitive wrapped in the project design system.
 * Usage:
 *   <DropdownMenu trigger={<button>Open</button>} items={[
 *     { label: "Profile", icon: <User size={14} />, onClick: () => {} },
 *     { label: "Logout", variant: "danger", onClick: () => {} },
 *     { separator: true },
 *   ]} />
 */

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export interface DropdownItem {
  label?: string;
  icon?: ReactNode;
  onClick?: () => void;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  variant?: "default" | "danger";
  /** Set to true to render a separator line instead of an item */
  separator?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "start" | "center" | "end";
  sideOffset?: number;
  label?: string;
}

const itemBase = `
  flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm
  cursor-pointer select-none outline-none transition-colors
  focus:bg-white/8
  data-[disabled]:pointer-events-none data-[disabled]:opacity-40
`;

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  sideOffset = 6,
  label,
}: DropdownMenuProps) {
  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          align={align}
          sideOffset={sideOffset}
          className="
            z-50 min-w-[180px] rounded-xl
            bg-[#1e1e23] border border-white/10
            p-1.5 shadow-xl shadow-black/50
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
            data-[side=bottom]:slide-in-from-top-2
            data-[side=top]:slide-in-from-bottom-2
          "
        >
          {label && (
            <RadixDropdown.Label className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-bold">
              {label}
            </RadixDropdown.Label>
          )}

          {items.map((item, index) => {
            if (item.separator) {
              return (
                <RadixDropdown.Separator
                  key={`sep-${index}`}
                  className="my-1 h-px bg-white/8"
                />
              );
            }

            if (item.checked !== undefined) {
              return (
                <RadixDropdown.CheckboxItem
                  key={item.label}
                  checked={item.checked}
                  onCheckedChange={() => item.onClick?.()}
                  disabled={item.disabled}
                  className={`${itemBase} text-text-secondary hover:text-text-primary hover:bg-white/5`}
                >
                  <RadixDropdown.ItemIndicator>
                    <Check size={14} className="text-accent-primary" aria-hidden="true" />
                  </RadixDropdown.ItemIndicator>
                  <span className={item.checked ? "" : "pl-[22px]"}>{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-auto text-[10px] text-text-muted">{item.shortcut}</span>
                  )}
                </RadixDropdown.CheckboxItem>
              );
            }

            return (
              <RadixDropdown.Item
                key={item.label}
                onSelect={() => item.onClick?.()}
                disabled={item.disabled}
                className={`
                  ${itemBase}
                  ${item.variant === "danger"
                    ? "text-danger hover:bg-danger/10"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                  }
                `}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="ml-auto text-[10px] text-text-muted">{item.shortcut}</span>
                )}
              </RadixDropdown.Item>
            );
          })}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}
