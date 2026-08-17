"use client";

import { Construction } from "lucide-react";
import { PortalPage } from "@/components/admin/PortalPage";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { MODULE_CATALOG } from "@/templates/modules";
import type { ModuleId } from "@/templates/types";

type ModuleInProgressProps = {
  moduleId: string;
  moduleLabel?: string;
};

export function ModuleInProgress({ moduleId, moduleLabel }: ModuleInProgressProps) {
  const { primaryColor } = useBusinessTemplate();
  const label =
    moduleLabel ??
    MODULE_CATALOG[moduleId as ModuleId]?.label ??
    moduleId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <PortalPage>
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-[#e2e8f0] bg-white px-8 py-12 text-center">
        <div
          className="mb-5 grid h-16 w-16 place-items-center rounded-2xl"
          style={{ backgroundColor: `${primaryColor}14`, color: primaryColor }}
        >
          <Construction className="h-8 w-8" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">In Progress</p>
        <h1 className="mt-2 text-2xl font-bold text-[#0f172a]">{label}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#64748b]">
          This module is part of your restaurant template but the workspace screen is still being built.
          Core modules like Products, Orders, Kitchen, and Tables are ready to use.
        </p>
      </div>
    </PortalPage>
  );
}
