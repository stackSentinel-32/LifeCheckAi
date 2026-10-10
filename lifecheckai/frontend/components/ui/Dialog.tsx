"use client";

/**
 * Dialog — Radix UI modal primitive wrapped in the project design system.
 * Usage:
 *   <Dialog open={open} onOpenChange={setOpen} title="Settings">
 *     <p>Content here</p>
 *   </Dialog>
 */

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Custom trigger element. If omitted, control open/onOpenChange externally. */
  trigger?: ReactNode;
  maxWidth?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  maxWidth = "max-w-lg",
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        {/* Overlay */}
        <RadixDialog.Overlay
          className="
            fixed inset-0 z-50
            bg-black/60 backdrop-blur-sm
            data-[state=open]:animate-in data-[state=open]:fade-in-0
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          "
        />
        {/* Content panel */}
        <RadixDialog.Content
          className={`
            fixed left-1/2 top-1/2 z-50 w-[90vw] ${maxWidth}
            -translate-x-1/2 -translate-y-1/2
            rounded-2xl border border-white/10
            bg-[#18181b] shadow-2xl shadow-black/60
            p-6 focus:outline-none
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
          `}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <RadixDialog.Title className="text-lg font-bold text-text-primary">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1 text-sm text-text-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              className="
                shrink-0 p-1.5 rounded-lg
                text-text-muted hover:text-text-primary
                hover:bg-white/5 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
              "
              aria-label="Close dialog"
            >
              <X size={18} aria-hidden="true" />
            </RadixDialog.Close>
          </div>

          {/* Body */}
          <div>{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Re-export atomic parts for advanced composition */
export const DialogClose = RadixDialog.Close;
export const DialogFooter = ({ children }: { children: ReactNode }) => (
  <div className="mt-6 flex items-center justify-end gap-3">{children}</div>
);
