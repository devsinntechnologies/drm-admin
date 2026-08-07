"use client";

import {
  CheckCircle2,
  Clock3,
  Flame,
  PieChart,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  TriangleAlert,
  Utensils,
} from "lucide-react";
import {
  PREVIEW_DASHBOARD_STATS,
  PREVIEW_ORDER_SLICES,
  PREVIEW_RECENT_ORDERS,
  PREVIEW_TOP_PRODUCTS,
  type PreviewOrderSlice,
} from "@/template-engine/dashboard-mock-data";
import { cn } from "@/lib/utils";

export type DashboardCardItem = {
  id: string;
  label: string;
  value: string;
  description?: string;
};

type PreviewSize = "full" | "embed" | "compact";

type TemplateDashboardAnalyticsProps = {
  accentCards: DashboardCardItem[];
  primaryColor: string;
  secondaryColor: string;
  size?: PreviewSize;
  className?: string;
};

function DonutChart({
  slices,
  size,
}: {
  slices: PreviewOrderSlice[];
  size: PreviewSize;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const config =
    size === "full"
      ? { box: "h-44 w-44", view: 176, cx: 88, cy: 88, radius: 58, stroke: 28, inset: 30 }
      : size === "embed"
        ? { box: "h-28 w-28", view: 112, cx: 56, cy: 56, radius: 36, stroke: 18, inset: 18 }
        : { box: "h-[72px] w-[72px]", view: 88, cx: 44, cy: 44, radius: 28, stroke: 14, inset: 14 };

  const circumference = 2 * Math.PI * config.radius;
  let offset = 0;

  return (
    <div className={cn("relative shrink-0", config.box)}>
      <svg viewBox={`0 0 ${config.view} ${config.view}`} className="h-full w-full -rotate-90" aria-hidden>
        {slices.map((slice, index) => {
          const dash = (slice.value / total) * circumference;
          const circle = (
            <circle
              key={`${slice.color}-${index}`}
              cx={config.cx}
              cy={config.cy}
              r={config.radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={config.stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div
        className="absolute rounded-full bg-white shadow-inner"
        style={{ inset: config.inset }}
      />
    </div>
  );
}

export function TemplateDashboardAnalytics({
  accentCards,
  primaryColor,
  secondaryColor,
  size = "full",
  className,
}: TemplateDashboardAnalyticsProps) {
  const full = size === "full";
  const embed = size === "embed";

  const t = {
    sectionGap: full ? "space-y-6" : embed ? "space-y-4" : "space-y-2.5",
    accentGrid: full ? "grid-cols-1 gap-4 md:grid-cols-2" : embed ? "grid-cols-2 gap-3" : "grid-cols-2 gap-1.5",
    accentPad: full ? "!rounded-2xl !p-5 min-h-[180px]" : embed ? "!p-4 min-h-[120px]" : "p-2",
    cardLabel: full ? "text-sm" : embed ? "text-[11px]" : "text-[8px]",
    cardValue: full ? "text-4xl" : embed ? "text-xl" : "text-sm",
    cardSub: full ? "text-sm" : embed ? "text-[10px]" : "text-[8px]",
    panelPad: full ? "portal-card !p-5" : embed ? "rounded-lg border border-[#e2e8f0] bg-white p-3" : "rounded-lg border border-[#e2e8f0] bg-white p-2",
    panelTitle: full ? "text-base" : embed ? "text-xs" : "text-[10px]",
    panelSub: full ? "text-sm" : embed ? "text-[10px]" : "text-[8px]",
    legendText: full ? "text-sm" : embed ? "text-[10px]" : "text-[8px]",
    statGrid: full ? "grid-cols-1 gap-4 md:grid-cols-3" : embed ? "grid-cols-3 gap-2" : "grid-cols-3 gap-1.5",
    statPad: full ? "portal-stat-card" : embed ? "p-2.5" : "p-1.5",
    statLabel: full ? "text-xs" : embed ? "text-[9px]" : "text-[7px]",
    statValue: full ? "text-2xl" : embed ? "text-base" : "text-xs",
    statIcon: full ? "h-10 w-10" : embed ? "h-7 w-7" : "h-5 w-5",
    statIconInner: full ? "h-5 w-5" : embed ? "h-3.5 w-3.5" : "h-2.5 w-2.5",
    listGrid: full ? "grid-cols-1 gap-4 lg:grid-cols-2" : embed ? "grid-cols-2 gap-3" : "hidden",
    rowPad: full ? "p-4" : embed ? "p-2.5" : "p-2",
    rowTitle: full ? "text-sm" : embed ? "text-[11px]" : "text-[9px]",
    rowSub: full ? "text-sm" : embed ? "text-[9px]" : "text-[8px]",
    avatar: full ? "h-14 w-14" : embed ? "h-9 w-9" : "h-8 w-8",
    orderBadge: full ? "h-11 w-11 text-sm" : embed ? "h-7 w-7 text-[10px]" : "h-6 w-6 text-[9px]",
  };

  const orderSlices: PreviewOrderSlice[] = PREVIEW_ORDER_SLICES.map((slice, index) => ({
    ...slice,
    color: index === 0 ? secondaryColor : index === 1 ? primaryColor : `${secondaryColor}99`,
  }));

  const kpiCards =
    accentCards.length >= 2
      ? accentCards.slice(0, 2)
      : [
          { id: "active-orders", label: "Active Orders", value: "11", description: PREVIEW_DASHBOARD_STATS.activeOrdersSub },
          { id: "low-stock", label: "Low Stock Alerts", value: "14", description: PREVIEW_DASHBOARD_STATS.lowStockSub },
        ];

  const kpiIcons = [ShoppingBag, TriangleAlert];
  const kpiSubs = [PREVIEW_DASHBOARD_STATS.activeOrdersSub, PREVIEW_DASHBOARD_STATS.lowStockSub];

  const statItems = [
    { label: "Total Orders", value: String(PREVIEW_DASHBOARD_STATS.totalOrders), icon: ShoppingCart, tone: primaryColor },
    { label: "Pending Invoices", value: String(PREVIEW_DASHBOARD_STATS.pendingInvoices), icon: ReceiptText, tone: secondaryColor },
    { label: "Completion Rate", value: `${PREVIEW_DASHBOARD_STATS.completionRate}%`, icon: CheckCircle2, tone: secondaryColor },
  ];

  const topProducts = full ? PREVIEW_TOP_PRODUCTS : PREVIEW_TOP_PRODUCTS.slice(0, embed ? 3 : 2);
  const recentOrders = full ? PREVIEW_RECENT_ORDERS : PREVIEW_RECENT_ORDERS.slice(0, embed ? 3 : 2);

  return (
    <div className={cn(t.sectionGap, className)}>
      <div className={cn("grid", t.accentGrid)}>
        {kpiCards.map((card, index) => {
          const Icon = kpiIcons[index] ?? ShoppingBag;
          return (
            <article
              key={card.id}
              className={cn(
                "portal-accent-card relative flex flex-col justify-between overflow-hidden text-white",
                t.accentPad,
              )}
              style={{
                backgroundColor: index === 0 ? primaryColor : secondaryColor,
              }}
            >
              <div className="relative z-10 flex items-start justify-between gap-2">
                <p className={cn("font-medium text-white/80", t.cardLabel)}>{card.label}</p>
                <div className={cn("rounded-xl bg-white/15", full ? "p-2.5" : embed ? "p-1.5" : "p-1")}>
                  <Icon className={cn(full ? "h-5 w-5" : embed ? "h-3.5 w-3.5" : "h-3 w-3")} />
                </div>
              </div>
              <div className="relative z-10">
                <p className={cn("font-bold", t.cardValue)}>{card.value}</p>
                {(full || embed) && (
                  <p className={cn("mt-1 text-white/75", t.cardSub)}>
                    {card.description || kpiSubs[index]}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <article className={cn(t.panelPad)}>
        <div className={cn("mb-3 flex items-start gap-2", embed && "mb-2", !full && !embed && "mb-1.5")}>
          <div
            className={cn("grid shrink-0 place-items-center rounded-lg", full ? "h-10 w-10" : embed ? "h-7 w-7" : "h-5 w-5")}
            style={{ backgroundColor: `${secondaryColor}14`, color: secondaryColor }}
          >
            <PieChart className={cn(full ? "h-5 w-5" : embed ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
          </div>
          <div>
            <p className={cn("font-semibold text-[#0f172a]", t.panelTitle)}>Order Status</p>
            <p className={cn("text-[#64748b]", t.panelSub)}>Current order distribution</p>
          </div>
        </div>
        <div className={cn("flex flex-col items-center justify-center gap-4", full && "sm:flex-row sm:gap-10", embed && "flex-row gap-4")}>
          <DonutChart slices={orderSlices} size={size} />
          <ul className={cn(full ? "space-y-3" : embed ? "space-y-1.5" : "space-y-1")}>
            {orderSlices.map((item) => (
              <li key={item.label} className={cn("flex items-center gap-2 font-semibold text-[#334155]", t.legendText)}>
                <span className={cn("rounded-sm", full ? "h-3 w-3" : embed ? "h-2 w-2" : "h-1.5 w-1.5")} style={{ backgroundColor: item.color }} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </article>

      <div className={cn("grid", t.statGrid)}>
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className={cn("rounded-lg border border-[#e2e8f0] bg-white", t.statPad)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={cn("font-semibold uppercase tracking-wider text-[#94a3b8]", t.statLabel)}>
                    {item.label}
                  </p>
                  <p className={cn("font-bold text-[#0f172a]", t.statValue)} style={{ color: item.tone }}>
                    {item.value}
                  </p>
                </div>
                <div
                  className={cn("grid shrink-0 place-items-center rounded-xl", t.statIcon)}
                  style={{ backgroundColor: `${item.tone}14`, color: item.tone }}
                >
                  <Icon className={t.statIconInner} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {(full || embed) && (
        <div className={cn("grid", t.listGrid)}>
          <article className={cn(t.panelPad)}>
            <div className={cn("mb-3 flex items-start gap-2", embed && "mb-2")}>
              <div
                className={cn("grid shrink-0 place-items-center rounded-lg", full ? "h-10 w-10" : "h-7 w-7")}
                style={{ backgroundColor: `${secondaryColor}14`, color: secondaryColor }}
              >
                <Flame className={cn(full ? "h-5 w-5" : "h-3.5 w-3.5")} />
              </div>
              <div>
                <p className={cn("font-semibold text-[#0f172a]", t.panelTitle)}>Top Products</p>
                <p className={cn("text-[#64748b]", t.panelSub)}>Best performers by revenue</p>
              </div>
            </div>
            <div className={cn(full ? "space-y-3" : "space-y-2")}>
              {topProducts.map((product) => (
                <div
                  key={product.id}
                  className={cn("flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fbff]", t.rowPad)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={cn("grid shrink-0 place-items-center rounded-xl border border-[#dbe4ef] bg-white", t.avatar)}>
                      <Utensils className={cn(full ? "h-6 w-6" : "h-4 w-4", "text-[#94a3b8]")} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("truncate font-semibold text-[#0f172a]", t.rowTitle)}>{product.name}</p>
                      <p className={cn("text-[#64748b]", t.rowSub)}>{product.stocks} in stock</p>
                    </div>
                  </div>
                  <p className={cn("shrink-0 font-bold", t.rowTitle)} style={{ color: secondaryColor }}>
                    {product.revenue}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className={cn(t.panelPad)}>
            <div className={cn("mb-3 flex items-start gap-2", embed && "mb-2")}>
              <div
                className={cn("grid shrink-0 place-items-center rounded-lg", full ? "h-10 w-10" : "h-7 w-7")}
                style={{ backgroundColor: `${primaryColor}14`, color: primaryColor }}
              >
                <Clock3 className={cn(full ? "h-5 w-5" : "h-3.5 w-3.5")} />
              </div>
              <div>
                <p className={cn("font-semibold text-[#0f172a]", t.panelTitle)}>Recent Orders</p>
                <p className={cn("text-[#64748b]", t.panelSub)}>Latest order activity</p>
              </div>
            </div>
            <div className={cn(full ? "space-y-3" : "space-y-2")}>
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className={cn("flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fbff]", t.rowPad)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn("grid shrink-0 place-items-center rounded-full font-bold", t.orderBadge)}
                      style={{ backgroundColor: `${secondaryColor}14`, color: primaryColor }}
                    >
                      {order.label}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("truncate font-semibold text-[#0f172a]", t.rowTitle)}>{order.title}</p>
                      <p className={cn("text-[#64748b]", t.rowSub)}>{order.ago}</p>
                    </div>
                  </div>
                  <div className={cn("flex shrink-0 items-center gap-2", embed ? "flex-col items-end gap-1" : "gap-3")}>
                    <span className={cn("font-semibold text-[#334155]", t.rowSub)}>{order.user}</span>
                    <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#059669]">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
