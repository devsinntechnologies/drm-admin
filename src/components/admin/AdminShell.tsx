"use client";
import Image from "next/image";
import Link from "next/link";
import { Activity, AppWindow, Building2, Crown, CreditCard, Globe2, LayoutGrid, LayoutTemplate, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Receipt, Bell, Shapes, ShoppingCart, Smartphone, Store, Users, UtensilsCrossed, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { usePathname, useRouter } from "next/navigation";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { buildBusinessWorkspaceNav, type WorkspaceNavTab } from "@/lib/build-business-workspace-nav";
import { appendBusinessId, pathnameToModuleId } from "@/lib/module-routes";
import {
  canAccessWorkspacePage,
  filterPharmacyNavForRole,
  isPharmacyStaffRole,
  workspaceHomePath,
} from "@/lib/pharmacy-role-nav";
import { toast } from "sonner";
import { resolveMediaUrl, businessInitials } from "@/lib/media-url";

type TabKey = string;

type AdminShellProps = {
  activeTab: TabKey;
  pageTitle?: string;
  pageSubtitle?: string;
  headerActions?: React.ReactNode;
  headerIcon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
};

const PATH_PAGE_TITLES: Record<string, string> = {
  "/dashboard/superAdmin": "DigiNizam Platform Console",
  "/dashboard/businessAdmin": "Dashboard",
  "/dashboard/superAdmin/businesses": "Business Management",
  "/dashboard/superAdmin/businesses/setup": "New business",
  "/dashboard/superAdmin/subscriptions": "Subscription Management",
  "/dashboard/superAdmin/industry-templates": "Industry Templates",
  "/dashboard/superAdmin/action-logs": "Action Logs",
  "/dashboard/businessAdmin/products": "Menu Items",
  "/dashboard/businessAdmin/categories": "Manage Categories",
  "/dashboard/businessAdmin/public-data": "Public Catalog",
  "/dashboard/businessAdmin/public-data/categories": "Public Catalog",
  "/dashboard/businessAdmin/public-data/products": "Public Catalog",
  "/dashboard/businessAdmin/public-data/catalog": "Public Catalog",
  "/dashboard/businessAdmin/tables": "Restaurant Tables",
  "/dashboard/businessAdmin/invoices": "Invoices",
  "/dashboard/businessAdmin/orders": "Orders",
  "/dashboard/businessAdmin/kitchen": "Kitchen Display",
  "/dashboard/businessAdmin/users": "Team",
  "/dashboard/businessAdmin/ingredients": "Inventory & Ingredients",
};

function resolvePageTitle(
  pathname: string,
  activeTab: TabKey,
  profileBusinessName?: string,
  templateNavLabel?: string,
): string {
  if (pathname.includes("/businesses/setup")) return "New business";

  if (profileBusinessName && /\/superAdmin\/businesses\/[^/]+$/.test(pathname)) {
    return profileBusinessName;
  }

  if (templateNavLabel) return templateNavLabel;

  const path = pathname.split("?")[0];
  if (PATH_PAGE_TITLES[path]) return PATH_PAGE_TITLES[path];

  return tabs.find((tab) => tab.key === activeTab)?.label ?? "Dashboard";
}

function isNavTabActive(tabKey: string, resolvedActiveTab: string, fallbackTab: string) {
  const current = resolvedActiveTab || fallbackTab;
  if (tabKey === current) return true;

  const aliases: Record<string, string[]> = {
    "public-data": ["public-catalog"],
    "public-catalog": ["public-data"],
    invoices: ["sales"],
    sales: ["invoices"],
    users: ["staff"],
    staff: ["users"],
  };
  return aliases[tabKey]?.includes(current) ?? false;
}

function NavTabLabel({
  label,
  inProgress,
  active,
}: {
  label: string;
  inProgress?: boolean;
  active: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 flex-1 items-center gap-2", active ? "text-white" : "text-[var(--text-primary)]")}>
      <span className="min-w-0 truncate">{label}</span>
      {inProgress ? (
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
            active ? "bg-white/20 text-white" : "bg-[#fef3c7] text-[#b45309]",
          )}
        >
          In Progress
        </span>
      ) : null}
    </span>
  );
}

const tabs: Array<WorkspaceNavTab> = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard", // This will be dynamically updated in useMemo for Super Admins // This will be dynamically updated in useMemo for Super Admins
    icon: <Crown className="h-5 w-5" />,
  },
  {
    key: "businesses",
    label: "Businesses",
    href: "/dashboard/superAdmin/businesses",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    href: "/dashboard/superAdmin/subscriptions",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    key: "industry-templates",
    label: "Industry Templates",
    href: "/dashboard/superAdmin/industry-templates",
    icon: <LayoutTemplate className="h-5 w-5" />,
  },
  {
    key: "action-logs",
    label: "Action Logs",
    href: "/dashboard/superAdmin/action-logs",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    key: "products",
    label: "Products",
    href: "/dashboard/businessAdmin/products",
    icon: <LayoutGrid className="h-5 w-5" />,
  },
  {
    key: "categories",
    label: "Categories",
    href: "/dashboard/businessAdmin/categories",
    icon: <Shapes className="h-5 w-5" />,
  },
  {
    key: "public-data",
    label: "Public Catalog",
    href: "/dashboard/businessAdmin/public-data",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    key: "website",
    label: "Website",
    href: "/dashboard/businessAdmin/website",
    icon: <AppWindow className="h-5 w-5" />,
  },
  {
    key: "software",
    label: "Software & Mobile",
    href: "/dashboard/businessAdmin/software",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    key: "tables",
    label: "Floor & Tables",
    href: "/dashboard/businessAdmin/tables",
    icon: <Store className="h-5 w-5" />,
  },
  {
    key: "invoices",
    label: "Invoices",
    href: "/dashboard/businessAdmin/invoices",
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    key: "orders",
    label: "Orders",
    href: "/dashboard/businessAdmin/orders",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    key: "kitchen",
    label: "Kitchen",
    href: "/dashboard/businessAdmin/kitchen",
    icon: <UtensilsCrossed className="h-5 w-5" />,
  },
  {
    key: "users",
    label: "Users",
    href: "/dashboard/businessAdmin/users",
    icon: <Users className="h-5 w-5" />,
  },
];

function SidebarBrand({
  title,
  logoSrc,
  color,
  usePlatformLogo,
}: {
  title: string;
  logoSrc: string | null;
  color: string;
  usePlatformLogo: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoSrc]);

  if (logoSrc && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoSrc}
        alt={title}
        className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain"
        onError={() => setFailed(true)}
      />
    );
  }

  if (usePlatformLogo) {
    return (
      <Image
        src="/logo-mark.png"
        alt="DigiNizam"
        width={48}
        height={40}
        className="h-10 w-auto shrink-0 object-contain"
        priority
      />
    );
  }

  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {businessInitials(title)}
    </span>
  );
}

export default function AdminShell({
  activeTab,
  pageTitle: pageTitleProp,
  pageSubtitle,
  headerActions,
  headerIcon: HeaderIcon,
  children,
}: AdminShellProps) {
  const { role, user, logout } = useAuth();
  const { templateConfig, primaryColor, secondaryColor, logoUrl, businessId: contextBusinessId } = useBusinessTemplate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resolvedRole, setResolvedRole] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const hookBusinessId = useActiveBusinessId();
  const businessId = contextBusinessId ?? hookBusinessId;
  const pathname = usePathname();
  const router = useRouter();
  const { data: activeBusiness } = useGetBusinessByIdQuery(businessId || "", {
    skip: !businessId,
  });

  const isBusinessSetup = pathname.includes("/businesses/setup");
  const profileBusinessIdMatch = !isBusinessSetup ? pathname.match(/\/superAdmin\/businesses\/([^/]+)$/) : null;
  const profileBusinessId = profileBusinessIdMatch?.[1];
  const { data: profileBusiness } = useGetBusinessByIdQuery(profileBusinessId || "", {
    skip: !profileBusinessId,
  });

  const resolvedActiveTab = pathnameToModuleId(pathname) ?? activeTab;
  const templateNavLabel = templateConfig?.navigation.find((item) => item.moduleId === resolvedActiveTab)?.label;

  const pageTitle = pageTitleProp ?? resolvePageTitle(pathname, resolvedActiveTab, profileBusiness?.businessName, templateNavLabel);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined") return;

    setSidebarCollapsed(localStorage.getItem("dn_sidebar_collapsed") === "true");

    const currentId = new URLSearchParams(window.location.search).get("businessId");

    if (currentId) {
      localStorage.setItem("businessId", currentId);
    }

    if (isMounted && !currentId && businessId && window.location.pathname.includes("/businessAdmin")) {
      const newParams = new URLSearchParams(window.location.search);
      newParams.set("businessId", businessId);
      router.replace(`${window.location.pathname}?${newParams.toString()}`);
    }

    const storedRole =
      role ?? localStorage.getItem("roleName") ?? localStorage.getItem("auth_role") ?? localStorage.getItem("role");
    if (storedRole) {
      setResolvedRole(storedRole);
    }

    if (!isMounted || !storedRole) return;

    const isSuperAdminPath = window.location.pathname.includes("/superAdmin");
    const isBusinessAdminPath = window.location.pathname.includes("/businessAdmin");
    const urlBusinessId = currentId ?? businessId;

    if (isSuperAdminPath && storedRole !== "super_admin") {
      router.replace("/dashboard");
      return;
    }

    if (isBusinessAdminPath && storedRole === "super_admin" && !urlBusinessId) {
      router.replace("/dashboard");
    }
  }, [role, businessId, isMounted, router, pathname]);

  useEffect(() => {
    if (!isMounted || !resolvedRole) return;
    const isPharmacyWorkspace =
      templateConfig?.industryId === "pharmacy" || isPharmacyStaffRole(resolvedRole);
    if (!isPharmacyWorkspace) return;
    const moduleId = pathnameToModuleId(pathname) || "dashboard";
    if (canAccessWorkspacePage(resolvedRole, moduleId)) return;
    router.replace(workspaceHomePath(resolvedRole, businessId));
  }, [isMounted, resolvedRole, pathname, templateConfig?.industryId, businessId, router]);

  const visibleTabs = useMemo(() => {
    // During SSR and first paint, we MUST return a static set of tabs that match the server
    if (!isMounted) {
      return tabs.filter((tab) => tab.key === "dashboard" || tab.key === "businesses" || tab.key === "subscriptions" || tab.key === "industry-templates" || tab.key === "action-logs");
    }

    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const isSuperAdminRoute = currentPath.includes("/superAdmin");
    const isBusinessAdminRoute = currentPath.includes("/businessAdmin");

    const isImpersonating = !!businessId && resolvedRole === "super_admin";
    const shouldShowBusinessTabs = isBusinessAdminRoute || isImpersonating || resolvedRole === "business_admin";

    if (shouldShowBusinessTabs && templateConfig && businessId) {
      const websiteTab: WorkspaceNavTab = {
        key: "website",
        label: "Website",
        href: appendBusinessId("/dashboard/businessAdmin/website", businessId),
        icon: <AppWindow className="h-5 w-5" />,
      };
      const softwareTab: WorkspaceNavTab = {
        key: "software",
        label: "Software & Mobile",
        href: appendBusinessId("/dashboard/businessAdmin/software", businessId),
        icon: <Smartphone className="h-5 w-5" />,
      };
      const workspaceTabs = [...buildBusinessWorkspaceNav(templateConfig, businessId), websiteTab, softwareTab];
      if (templateConfig.industryId === "pharmacy" || templateConfig.industryId === "retail-store") {
        return filterPharmacyNavForRole(workspaceTabs, resolvedRole);
      }
      return workspaceTabs;
    }

    let baseTabs;
    if (resolvedRole === "waiter" || resolvedRole === "kitchen") {
      baseTabs = tabs.filter((tab) => tab.key === "orders");
    } else if (isPharmacyStaffRole(resolvedRole)) {
      if (templateConfig && businessId) {
        return filterPharmacyNavForRole(buildBusinessWorkspaceNav(templateConfig, businessId), resolvedRole);
      }
      baseTabs = tabs.filter((tab) => tab.key === "dashboard" || tab.key === "pos" || tab.key === "products");
    } else if (shouldShowBusinessTabs) {
      baseTabs = tabs.filter((tab) => tab.key === "dashboard" || tab.key === "products" || tab.key === "categories" || tab.key === "public-data" || tab.key === "website" || tab.key === "software" || tab.key === "tables" || tab.key === "invoices" || tab.key === "users" || tab.key === "orders" || tab.key === "kitchen");
    } else {
      baseTabs = tabs.filter((tab) => tab.key === "dashboard" || tab.key === "businesses" || tab.key === "subscriptions" || tab.key === "industry-templates" || tab.key === "action-logs");
      // Force Super Admin dashboard link to the superAdmin route
      baseTabs = baseTabs.map(tab =>
        tab.key === "dashboard" ? { ...tab, href: "/dashboard/superAdmin" } : tab
      );
    }

    // 2. Only modify links if we are NOT on a global Super Admin route
    if (!isSuperAdminRoute && (isImpersonating || shouldShowBusinessTabs || resolvedRole === "business_admin")) {
      baseTabs = baseTabs.map(tab => {
        if (tab.key === "dashboard") {
          return { ...tab, href: "/dashboard/businessAdmin" };
        }
        if (businessId && (tab.href.includes("businessAdmin") || tab.href === "/dashboard")) {
          const separator = tab.href.includes("?") ? "&" : "?";
          return { ...tab, href: `${tab.href}${separator}businessId=${businessId}` };
        }
        return tab;
      });
    }

    return baseTabs;
  }, [resolvedRole, businessId, isMounted, templateConfig, pathname]);

  const closeMobileNav = () => setMobileNavOpen(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") localStorage.setItem("dn_sidebar_collapsed", String(next));
      return next;
    });
  };

  const portalLabel =
    !isMounted ? "..." :
    (businessId && resolvedRole === "super_admin" && typeof window !== "undefined" && !window.location.pathname.includes("/superAdmin"))
      ? "Impersonating Business"
      : (resolvedRole === "super_admin" || (typeof window !== "undefined" && window.location.pathname.includes("/superAdmin")))
        ? "Platform Console"
        : resolvedRole === "business_admin"
          ? "Business Workspace"
          : resolvedRole === "kitchen" || resolvedRole === "waiter" || isPharmacyStaffRole(resolvedRole)
            ? "Staff Portal"
            : "Admin Portal";

  const shellTitle = activeBusiness?.businessName || templateConfig?.businessName || "DigiNizam";
  const shellLogo = resolveMediaUrl(logoUrl || activeBusiness?.logo || null);
  const usePlatformLogo = !pathname.includes("/businessAdmin");

  return (
    <div className="admin-shell min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <aside
        className={cn(
          "admin-shell-aside fixed inset-y-0 left-0 z-40 hidden h-dvh flex-col overflow-hidden border-r bg-[var(--surface)] transition-[width] duration-200 xl:flex",
          sidebarCollapsed ? "w-[4.5rem]" : "w-72",
        )}
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="shrink-0 border-b px-3 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
            <SidebarBrand
              title={shellTitle}
              logoSrc={shellLogo}
              color={primaryColor}
              usePlatformLogo={usePlatformLogo}
            />
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold leading-tight text-[var(--text-primary)]">{shellTitle}</h1>
                <p className="truncate text-xs font-medium leading-tight text-[var(--text-muted)]">{portalLabel}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-2 py-4">
          {!sidebarCollapsed ? (
            <div className="mb-3 shrink-0 px-2 text-xs font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">Navigation</div>
          ) : null}
          <nav className="admin-shell-nav flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-1">
            {visibleTabs.map((tab) => {
              const active = isNavTabActive(tab.key, resolvedActiveTab, activeTab);
              return (
                <Link
                  key={tab.key}
                  href={isMounted ? tab.href : tab.href.split("?")[0]}
                  title={tab.description ? `${tab.label} — ${tab.description}` : tab.label}
                  className={cn(
                    "group flex min-w-0 items-center gap-3 py-3 text-sm font-semibold transition-all duration-200",
                    sidebarCollapsed ? "justify-center px-2" : "px-4",
                    active
                      ? "relative rounded-lg text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-white"
                      : "rounded-lg text-[var(--text-muted)]",
                  )}
                  style={
                    active
                      ? { backgroundColor: primaryColor, color: "#fff" }
                      : { ["--nav-hover" as string]: `${secondaryColor}18` }
                  }
                  onMouseEnter={(event) => {
                    if (!active) event.currentTarget.style.backgroundColor = `${secondaryColor}14`;
                  }}
                  onMouseLeave={(event) => {
                    if (!active) event.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                      active ? "bg-white/15 text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)] group-hover:bg-[var(--surface)]",
                    )}
                  >
                    {tab.icon}
                  </span>
                  {!sidebarCollapsed ? (
                    <NavTabLabel label={tab.label} inProgress={tab.inProgress} active={active} />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 space-y-2 border-t px-2 py-4" style={{ borderColor: "var(--border-subtle)" }}>
            <button
              type="button"
              onClick={toggleSidebar}
              className={cn(
                "dn-btn dn-btn-outline w-full text-sm",
                sidebarCollapsed && "px-0",
              )}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
              {!sidebarCollapsed ? "Collapse" : null}
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success("Successfully logged out. See you soon!");
                router.push("/");
              }}
              className={cn("dn-btn dn-btn-outline w-full", sidebarCollapsed && "px-0")}
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
              {!sidebarCollapsed ? "Logout" : null}
            </button>
        </div>
      </aside>

      <div className={cn("transition-[padding] duration-200", sidebarCollapsed ? "xl:pl-[4.5rem]" : "xl:pl-72")}>
        <header className="admin-shell-header sticky top-0 z-30 border-b bg-[var(--surface)] py-3" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex w-full items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {HeaderIcon ? (
                <div className="portal-icon-box !h-10 !w-10 shrink-0 !rounded-xl">
                  <HeaderIcon className="h-5 w-5" strokeWidth={1.8} />
                </div>
              ) : null}
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold leading-tight text-[var(--text-primary)] md:text-xl">{pageTitle}</h1>
                {pageSubtitle ? (
                  <p className="mt-0.5 line-clamp-2 text-xs font-medium text-[var(--text-muted)] sm:line-clamp-1 sm:text-sm">
                    {pageSubtitle}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {headerActions ? <div className="hidden items-center gap-2 sm:flex">{headerActions}</div> : null}
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] sm:inline-flex"
                style={{ borderColor: "var(--border-subtle)" }}
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-[var(--surface)] text-[var(--text-primary)] xl:hidden"
                style={{ borderColor: "var(--border-subtle)" }}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 pb-8 pt-6 sm:px-6 lg:px-10 lg:pb-11">
          {children}
        </main>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
            onClick={closeMobileNav}
          />

          <aside className="admin-shell-mobile absolute left-0 top-0 flex h-full w-[88vw] max-w-sm flex-col overflow-hidden border-r bg-[var(--surface)] shadow-[0_20px_40px_rgba(15,23,42,0.18)]" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex min-w-0 items-center gap-3">
                <SidebarBrand
                  title={shellTitle}
                  logoSrc={shellLogo}
                  color={primaryColor}
                  usePlatformLogo={usePlatformLogo}
                />
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-semibold leading-tight text-[var(--text-primary)]">{shellTitle}</h1>
                  <p className="truncate text-xs font-medium leading-tight text-[var(--text-muted)]">{portalLabel}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeMobileNav}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-[var(--surface)] text-[var(--text-primary)]"
                style={{ borderColor: "var(--border-subtle)" }}
                aria-label="Close navigation menu"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
              <div className="mb-3 shrink-0 px-2 text-xs font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">Navigation</div>
              <nav className="admin-shell-nav flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-1">
                {visibleTabs.map((tab) => {
                  const active = isNavTabActive(tab.key, resolvedActiveTab, activeTab);
                  return (
                    <Link
                      key={tab.key}
                      href={isMounted ? tab.href : tab.href.split("?")[0]}
                      onClick={closeMobileNav}
                      title={tab.description ? `${tab.label} — ${tab.description}` : tab.label}
                      className={cn(
                        "group flex min-w-0 items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200",
                        active
                          ? "relative rounded-lg text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-white"
                          : "rounded-lg text-[var(--text-muted)]",
                      )}
                      style={active ? { backgroundColor: primaryColor } : undefined}
                      onMouseEnter={(event) => {
                        if (!active) event.currentTarget.style.backgroundColor = `${secondaryColor}14`;
                      }}
                      onMouseLeave={(event) => {
                        if (!active) event.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                        active ? "bg-white/15 text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)] group-hover:bg-[var(--surface)]",
                      )}>{tab.icon}</span>
                      <NavTabLabel label={tab.label} inProgress={tab.inProgress} active={active} />
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-4 shrink-0 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileNav();
                    logout();
                    toast.success("Successfully logged out. See you soon!");
                    router.push("/");
                  }}
                  className="dn-btn dn-btn-outline w-full"
                >
                  <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
                  Logout
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
