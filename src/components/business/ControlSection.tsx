"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ControlSectionProps = {
  /** Step number shown in the badge, e.g. 1 for "1. Business profile". */
  index: number;
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Small note for vertical-specific or role-gated sections, e.g.
   * "Only shown for pharmacy businesses". */
  scopeNote?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Shared card shell for every area of the business Control Center --
 * numbered header, optional description and scope note, consistent
 * spacing/border. Introduced so "Modules", "Branding", "Mobile app", etc.
 * all read as one coherent settings surface instead of each being its own
 * one-off layout (see the admin control audit, section 5.2). Purely
 * presentational -- it owns no state and doesn't know what's inside it, so
 * wrapping an existing section in this does not change its behaviour.
 */
export function ControlSection({
  index,
  title,
  description,
  icon: Icon,
  scopeNote,
  children,
  className,
}: ControlSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[#e2e8f0] bg-white p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-sm font-bold text-[#4338ca]">
          {Icon ? <Icon className="h-4 w-4" /> : index}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[#0f172a]">
            {index}. {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm text-[#64748b]">{description}</p>
          ) : null}
          {scopeNote ? (
            <p className="mt-1 inline-flex items-center rounded-full bg-[#fffbeb] px-2 py-0.5 text-xs font-medium text-[#92400e]">
              {scopeNote}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
