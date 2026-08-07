"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import {
  IndustryShellPreview,
  type ShellNavItem,
} from "@/components/templates/IndustryShellPreview";
import { TemplateModulePreview } from "@/components/templates/TemplateModulePreview";
import type { CustomizedTemplateConfig, DashboardCardId, ThemeMode } from "@/templates/types";
import { cn } from "@/lib/utils";

const PREVIEW_BASE_WIDTH = 920;
const PREVIEW_BASE_HEIGHT = 720;

type TemplatePreviewFrameProps = {
  businessName: string;
  industryIcon?: string;
  industryId: string;
  logoDataUrl?: string | null;
  themeMode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  labels: CustomizedTemplateConfig["labels"];
  navItems: ShellNavItem[];
  dashboardCards: DashboardCardId[];
  productsLabel: string;
  device: "desktop" | "tablet" | "mobile";
  onDeviceChange: (device: "desktop" | "tablet" | "mobile") => void;
  moduleCount: number;
  cardCount: number;
};

export function TemplatePreviewFrame({
  businessName,
  industryIcon,
  industryId,
  logoDataUrl,
  themeMode,
  primaryColor,
  secondaryColor,
  currency,
  labels,
  navItems,
  dashboardCards,
  productsLabel,
  device,
  onDeviceChange,
  moduleCount,
  cardCount,
}: TemplatePreviewFrameProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [activeNav, setActiveNav] = useState(navItems[0]?.moduleId ?? "dashboard");

  useEffect(() => {
    if (!navItems.some((item) => item.moduleId === activeNav)) {
      setActiveNav(navItems[0]?.moduleId ?? "dashboard");
    }
  }, [navItems, activeNav]);

  const moduleLabel = useMemo(
    () => navItems.find((item) => item.moduleId === activeNav)?.label ?? activeNav,
    [navItems, activeNav],
  );

  const previewConfig = useMemo(
    () => ({
      businessName,
      industryId,
      currency,
      labels,
      themeMode,
    }),
    [businessName, industryId, currency, labels, themeMode],
  );

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const updateScale = () => {
      const width = node.clientWidth;
      const padding = 16;
      setScale(Math.min(1, (width - padding) / PREVIEW_BASE_WIDTH));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, [device]);

  return (
    <section className="template-preview-frame overflow-hidden rounded-xl border border-[#dbe4ef] bg-[#f8fafc]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] bg-white px-4 py-3 sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0050F8]">
            Workspace preview
          </p>
          <h3 className="text-sm font-semibold text-[#0f172a] sm:text-base">
            How your business admin will look
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#fafbfc] px-2 py-1">
            <span
              className="h-4 w-4 rounded border border-[#e2e8f0]"
              style={{ backgroundColor: primaryColor }}
              title="Primary"
            />
            <span
              className="h-4 w-4 rounded border border-[#e2e8f0]"
              style={{ backgroundColor: secondaryColor }}
              title="Secondary"
            />
            <span className="text-[10px] font-semibold uppercase text-[#64748b]">{themeMode}</span>
          </div>

          <div className="portal-preview-toolbar">
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const
            ).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => onDeviceChange(key)}
                data-active={device === key ? "true" : undefined}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md text-[#94a3b8]",
                  device === key && "text-[#0050F8]",
                )}
                title={`${key} preview`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="template-preview-canvas px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-[#334155] bg-[#1e293b] shadow-[0_24px_48px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-2 border-b border-[#334155] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              <div className="ml-2 min-w-0 flex-1 truncate rounded-md bg-[#0f172a] px-3 py-1 text-[11px] text-[#94a3b8]">
                app.diginizam.com · {businessName || "Your business"}
              </div>
            </div>

            <div
              ref={viewportRef}
              className="flex justify-center overflow-hidden bg-[#eef2f7]"
              style={{ height: Math.max(PREVIEW_BASE_HEIGHT * scale, 300) }}
            >
              <div
                style={{
                  width: PREVIEW_BASE_WIDTH * scale,
                  height: PREVIEW_BASE_HEIGHT * scale,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: PREVIEW_BASE_WIDTH,
                    height: PREVIEW_BASE_HEIGHT,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <IndustryShellPreview
                    size="embed"
                    businessName={businessName}
                    industryIcon={industryIcon}
                    logoDataUrl={logoDataUrl}
                    themeMode={themeMode}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    navItems={navItems}
                    dashboardCards={dashboardCards}
                    productsLabel={productsLabel}
                    device={device}
                    activeModuleId={activeNav}
                    onNavChange={setActiveNav}
                    className="h-full rounded-none border-0 shadow-none"
                  >
                    {activeNav !== "dashboard" ? (
                      <TemplateModulePreview
                        compact
                        moduleId={activeNav}
                        moduleLabel={moduleLabel}
                        config={previewConfig}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                      />
                    ) : undefined}
                  </IndustryShellPreview>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748b]">
            <p>
              {moduleCount} modules · {cardCount} dashboard cards · drag chips above to reorder
            </p>
            <p className="font-medium text-[#94a3b8]">Live preview · updates as you customize</p>
          </div>
        </div>
      </div>
    </section>
  );
}
