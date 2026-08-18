"use client";

import { Activity } from "lucide-react";
import { PortalPage, PortalStatCard } from "@/components/admin/PortalPage";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { PREVIEW_CARD_VALUES } from "@/template-engine/dashboard-mock-data";
import { DASHBOARD_CARD_CATALOG } from "@/templates/modules";
import type { DashboardCardId } from "@/templates/types";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";
import { usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { cn } from "@/lib/utils";

type TemplateDashboardProps = {
  cards: DashboardCardId[];
  className?: string;
};

export function TemplateDashboard({ cards, className }: TemplateDashboardProps) {
  const { primaryColor, secondaryColor, templateConfig } = useBusinessTemplate();
  const { money } = usePharmacyMarket();
  const isPharmacy = templateConfig?.industryId === "pharmacy";
  const { data: live } = usePharmacyQuery<Record<string, number>>(isPharmacy ? "/pharmacy-reports/dashboard" : null);

  const formatValue = (id: DashboardCardId) => {
    if (isPharmacy && live && live[id] != null) {
      const raw = live[id];
      if (id === "today-sales" || id === "batch-value") {
        return money(Number(raw));
      }
      return String(raw);
    }
    return PREVIEW_CARD_VALUES[id] ?? "—";
  };

  if (!cards.length) {
    return (
      <PortalPage className={className}>
        <p className="rounded-xl border border-[#e2e8f0] bg-white p-8 text-center text-sm text-[#64748b]">
          No dashboard cards configured for this business.
        </p>
      </PortalPage>
    );
  }

  const accentCards = cards.slice(0, 2);
  const statCards = cards.slice(2);

  return (
    <PortalPage className={className}>
      {accentCards.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {accentCards.map((id, index) => {
            const meta = DASHBOARD_CARD_CATALOG[id];
            const value = formatValue(id);
            const bg = index === 0 ? primaryColor : secondaryColor;
            return (
              <article
                key={id}
                className="relative min-h-[200px] overflow-hidden rounded-2xl border p-6 text-white flex flex-col justify-between"
                style={{ backgroundColor: bg, borderColor: `${bg}88` }}
              >
                <div>
                  <p className="text-sm font-medium text-white/80">{meta?.label ?? id}</p>
                  {meta?.description ? (
                    <p className="mt-1 text-xs text-white/65">{meta.description}</p>
                  ) : null}
                </div>
                <div>
                  <h3 className="text-4xl font-bold">{value}</h3>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {statCards.length ? (
        <div className={cn("grid grid-cols-1 gap-4", statCards.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
          {statCards.map((id, index) => {
            const meta = DASHBOARD_CARD_CATALOG[id];
            const value = formatValue(id);
            const tone = index % 3 === 0 ? "primary" : index % 3 === 1 ? "secondary" : "accent";
            return (
              <PortalStatCard
                key={id}
                label={meta?.label ?? id}
                value={value}
                icon={Activity}
                tone={tone}
              />
            );
          })}
        </div>
      ) : null}

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Configured KPI cards</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Dashboard layout follows your industry template.
          {isPharmacy ? " Values below are live pharmacy KPIs." : " Live data integration will replace sample values."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {cards.map((id) => (
            <span
              key={id}
              className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-medium text-[#334155]"
            >
              {DASHBOARD_CARD_CATALOG[id]?.label ?? id}
            </span>
          ))}
        </div>
      </section>
    </PortalPage>
  );
}
