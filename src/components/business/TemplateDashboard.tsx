"use client";

import { Activity } from "lucide-react";
import { PortalPage, PortalStatCard } from "@/components/admin/PortalPage";
import { RoleGuideBanner } from "@/components/admin/RoleGuideBanner";
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

type RetailDashboard = {
  todaySales: number;
  totalTransactions: number;
  grossProfit: number;
  lowStockCount: number;
  pendingPurchases: number;
};

type TopProduct = {
  productName: string;
  quantitySold: number;
};

export function TemplateDashboard({ cards, className }: TemplateDashboardProps) {
  const { primaryColor, secondaryColor, templateConfig } = useBusinessTemplate();
  const { money } = usePharmacyMarket();
  const industryId = templateConfig?.industryId;
  const isPharmacy = industryId === "pharmacy";
  const isRetail = industryId === "retail-store";

  const { data: pharmacyLive } = usePharmacyQuery<Record<string, number>>(
    isPharmacy ? "/pharmacy-reports/dashboard" : null,
  );
  const { data: retailLive } = usePharmacyQuery<RetailDashboard>(
    isRetail ? "/retail/reports/dashboard" : null,
  );

  const today = new Date().toISOString().slice(0, 10);
  const needsTopProduct = isRetail && cards.includes("top-products");
  const { data: topProducts } = usePharmacyQuery<TopProduct[]>(
    needsTopProduct ? `/retail/reports/top-products?fromDate=${today}&toDate=${today}&limit=1` : null,
  );

  const formatValue = (id: DashboardCardId) => {
    if (isPharmacy && pharmacyLive && pharmacyLive[id] != null) {
      const raw = pharmacyLive[id];
      if (id === "today-sales" || id === "batch-value") {
        return money(Number(raw));
      }
      return String(raw);
    }

    if (isRetail && retailLive) {
      switch (id) {
        case "today-sales":
          return money(Number(retailLive.todaySales));
        case "total-transactions":
          return String(retailLive.totalTransactions);
        case "gross-profit":
          return money(Number(retailLive.grossProfit));
        case "low-stock":
          return String(retailLive.lowStockCount);
        case "pending-purchases":
          return String(retailLive.pendingPurchases);
        case "top-products":
          return topProducts?.[0]?.productName ?? "—";
        default:
          break;
      }
    }

    return PREVIEW_CARD_VALUES[id] ?? "—";
  };

  const liveLabel = isPharmacy
    ? " Values below are live pharmacy KPIs."
    : isRetail
      ? " Values below are live retail KPIs."
      : " Live data integration will replace sample values.";

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
      <RoleGuideBanner />
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
          {(isPharmacy || isRetail) ? liveLabel : " Live data integration will replace sample values."}
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
