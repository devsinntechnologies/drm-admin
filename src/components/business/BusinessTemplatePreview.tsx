"use client";

import { useMemo, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { IndustryIcon } from "@/components/templates/IndustryIcon";
import { getIndustryPreviewProfile } from "@/lib/industry-preview-profiles";
import { getIndustryById } from "@/templates/industries";
import type { BusinessProfileConfig } from "@/lib/business-profile";
import { cn } from "@/lib/utils";

type Props = {
  profile: BusinessProfileConfig;
  businessName: string;
  className?: string;
};

export function BusinessTemplatePreview({ profile, businessName, className }: Props) {
  const [activeNav, setActiveNav] = useState(0);
  const [activeModule, setActiveModule] = useState(0);

  const preview = useMemo(() => getIndustryPreviewProfile(profile.industryId), [profile.industryId]);
  const template = getIndustryById(profile.industryId);
  const dark = profile.themeMode === "dark";

  const surface = dark ? "#0f172a" : "#ffffff";
  const bg = dark ? "#0b1220" : "#f1f5f9";
  const text = dark ? "#f8fafc" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#e2e8f0] bg-white", className)}>
      <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0050f8]">Live Template Preview</p>
          <p className="text-sm font-semibold text-[#0f172a]">{preview.label} · {businessName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-[#e2e8f0]" style={{ backgroundColor: profile.primaryColor }} title="Primary" />
          <span className="h-3 w-3 rounded-full border border-[#e2e8f0]" style={{ backgroundColor: profile.secondaryColor }} title="Secondary" />
          <span className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[10px] font-bold uppercase text-[#64748b]">
            {profile.themeMode}
          </span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
        {/* Mini sidebar */}
        <aside className="border-b border-[#f1f5f9] p-3 lg:border-b-0 lg:border-r" style={{ backgroundColor: bg }}>
          <div className="mb-3 flex items-center gap-2 px-2">
            <div
              className="grid h-8 w-8 place-items-center rounded-lg text-white"
              style={{ backgroundColor: profile.primaryColor }}
            >
              {template ? <IndustryIcon name={template.theme.icon} /> : <LayoutDashboard className="h-4 w-4" />}
            </div>
            <span className="truncate text-xs font-bold" style={{ color: text }}>
              {businessName}
            </span>
          </div>
          <nav className="space-y-0.5">
            {preview.navItems.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveNav(index)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors",
                )}
                style={{
                  backgroundColor: activeNav === index ? profile.primaryColor : "transparent",
                  color: activeNav === index ? "#ffffff" : muted,
                }}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mini main area */}
        <div className="p-4" style={{ backgroundColor: bg }}>
          <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {preview.dashboardMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border p-3"
                style={{ backgroundColor: surface, borderColor: border }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: muted }}>
                  {metric.label}
                </p>
                <p className="mt-1 text-lg font-bold" style={{ color: text }}>
                  {metric.value}
                </p>
                {metric.delta ? (
                  <p className="mt-0.5 text-[10px] font-semibold" style={{ color: profile.secondaryColor }}>
                    {metric.delta}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {preview.modules.map((mod, index) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(index)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderColor: activeModule === index ? profile.secondaryColor : border,
                  backgroundColor: activeModule === index ? `${profile.secondaryColor}18` : surface,
                  color: activeModule === index ? profile.secondaryColor : muted,
                }}
              >
                {mod.label}
              </button>
            ))}
          </div>

          {preview.modules[activeModule] ? (
            <div className="rounded-lg border p-4" style={{ backgroundColor: surface, borderColor: border }}>
              <h4 className="text-sm font-bold" style={{ color: text }}>
                {preview.modules[activeModule].label}
              </h4>
              <p className="mt-1 text-xs" style={{ color: muted }}>
                {preview.modules[activeModule].description}
              </p>
              {preview.modules[activeModule].metrics ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {preview.modules[activeModule].metrics!.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-lg border px-3 py-2"
                      style={{ borderColor: border, backgroundColor: dark ? "#1e293b" : "#f8fafc" }}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: muted }}>
                        {m.label}
                      </p>
                      <p className="mt-0.5 text-sm font-bold" style={{ color: text }}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
