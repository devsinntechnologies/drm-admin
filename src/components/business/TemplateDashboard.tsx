"use client";

import { Activity, Flame, TriangleAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import Loading from "@/components/common/Loading";
import { PortalCard, PortalPage, PortalStatCard } from "@/components/admin/PortalPage";
import { RoleGuideBanner } from "@/components/admin/RoleGuideBanner";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useDashboardRefresh } from "@/contexts/DashboardRefreshContext";
import { DASHBOARD_CARD_CATALOG } from "@/templates/modules";
import type { DashboardCardId } from "@/templates/types";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";
import { usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { cn } from "@/lib/utils";

type TemplateDashboardProps = {
  cards: DashboardCardId[];
  className?: string;
};

type LowStockItem = {
  productId: string;
  variantId?: string;
  productName: string;
  inStock: number;
  stockCount?: number | null;
};

type TopProduct = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
};

type RetailDashboard = {
  todaySales: number;
  totalTransactions: number;
  grossProfit: number;
  totalRefunded?: number;
  lowStockCount: number;
  lowStockProducts?: LowStockItem[];
  topProducts?: TopProduct[];
  pendingPurchases: number;
};

export function TemplateDashboard({ cards, className }: TemplateDashboardProps) {
  const pathname = usePathname();
  const { refreshKey } = useDashboardRefresh();
  const { primaryColor, secondaryColor, templateConfig } = useBusinessTemplate();
  const { money } = usePharmacyMarket();
  const industryId = templateConfig?.industryId;
  const isPharmacy = industryId === "pharmacy";
  const isRetail = industryId === "retail-store";
  const queryRefreshKey = `${refreshKey}:${pathname}`;

  const { data: pharmacyLive, loading: pharmacyLoading } = usePharmacyQuery<Record<string, number>>(
    isPharmacy ? "/pharmacy-reports/dashboard" : null,
    queryRefreshKey,
  );
  const { data: retailLive, loading: retailLoading } = usePharmacyQuery<RetailDashboard>(
    isRetail ? "/retail/reports/dashboard" : null,
    queryRefreshKey,
  );

  const liveLoading = (isPharmacy && pharmacyLoading) || (isRetail && retailLoading);
  const hasLiveSource = isPharmacy || isRetail;

  const formatValue = (id: DashboardCardId) => {
    if (liveLoading && hasLiveSource) {
      return "…";
    }

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
          return retailLive.topProducts?.[0]?.productName ?? "—";
        default:
          break;
      }
    }

    if (hasLiveSource) {
      return "—";
    }

    return "—";
  };

  const liveLabel = isPharmacy
    ? " Values below are live pharmacy KPIs."
    : isRetail
      ? " Values below are live retail KPIs."
      : " Live data integration will replace sample values.";

  if (!cards.length) {
    return (
      <PortalPage className={className}>
        <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">
          No dashboard cards configured for this business.
        </p>
      </PortalPage>
    );
  }

  const accentCards = cards.slice(0, 2);
  const statCards = cards.slice(2);
  const lowStockItems = retailLive?.lowStockProducts ?? [];
  const topProducts = retailLive?.topProducts ?? [];

  return (
    <PortalPage className={className}>
      <RoleGuideBanner />

      {liveLoading && hasLiveSource ? (
        <div className="flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] py-6">
          <Loading size="sm" label="Loading latest dashboard data…" />
        </div>
      ) : null}

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

      {isRetail ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PortalCard title="Low Stock" subtitle="Items at or below reorder threshold" icon={TriangleAlert}>
            {liveLoading ? (
              <Loading size="sm" />
            ) : lowStockItems.length ? (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId ?? "base"}`}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.productName}</p>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-300">
                      {item.inStock} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">All stocked items are above threshold</p>
            )}
          </PortalCard>

          <PortalCard title="Top-Selling Products" subtitle="Best sellers today (net of returns)" icon={Flame}>
            {liveLoading ? (
              <Loading size="sm" />
            ) : topProducts.length ? (
              <div className="space-y-2">
                {topProducts.map((item, index) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-primary-soft)] text-xs font-bold text-[var(--brand-secondary)]">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--brand-secondary)]">{item.quantitySold} sold</p>
                      <p className="text-xs text-[var(--text-muted)]">{money(item.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">No sales recorded today yet</p>
            )}
          </PortalCard>
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
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]"
            >
              {DASHBOARD_CARD_CATALOG[id]?.label ?? id}
            </span>
          ))}
        </div>
      </section>
    </PortalPage>
  );
}
