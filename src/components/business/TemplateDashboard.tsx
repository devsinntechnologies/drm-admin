"use client";

import { Activity, Flame, TriangleAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import Loading from "@/components/common/Loading";
import { PortalCard, PortalPage, PortalStatCard } from "@/components/admin/PortalPage";
import { DashboardReportsSection } from "@/components/business/DashboardReportsSection";
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

type InvoiceRevenue = {
  paid?: number;
  pending?: number;
  total?: number;
};

type InvoiceTopProduct = {
  productId?: string;
  name?: string;
  quantity?: number;
  revenue?: number;
};

type InvoiceDashboard = {
  revenue?: {
    daily?: InvoiceRevenue;
    monthly?: InvoiceRevenue;
  };
  invoices?: { totalPending?: number; pendingAmount?: number };
  orders?: {
    activeOrders?: number;
    totalOrdersDaily?: number;
    totalOrdersMonthly?: number;
    completedOrdersMonthly?: number;
  };
  graph?: {
    topSellingProducts?: InvoiceTopProduct[];
  };
};

type StockSummary = {
  lowStockCount?: number;
  outOfStockCount?: number;
  recentAlerts?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    currentStock?: number;
    inStock?: number;
  }>;
};

export function TemplateDashboard({ cards, className }: TemplateDashboardProps) {
  const pathname = usePathname();
  const { refreshKey } = useDashboardRefresh();
  const { primaryColor, secondaryColor, templateConfig } = useBusinessTemplate();
  const { money } = usePharmacyMarket();
  const industryId = templateConfig?.industryId;
  const isPharmacy = industryId === "pharmacy";
  const queryRefreshKey = `${refreshKey}:${pathname}`;

  const { data: pharmacyLive, loading: pharmacyLoading } = usePharmacyQuery<Record<string, number>>(
    isPharmacy ? "/pharmacy-reports/dashboard" : null,
    queryRefreshKey,
  );
  const { data: invoiceLive, loading: invoiceLoading } = usePharmacyQuery<InvoiceDashboard>(
    isPharmacy ? null : `/dashboard/full?tzOffsetMinutes=${-new Date().getTimezoneOffset()}`,
    queryRefreshKey,
  );
  const { data: stockLive, loading: stockLoading } = usePharmacyQuery<StockSummary>(
    isPharmacy ? null : "/stock-management/dashboard/summary",
    queryRefreshKey,
  );

  const liveLoading = isPharmacy ? pharmacyLoading : invoiceLoading || stockLoading;

  const formatValue = (id: DashboardCardId) => {
    if (liveLoading) {
      return "…";
    }

    if (isPharmacy && pharmacyLive && pharmacyLive[id] != null) {
      const raw = pharmacyLive[id];
      if (id === "today-sales" || id === "batch-value") {
        return money(Number(raw));
      }
      return String(raw);
    }

    const daily = invoiceLive?.revenue?.daily;
    const dailyTotal = Number(daily?.total ?? 0);
    const dailyPaid = Number(daily?.paid ?? 0);
    const dailyCount = Number(invoiceLive?.orders?.totalOrdersDaily ?? 0);
    const topName = invoiceLive?.graph?.topSellingProducts?.[0]?.name;
    const pendingInvoices = Number(invoiceLive?.invoices?.totalPending ?? 0);

    switch (id) {
      case "today-sales":
        return money(dailyTotal);
      case "total-transactions":
        return String(dailyCount);
      case "avg-order-value":
        return money(dailyCount > 0 ? dailyTotal / dailyCount : 0);
      case "gross-profit":
        return money(dailyPaid);
      case "low-stock":
      case "low-stock-ingredients":
      case "low-stock-sizes":
      case "ingredient-shortage":
        return String(stockLive?.lowStockCount ?? 0);
      case "pending-purchases":
        return String(pendingInvoices);
      case "active-orders":
      case "orders-in-progress":
      case "customer-orders":
        return String(invoiceLive?.orders?.activeOrders ?? 0);
      case "top-products":
      case "fast-moving-parts":
      case "best-selling-item":
      case "fast-selling":
      case "best-selling-books":
      case "top-vehicle-brands":
      case "top-brands":
      case "top-authors":
      case "best-collection":
        return topName || "—";
      case "warranty-claims":
      case "product-returns":
      case "returns-exchanges":
        return "0";
      case "inventory-value":
        return money(Number(invoiceLive?.revenue?.monthly?.total ?? dailyTotal));
      default:
        return "—";
    }
  };

  const liveLabel = isPharmacy
    ? " Values below are live pharmacy KPIs."
    : " Values below are calculated from issued invoices and live stock.";

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
  const lowStockItems = (stockLive?.recentAlerts ?? []).filter(
    (item) => item.productName || item.productId,
  );
  const topProducts = invoiceLive?.graph?.topSellingProducts ?? [];

  return (
    <PortalPage className={className}>
      <RoleGuideBanner />

      {liveLoading ? (
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

      {!isPharmacy ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PortalCard title="Low Stock" subtitle="Items at or below reorder threshold" icon={TriangleAlert}>
            {liveLoading ? (
              <Loading size="sm" />
            ) : lowStockItems.length ? (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id ?? `${item.productId}-${item.productName ?? "item"}`}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.productName || "Stock alert"}
                    </p>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-300">
                      {item.currentStock ?? item.inStock ?? 0} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">All stocked items are above threshold</p>
            )}
          </PortalCard>

          <PortalCard title="Top-Selling Products" subtitle="Best sellers from today's invoices" icon={Flame}>
            {liveLoading ? (
              <Loading size="sm" />
            ) : topProducts.length ? (
              <div className="space-y-2">
                {topProducts.map((item, index) => (
                  <div
                    key={item.productId ?? `${item.name}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-primary-soft)] text-xs font-bold text-[var(--brand-secondary)]">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.name ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--brand-secondary)]">{Number(item.quantity ?? 0)} sold</p>
                      <p className="text-xs text-[var(--text-muted)]">{money(Number(item.revenue ?? 0))}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">No invoices recorded yet</p>
            )}
          </PortalCard>
        </div>
      ) : null}

      <DashboardReportsSection />

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Configured KPI cards</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Dashboard layout follows your industry template.
          {liveLabel}
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
