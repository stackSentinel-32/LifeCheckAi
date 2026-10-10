"use client";

/**
 * Tooltip — Radix UI primitive wrapped in the project design system.
 * Usage:
 *   <Tooltip content="Refresh data">
 *     <button>...</button>
 *   </Tooltip>
 */

import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Delay in ms before tooltip appears. Default 400. */
  delayDuration?: number;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function Tooltip({
  content,
  children,
  delayDuration = 400,
  side = "top",
  align = "center",
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className="
              z-50 max-w-xs rounded-lg px-3 py-1.5
              bg-[#1e1e23] border border-white/10
              text-xs font-medium text-text-primary
              shadow-lg shadow-black/40
              animate-in fade-in-0 zoom-in-95
              data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
              data-[side=bottom]:slide-in-from-top-2
              data-[side=top]:slide-in-from-bottom-2
            "
          >
            {content}
            <RadixTooltip.Arrow className="fill-[#1e1e23]" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
