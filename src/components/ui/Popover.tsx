"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type PopoverProps = {
  trigger: (state: { open: boolean }) => React.ReactNode;
  children: (state: { close: () => void }) => React.ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
  triggerClassName?: string;
  /** Render the panel in a portal with fixed positioning, escaping any `overflow-hidden`/scroll
   * ancestor (needed inside the height-locked map layout, where an absolute panel gets clipped). */
  portal?: boolean;
};

/** Floating popover anchored under the trigger — does not affect layout. */
export function Popover({ trigger, children, align = "end", panelClassName, triggerClassName, portal = false }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Fixed-position coords for the portaled panel (computed from the trigger's viewport rect).
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number; width: number }>();

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      // The portaled panel lives outside `ref`, so check it explicitly before closing.
      if (ref.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
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

  // Keep the portaled panel glued to the trigger on open, scroll (capture = catches inner scrollers)
  // and resize.
  useLayoutEffect(() => {
    if (!open || !portal) return;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos(
        align === "end"
          ? { top: r.bottom + 8, right: window.innerWidth - r.right, width: r.width }
          : { top: r.bottom + 8, left: r.left, width: r.width },
      );
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, portal, align]);

  const panel = (
    <div
      ref={panelRef}
      style={portal && pos ? { position: "fixed", top: pos.top, left: pos.left, right: pos.right, minWidth: pos.width } : undefined}
      className={cn(
        // z above the Dialog overlay (z-[70]) so portaled pickers work inside modals too.
        "z-[80] animate-pop-in rounded-panel border border-line bg-surface p-4 shadow-dropdown",
        portal ? "" : cn("absolute top-full mt-2", align === "end" ? "right-0" : "left-0"),
        panelClassName,
      )}
    >
      {children({ close: () => setOpen(false) })}
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className={cn("cursor-pointer", triggerClassName)}>
        {trigger({ open })}
      </button>
      {open && (portal ? createPortal(panel, document.body) : panel)}
    </div>
  );
}
