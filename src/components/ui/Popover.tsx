"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type PopoverProps = {
  trigger: (state: { open: boolean }) => React.ReactNode;
  children: (state: { close: () => void }) => React.ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
  triggerClassName?: string;
};

/** Floating popover anchored under the trigger — does not affect layout. */
export function Popover({ trigger, children, align = "end", panelClassName, triggerClassName }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className={cn("cursor-pointer", triggerClassName)}>
        {trigger({ open })}
      </button>
      {open && (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 animate-pop-in rounded-panel border border-line bg-surface p-4 shadow-dropdown",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}
