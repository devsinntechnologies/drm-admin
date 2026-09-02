"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Calendar,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Receipt,
  Search,
  Settings,
  Shapes,
  ShoppingCart,
  Store,
  Timer,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { IndustryIcon } from "@/components/templates/IndustryIcon";
import { TemplateDashboardAnalytics } from "@/components/templates/TemplateDashboardAnalytics";
import { DASHBOARD_CARD_CATALOG } from "@/templates/modules";
import { PREVIEW_CARD_VALUES } from "@/template-engine/dashboard-mock-data";
import type { DashboardCardId, ModuleId, ThemeMode } from "@/templates/types";
import { cn } from "@/lib/utils";

const MODULE_ICONS: Partial<Record<ModuleId, LucideIcon>> = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  orders: ShoppingCart,
  sales: Receipt,
  products: LayoutGrid,
  categories: Shapes,
  inventory: Package,
  purchases: CreditCard,
  customers: Users,
  staff: Users,
  reports: Activity,
  settings: Settings,
  tables: Store,
  kitchen: UtensilsCrossed,
  menu: UtensilsCrossed,
  appointments: Calendar,
  "billing-pricing": Timer,
  "credit-udhar": CreditCard,
};

export type ShellNavItem = {
  moduleId: ModuleId | string;
  label: string;
};

type IndustryShellPreviewProps = {
  businessName: string;
  industryIcon?: string;
  logoDataUrl?: string | null;
  themeMode?: ThemeMode;
  primaryColor?: string;
  secondaryColor?: string;
  navItems: ShellNavItem[];
  dashboardCards: DashboardCardId[];
  dashboardCardItems?: Array<{ id: string; label: string; value: string; description?: string }>;
  productsLabel?: string;
  device?: "desktop" | "tablet" | "mobile";
  size?: "compact" | "embed" | "full";
  activeModuleId?: string;
  onNavChange?: (moduleId: string) => void;
  children?: React.ReactNode;
  className?: string;
};

function resolveModuleIcon(moduleId: string): LucideIcon {
  return MODULE_ICONS[moduleId as ModuleId] ?? LayoutGrid;
}

export function IndustryShellPreview({
  businessName,
  industryIcon,
  logoDataUrl,
  themeMode = "light",
  primaryColor = "#001840",
  secondaryColor = "#0050F8",
  navItems,
  dashboardCards,
  dashboardCardItems,
  productsLabel = "Products",
  device = "desktop",
  size = "compact",
  activeModuleId,
  onNavChange,
  children,
  className,
}: IndustryShellPreviewProps) {
  const [internalNav, setInternalNav] = useState(navItems[0]?.moduleId ?? "dashboard");
  const activeNav = activeModuleId ?? internalNav;
  const dark = themeMode === "dark";
  const full = size === "full";
  const embed = size === "embed";

  const cards = useMemo(
    () =>
      dashboardCardItems ??
      dashboardCards.map((id) => ({
        id,
        label: DASHBOARD_CARD_CATALOG[id]?.label ?? id,
        value: PREVIEW_CARD_VALUES[id] ?? "—",
        description: DASHBOARD_CARD_CATALOG[id]?.description ?? "",
      })),
    [dashboardCards, dashboardCardItems],
  );

  const previewSize = full ? "full" : embed ? "embed" : "compact";

  const t = {
    brandTitle: full ? "text-sm" : embed ? "text-xs" : "text-[10px]",
    brandSub: full ? "text-xs" : embed ? "text-[10px]" : "text-[9px]",
    navLabel: full ? "text-xs" : embed ? "text-[10px]" : "text-[8px]",
    navItem: full ? "text-sm" : embed ? "text-[11px]" : "text-[9px]",
    navIcon: full ? "h-8 w-8" : embed ? "h-6 w-6" : "h-5 w-5",
    navIconInner: full ? "h-4 w-4" : embed ? "h-3 w-3" : "h-2.5 w-2.5",
    headerTitle: full ? "text-lg md:text-xl" : embed ? "text-sm" : "text-[10px]",
    headerSub: full ? "text-xs md:text-sm" : embed ? "text-[10px]" : "text-[8px]",
    dashTitle: full ? "text-xl md:text-2xl" : embed ? "text-base" : "text-[11px]",
    dashSub: full ? "text-sm" : embed ? "text-[11px]" : "text-[8px]",
    iconBox: full ? "h-14 w-14" : embed ? "h-10 w-10" : "h-7 w-7",
    iconInner: full ? "h-7 w-7" : embed ? "h-5 w-5" : "h-3.5 w-3.5",
    sidebarPad: full ? "px-4 py-4" : embed ? "px-3 py-3" : "px-2.5 py-2.5",
    navPad: full ? "px-2 py-4" : embed ? "px-2 py-3" : "px-1.5 py-2",
    mainPad: full ? "px-4 py-6 sm:px-6 lg:px-10" : embed ? "p-4" : "p-2.5",
  };

  const shellThemeStyle = {
    ["--shell-primary" as string]: primaryColor,
    ["--shell-secondary" as string]: secondaryColor,
  } as React.CSSProperties;

  const setActiveNav = (moduleId: string) => {
    onNavChange?.(moduleId);
    if (!activeModuleId) setInternalNav(moduleId);
  };

  const showSidebar = device !== "mobile";
  const sidebarWidth = full
    ? "w-64 lg:w-72"
    : embed
      ? "w-[220px]"
      : device === "tablet"
        ? "w-[34%]"
        : "w-[38%]";

  const shellMinHeight = full
    ? "min-h-[calc(100vh-52px)]"
    : embed
      ? "min-h-[520px]"
      : "min-h-[360px]";

  return (
    <div
      className={cn(
        "industry-shell-preview overflow-hidden border border-[#dbe4ef] bg-[#f1f5f9]",
        !full && !embed && "rounded-xl",
        !full && !embed && device === "tablet" && "mx-auto w-[88%]",
        !full && !embed && device === "mobile" && "mx-auto w-[72%]",
        full && "min-h-full rounded-none border-x-0 border-t-0",
        embed && "rounded-lg",
        className,
      )}
      style={shellThemeStyle}
      data-size={full ? "full" : embed ? "embed" : "compact"}
      data-theme={themeMode}
    >
      <div className={cn("flex", shellMinHeight, dark ? "bg-[#0b1220]" : "bg-[#f1f5f9]")}>
        {showSidebar ? (
          <aside
            className={cn(
              "shell-surface flex shrink-0 flex-col border-r border-[#dbe4ef] bg-white",
              sidebarWidth,
            )}
          >
            <div className={cn("border-b border-[#edf2f7]", t.sidebarPad)}>
              <div className="flex items-center gap-2">
                {logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoDataUrl}
                    alt=""
                    className={cn("shrink-0 rounded-md border border-[#e2e8f0] object-contain", full ? "h-10 w-10" : embed ? "h-8 w-8" : "h-6 w-6")}
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo-mark.svg"
                      alt=""
                      width={full ? 48 : embed ? 36 : 28}
                      height={full ? 40 : embed ? 30 : 24}
                      className={cn("w-auto shrink-0 object-contain", full ? "h-10" : embed ? "h-8" : "h-6")}
                    />
                  </>
                )}
                <div className="min-w-0">
                  <p className={cn("truncate font-semibold leading-tight", t.brandTitle, dark ? "text-slate-100" : "text-[#0f172a]")}>
                    {businessName || "Business"}
                  </p>
                  <p className={cn("truncate font-medium", t.brandSub, dark ? "text-slate-400" : "text-[#667085]")}>
                    Business Workspace
                  </p>
                </div>
              </div>
            </div>

            <div className={cn("flex-1", t.navPad)}>
              <p className={cn("mb-1.5 px-1.5 font-semibold uppercase tracking-[0.12em] text-[#94a3b8]", full ? "mb-3" : "", t.navLabel)}>
                Navigation
              </p>
              <nav className={cn(full ? "space-y-1" : embed ? "space-y-0.5" : "space-y-0.5")}>
                {(full ? navItems : navItems.slice(0, embed ? 10 : 8)).map((item) => {
                  const active = activeNav === item.moduleId;
                  const Icon = resolveModuleIcon(item.moduleId);
                  return (
                    <button
                      key={item.moduleId}
                      type="button"
                      onClick={() => setActiveNav(item.moduleId)}
                      data-active={active ? "true" : undefined}
                      className={cn(
                        "shell-nav-item group flex w-full min-w-0 items-center text-left font-semibold transition-all",
                        full ? "gap-3 rounded-lg py-3" : embed ? "gap-2 rounded-md py-2" : "gap-1.5 rounded-md py-1.5",
                        t.navItem,
                        !active && "text-[#475569]",
                        (full || embed) && "px-3",
                      )}
                    >
                      <span
                        className={cn(
                          "shell-nav-icon grid shrink-0 place-items-center rounded-lg transition-colors",
                          t.navIcon,
                          !full && !embed && "rounded-md",
                          active
                            ? "bg-white/15 text-white"
                            : "bg-[#f1f5f9] text-[#64748b] group-hover:bg-white",
                        )}
                      >
                        <Icon className={t.navIconInner} strokeWidth={2} />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className={cn("shell-surface flex items-center justify-between gap-2 border-b border-[#dbe4ef] bg-white", full ? "px-4 py-3 lg:px-6" : embed ? "px-3 py-2.5" : "px-2.5 py-2")}>
            <div className="min-w-0">
              <p className={cn("truncate font-semibold", t.headerTitle, dark ? "text-slate-100" : "text-[#0f172a]")}>
                DigiNizam
              </p>
              <p className={cn("truncate font-medium", t.headerSub, dark ? "text-slate-400" : "text-[#58657a]")}>
                Business Workspace
              </p>
            </div>
            <div className={cn("flex items-center gap-1", (full || embed) && "gap-2")}>
              <div className={cn("relative", full ? "hidden max-w-sm flex-1 lg:block" : embed ? "hidden sm:block" : "hidden sm:flex")}>
                <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#94a3b8]", full ? "left-3 h-4 w-4" : embed ? "left-2 h-3 w-3" : "left-1.5 h-2.5 w-2.5")} />
                <div
                  className={cn(
                    "rounded-md border border-[#e2e8f0] bg-[#f8fafc]",
                    full ? "h-10 w-56 rounded-xl pl-9" : embed ? "h-7 w-28 pl-7" : "h-6 w-20 pl-6",
                  )}
                />
              </div>
              <div className={cn("grid place-items-center rounded-md border border-[#e2e8f0] bg-white text-[#64748b]", full ? "h-10 w-10 rounded-xl" : embed ? "h-7 w-7" : "h-6 w-6")}>
                <Bell className={cn(full ? "h-4 w-4" : embed ? "h-3 w-3" : "h-2.5 w-2.5")} />
              </div>
            </div>
          </header>

          <main className={cn("flex-1 overflow-auto", t.mainPad, dark ? "text-white" : "text-[#0f172a]")}>
            {children ?? (
              <div className={cn(full ? "mx-auto max-w-[1440px] space-y-6" : embed ? "space-y-4" : "space-y-2.5")}>
                <section className={cn(full && "portal-header !p-5")}>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn("grid shrink-0 place-items-center rounded-lg border", t.iconBox)}
                      style={{
                        color: secondaryColor,
                        backgroundColor: `${secondaryColor}14`,
                        borderColor: `${secondaryColor}33`,
                      }}
                    >
                      {industryIcon ? (
                        <IndustryIcon name={industryIcon} className={t.iconInner} />
                      ) : (
                        <LayoutDashboard className={t.iconInner} style={{ color: secondaryColor }} />
                      )}
                    </div>
                    <div>
                      <p className={cn("font-bold text-[#0f172a]", t.dashTitle)}>Dashboard</p>
                      <p className={cn("text-[#64748b]", t.dashSub)}>
                        Today&apos;s operational overview for your business
                      </p>
                    </div>
                  </div>
                </section>

                <TemplateDashboardAnalytics
                  accentCards={cards}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  size={previewSize}
                />

                {!full && !embed ? (
                  <p className="text-[8px] text-[#94a3b8]">
                    {productsLabel} · {navItems.length} modules · {themeMode} theme
                  </p>
                ) : null}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
