"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Scroll container with a custom, always-visible scrollbar (the native one is
 * an invisible overlay on macOS). The thumb is draggable; a bottom fade hints
 * that there is more content. Wheel/trackpad scrolling stays inside the area.
 */
export function ScrollArea({
  className,
  contentClassName,
  children,
}: {
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ h: 0, top: 0 });
  const [show, setShow] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  const measure = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const { scrollHeight: sh, clientHeight: ch, scrollTop: st } = el;
    const overflow = sh - ch;
    const visible = overflow > 2;
    setShow(visible);
    if (!visible) return;
    const h = Math.max((ch / sh) * ch, 28);
    const ratio = st / overflow;
    setThumb({ h, top: ratio * (ch - h) });
    setAtBottom(st >= overflow - 2);
  }, []);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [measure]);

  const dragThumb = (e: React.MouseEvent) => {
    const el = viewport.current;
    if (!el) return;
    e.preventDefault();
    const startY = e.clientY;
    const startTop = el.scrollTop;
    const overflow = el.scrollHeight - el.clientHeight;
    const trackH = el.clientHeight - thumb.h;
    const onMove = (ev: MouseEvent) => {
      if (trackH <= 0) return;
      el.scrollTop = startTop + ((ev.clientY - startY) / trackH) * overflow;
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={viewport}
        onScroll={measure}
        className={cn("no-native-scrollbar overflow-y-auto", contentClassName)}
      >
        {children}
      </div>

      {/* Bottom fade — only while there is more below */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-page to-transparent transition-opacity",
          show && !atBottom ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Custom scrollbar */}
      {show && (
        <div
          onMouseDown={dragThumb}
          className="absolute right-0.5 top-0 w-1.5 cursor-pointer rounded-full bg-line-4 transition-colors hover:bg-ink-4"
          style={{ height: thumb.h, transform: `translateY(${thumb.top}px)` }}
        />
      )}
    </div>
  );
}
