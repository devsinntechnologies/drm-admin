"use client";

import { X } from "lucide-react";
import { IndustryShellPreview } from "@/components/templates/IndustryShellPreview";
import { TemplateModulePreview } from "@/components/templates/TemplateModulePreview";
import type { CustomizedTemplateConfig, TemplateBuilderStepId } from "@/templates/types";
import { cn } from "@/lib/utils";

type GptPreviewDrawerProps = {
  open: boolean;
  onClose: () => void;
  stepId: TemplateBuilderStepId | string;
  stepLabel: string;
  config: {
    businessName: string;
    industryId: string;
    industryIcon?: string;
    logoDataUrl?: string | null;
    themeMode: CustomizedTemplateConfig["themeMode"];
    primaryColor: string;
    secondaryColor: string;
    currency: string;
    labels: CustomizedTemplateConfig["labels"];
    navItems: CustomizedTemplateConfig["navigation"];
    dashboardCards: CustomizedTemplateConfig["dashboardCards"];
    productsLabel: string;
  };
};

const STEP_SUMMARIES: Record<string, string> = {
  industry: "Industry blueprint and template metadata",
  "business-profile": "Business profile fields and operational settings",
  theme: "Brand colours, typography, and interface styling",
  modules: "Enabled modules and navigation structure",
  "dashboard-cards": "KPI cards on the dashboard",
  "dashboard-widgets": "Charts, analytics, and activity widgets",
  forms: "Custom business forms and field rules",
  permissions: "Default roles and permission matrix",
  preview: "Complete generated workspace experience",
  "select-template": "Selected industry template foundation",
  review: "Final review before business generation",
  generate: "Generated business portal preview",
};

export function GptPreviewDrawer({ open, onClose, stepId, stepLabel, config }: GptPreviewDrawerProps) {
  if (!open) return null;

  const activeModule = config.navItems.find((item) => item.moduleId !== "dashboard")?.moduleId ?? "dashboard";
  const moduleLabel =
    config.navItems.find((item) => item.moduleId === activeModule)?.label ?? activeModule;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close GPT preview"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l border-[#dbe4ef] bg-white shadow-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0050F8]">
              GPT Preview Template
            </p>
            <h3 className="text-lg font-semibold text-[#0f172a]">{stepLabel}</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              {STEP_SUMMARIES[stepId] ?? "Live preview based on your current configuration"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#e2e8f0] text-[#64748b]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="overflow-hidden rounded-xl border border-[#334155] bg-[#1e293b]">
            <div className="flex items-center gap-2 border-b border-[#334155] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              <div className="ml-2 min-w-0 flex-1 truncate rounded-md bg-[#0f172a] px-3 py-1 text-[11px] text-[#94a3b8]">
                app.diginizam.com · {config.businessName || "Your business"}
              </div>
            </div>

            <IndustryShellPreview
              size="embed"
              businessName={config.businessName}
              industryIcon={config.industryIcon}
              logoDataUrl={config.logoDataUrl}
              themeMode={config.themeMode}
              primaryColor={config.primaryColor}
              secondaryColor={config.secondaryColor}
              navItems={config.navItems.map((item) => ({
                moduleId: item.moduleId,
                label: item.label,
              }))}
              dashboardCards={config.dashboardCards}
              productsLabel={config.productsLabel}
              device="desktop"
              activeModuleId={activeModule}
              className="rounded-none border-0"
            >
              {activeModule !== "dashboard" ? (
                <TemplateModulePreview
                  compact
                  moduleId={activeModule}
                  moduleLabel={moduleLabel}
                  config={{
                    businessName: config.businessName,
                    industryId: config.industryId,
                    currency: config.currency,
                    labels: config.labels,
                    themeMode: config.themeMode,
                  }}
                  primaryColor={config.primaryColor}
                  secondaryColor={config.secondaryColor}
                />
              ) : undefined}
            </IndustryShellPreview>
          </div>

          <p className="mt-4 text-xs text-[#64748b]">
            This intelligent preview adapts to your current step settings — industry, theme, modules, and dashboard
            configuration — so you can validate the business experience before saving or generating.
          </p>
        </div>
      </aside>
    </div>
  );
}
