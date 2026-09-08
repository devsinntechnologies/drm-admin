"use client";

import { CircleHelp } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type FeatureTipProps = {
  text: string;
  className?: string;
  /** When set, children become the hover/focus target instead of a help icon. */
  children?: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
};

/**
 * Hover, focus, or tap to read what a control is for.
 * Renders into document.body so overflow:hidden dialogs do not clip the copy.
 */
export function FeatureTip({ text, className, children, side = "top" }: FeatureTipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleId = useId();
  const closeTimer = useRef<number | null>(null);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 10;
    if (side === "right") {
      setCoords({
        top: rect.top + rect.height / 2,
        left: Math.min(rect.right + pad, window.innerWidth - 16),
      });
      return;
    }
    if (side === "left") {
      setCoords({
        top: rect.top + rect.height / 2,
        left: Math.max(rect.left - pad, 16),
      });
      return;
    }
    const left = Math.min(Math.max(rect.left + rect.width / 2, 140), window.innerWidth - 140);
    setCoords({
      top: side === "bottom" ? rect.bottom + pad : rect.top - pad,
      left,
    });
  }, [side]);

  const show = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    place();
    setOpen(true);
  };

  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (open) {
      hide();
      return;
    }
    show();
  };

  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, place]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const bubble =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            id={bubbleId}
            role="tooltip"
            onMouseEnter={show}
            onMouseLeave={hide}
            className="pointer-events-auto fixed z-[200] w-[min(18rem,calc(100vw-1.5rem))] rounded-xl bg-[#0f172a] px-3 py-2 text-left text-[12px] leading-relaxed font-medium text-white shadow-[0_12px_32px_rgba(15,23,42,0.28)]"
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                side === "bottom"
                  ? "translate(-50%, 0)"
                  : side === "right"
                    ? "translate(0, -50%)"
                    : side === "left"
                      ? "translate(-100%, -50%)"
                      : "translate(-50%, -100%)",
            }}
          >
            {text}
          </div>,
          document.body,
        )
      : null;

  if (children) {
    return (
      <span
        ref={(node) => {
          triggerRef.current = node;
        }}
        className={cn("inline-flex min-w-0 max-w-full", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocusCapture={show}
        onBlurCapture={hide}
      >
        {children}
        {bubble}
      </span>
    );
  }

  return (
    <button
      ref={(node) => {
        triggerRef.current = node;
      }}
      type="button"
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#94a3b8] hover:text-[#4338ca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]/40",
        className,
      )}
      aria-label="What is this?"
      aria-describedby={open ? bubbleId : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={toggle}
    >
      <CircleHelp className="h-3.5 w-3.5" strokeWidth={2.2} />
      {bubble}
    </button>
  );
}

/** Label row with an optional help icon. Use next to headings that are not FormField. */
export function FieldLabel({
  children,
  tip,
  required,
  className,
}: {
  children: ReactNode;
  tip?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {children}
      {required ? <span className="ml-0.5 text-[#dc2626]">*</span> : null}
      {tip ? <FeatureTip text={tip} /> : null}
    </span>
  );
}
