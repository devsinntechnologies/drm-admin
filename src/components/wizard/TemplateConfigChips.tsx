"use client";

import type { ReactNode } from "react";
import { GripVertical, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { isModuleImplemented } from "@/lib/module-implementation";
import { DASHBOARD_CARD_CATALOG, MODULE_CATALOG } from "@/templates/modules";
import type { DashboardCardId, ModuleId } from "@/templates/types";

export function ConfigChip({
  selected,
  locked = false,
  dragging,
  dragLabel,
  toggleTitle,
  title,
  description,
  footer,
  trailing,
  onToggle,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  selected?: boolean;
  locked?: boolean;
  dragging?: boolean;
  dragLabel: string;
  toggleTitle: string;
  title: string;
  description?: string;
  footer: string;
  trailing?: ReactNode;
  onToggle?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
      data-selected={selected ? "true" : undefined}
      data-locked={locked ? "true" : undefined}
      className={cn(
        "portal-config-chip rounded-xl border border-[#e2e8f0] px-3 py-3 text-left",
        !selected && "opacity-90",
        dragging && "portal-config-chip--dragging",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="portal-config-chip-handle mt-0.5 text-[#94a3b8]"
          title="Drag to reorder"
          aria-label={dragLabel}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div
          className={cn(
            "portal-config-chip-toggle min-w-0 flex-1 outline-none",
            locked ? "cursor-not-allowed" : "cursor-pointer",
          )}
          tabIndex={locked ? -1 : 0}
          aria-disabled={locked || undefined}
          onClick={() => {
            if (!locked) onToggle?.();
          }}
          onKeyDown={(e) => {
            if (locked) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle?.();
            }
          }}
          title={toggleTitle}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs font-bold",
                selected
                  ? "border-[#0050F8] bg-[#0050F8] text-white"
                  : "border-[#e2e8f0] bg-white text-[#64748b]",
              )}
            >
              {selected ? "✓" : ""}
            </span>
            <p className="truncate text-sm font-semibold text-[#0f172a]">{title}</p>
            {trailing}
          </div>
          {description ? (
            <p className="mt-1 line-clamp-2 pl-7 text-xs text-[#64748b]">{description}</p>
          ) : null}
          <p
            className={cn(
              "mt-1 pl-7 text-[11px]",
              locked ? "font-semibold text-[#64748b]" : "font-medium text-[#94a3b8]",
            )}
          >
            {footer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardCardChip({
  id,
  checked,
  dragging,
  onToggle,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  id: DashboardCardId;
  checked?: boolean;
  dragging?: boolean;
  onToggle?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}) {
  const meta = DASHBOARD_CARD_CATALOG[id];
  return (
    <ConfigChip
      selected={checked}
      dragging={dragging}
      dragLabel={`Reorder ${meta?.label ?? id}`}
      toggleTitle={checked ? "Hide card" : "Show card"}
      title={meta?.label ?? id}
      description={meta?.description}
      footer={checked ? "Enabled · shown on dashboard" : "Off · hidden from dashboard"}
      onToggle={onToggle}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    />
  );
}

export function ModuleChip({
  id,
  label,
  checked,
  locked,
  lockReason,
  dragging,
  industryId,
  onToggle,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  id: ModuleId;
  label?: string;
  checked?: boolean;
  locked?: boolean;
  lockReason?: string | null;
  dragging?: boolean;
  industryId?: string | null;
  onToggle?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}) {
  const meta = MODULE_CATALOG[id];
  const displayLabel = label ?? meta?.label ?? id;
  const inProgress = !isModuleImplemented(id, industryId);
  return (
    <ConfigChip
      selected={checked}
      locked={!!locked}
      dragging={dragging}
      dragLabel={`Reorder ${displayLabel}`}
      toggleTitle={locked ? lockReason ?? "Locked" : checked ? "Disable module" : "Enable module"}
      title={displayLabel}
      description={meta?.description}
      footer={
        locked
          ? lockReason ?? "Always on"
          : inProgress
            ? "In Progress · workspace screen not built yet"
          : checked
            ? "Enabled · unselect clears linked modules"
            : "Off · enable pulls required linked modules"
      }
      trailing={
        locked ? (
          <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
        ) : inProgress ? (
          <span className="ml-auto shrink-0 rounded-full bg-[#fef3c7] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#b45309]">
            In Progress
          </span>
        ) : null
      }
      onToggle={onToggle}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    />
  );
}
