"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function DragSortHandle({
  disabled,
  onDragStart,
  onDragEnd,
}: {
  disabled?: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      draggable={!disabled}
      aria-label="Drag to reorder"
      aria-disabled={disabled}
      onDragStart={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onDragStart(event);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-grab hover:bg-[#f1f5f9] hover:text-[#475569] active:cursor-grabbing",
      )}
    >
      <GripVertical className="h-4 w-4 pointer-events-none" />
    </span>
  );
}
