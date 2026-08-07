"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Loading from "@/components/common/Loading";
import { IndustryShellPreview } from "@/components/templates/IndustryShellPreview";
import { TemplateModulePreview } from "@/components/templates/TemplateModulePreview";
import { getMockDashboardCards } from "@/template-engine/mock-data";
import { resolveVisibleNav } from "@/template-engine/builder";
import { getTemplateConfigById } from "@/template-engine/storage";
import { getIndustryById } from "@/templates/industries";
import { colorsFromAccent } from "@/templates/modules";
import type { CustomizedTemplateConfig } from "@/templates/types";
import { cn } from "@/lib/utils";

function TemplatePreviewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [config, setConfig] = useState<CustomizedTemplateConfig | null>(null);
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    if (!id) return;
    setConfig(getTemplateConfigById(id) ?? null);
  }, [id]);

  const industry = useMemo(
    () => (config ? getIndustryById(config.industryId) : null),
    [config],
  );

  if (!id) {
    return (
      <EmptyShell message="Missing template id. Go back and generate a configuration first." />
    );
  }

  if (!config || !industry) {
    return (
      <EmptyShell message="Template not found in local storage. It may have been removed." />
    );
  }

  const fallback = colorsFromAccent(industry.theme.accent);
  const primary = config.primaryColor || fallback.primary;
  const secondary = config.secondaryColor || fallback.secondary;
  const nav = resolveVisibleNav(config);
  const cards = getMockDashboardCards(config);
  const moduleLabel = nav.find((item) => item.moduleId === activeNav)?.label ?? activeNav;

  return (
    <div className={cn("min-h-screen", config.themeMode === "dark" ? "bg-[#0b1220]" : "bg-[#f1f5f9]")}>
      <div className="border-b border-[#dbe4ef] bg-white px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/superAdmin/industry-templates"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#334155]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {config.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logoDataUrl} alt="" className="h-10 w-10 rounded-lg border border-[#e2e8f0] object-contain p-1" />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0f172a]">{config.businessName}</p>
              <p className="truncate text-xs text-[#64748b]">
                {config.industryName} · {config.currency} · Mock preview
              </p>
            </div>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            Template preview
          </span>
        </div>
      </div>

      <IndustryShellPreview
        size="full"
        businessName={config.businessName}
        industryIcon={industry.theme.icon}
        logoDataUrl={config.logoDataUrl}
        themeMode={config.themeMode}
        primaryColor={primary}
        secondaryColor={secondary}
        navItems={nav}
        dashboardCards={config.dashboardCards}
        dashboardCardItems={cards}
        productsLabel={config.labels.products}
        activeModuleId={activeNav}
        onNavChange={setActiveNav}
        className="border-0"
      >
        {activeNav === "dashboard" ? undefined : (
          <TemplateModulePreview
            moduleId={activeNav}
            moduleLabel={moduleLabel}
            config={config}
            primaryColor={primary}
            secondaryColor={secondary}
          />
        )}
      </IndustryShellPreview>
    </div>
  );
}

function EmptyShell({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f5f5] px-4">
      <p className="max-w-md text-center text-sm text-[#64748b]">{message}</p>
      <Link
        href="/dashboard/superAdmin/industry-templates"
        className="rounded-xl bg-[#001840] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Back to Industry Templates
      </Link>
    </div>
  );
}

export default function TemplatePreviewPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <TemplatePreviewContent />
    </Suspense>
  );
}
