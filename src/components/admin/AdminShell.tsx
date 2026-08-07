"use client";
import Image from "next/image";
import Link from "next/link";
import { Activity, Building2, Crown, CreditCard, Globe2, LayoutGrid, LayoutTemplate, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Receipt, ReceiptText, Search, Bell, Shapes, ShoppingCart, Store, Users, UtensilsCrossed, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { toast } from "sonner";

type TabKey = "dashboard" | "businesses" | "subscriptions" | "industry-templates" | "action-logs" | "orders" | "kitchen" | "products" | "categories" | "public-data" | "tables" | "invoices" | "users";

type AdminShellProps = {
  activeTab: TabKey;
  children: React.ReactNode;
};

const tabs: Array<{ key: TabKey; label: string; href: string; icon: React.ReactNode }> = [
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

function getVisibleTabs(role: string | null, isImpersonating: boolean = false) {
  // If we are impersonating, we always want the business admin view
  if (isImpersonating || role === "business_admin") {
    return tabs.filter((tab) => tab.key === "dashboard" || tab.key === "products" || tab.key === "categories" || tab.key === "public-data" || tab.key === "tables" || tab.key === "invoices" || tab.key === "users" || tab.key === "orders" || tab.key === "kitchen");
  }

  if (role === "kitchen") {
    return tabs.filter((tab) => tab.key === "orders");
  }

  if (role === "waiter") {
    return tabs.filter((tab) => tab.key === "orders");
  }

  return tabs.filter((tab) => tab.key === "dashboard" || tab.key === "businesses" || tab.key === "subscriptions" || tab.key === "industry-templates" || tab.key === "action-logs");
}

export default function AdminShell({ activeTab, children }: AdminShellProps) {
  const { role, user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resolvedRole, setResolvedRole] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const businessId = useActiveBusinessId();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: activeBusiness } = useGetBusinessByIdQuery(businessId || "", {
    skip: !businessId,
  });

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setSidebarCollapsed(localStorage.getItem("dn_sidebar_collapsed") === "true");
    }
    const currentId = searchParams.get("businessId");

    // Sync businessId from URL to localStorage to prevent stale IDs
    if (typeof window !== "undefined" && currentId) {
      localStorage.setItem("businessId", currentId);
    }

    // Auto-append businessId to URL if missing and we are on a businessAdmin page
    if (typeof window !== "undefined" && isMounted) {
      if (!currentId && businessId && window.location.pathname.includes("/businessAdmin")) {
        const newParams = new URLSearchParams(window.location.search);
        newParams.set("businessId", businessId);
        router.replace(`${window.location.pathname}?${newParams.toString()}`);
      }
    }

    // Security & Contextual Redirects
    if (typeof window !== "undefined" && isMounted && resolvedRole) {
      const isSuperAdminPath = window.location.pathname.includes("/superAdmin");
      const isBusinessAdminPath = window.location.pathname.includes("/businessAdmin");

      // 1. If a non-super-admin tries to access /superAdmin, kick them out
      if (isSuperAdminPath && resolvedRole !== "super_admin") {
        router.replace("/dashboard");
        return;
      }

      // 2. If a super-admin is on a business path but HAS NO businessId, kick them to global view
      if (isBusinessAdminPath && resolvedRole === "super_admin" && !businessId) {
        router.replace("/dashboard");
        return;
      }
    }

    if (role) {
      setResolvedRole(role);
      return;
    }

    if (typeof window !== "undefined") {
      setResolvedRole(localStorage.getItem("roleName") || localStorage.getItem("auth_role") || localStorage.getItem("role"));
    }
  }, [role, businessId, isMounted, searchParams, router]);

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

    let baseTabs;
    if (resolvedRole === "waiter" || resolvedRole === "kitchen") {
      baseTabs = tabs.filter((tab) => tab.key === "orders");
    } else if (shouldShowBusinessTabs) {
      baseTabs = tabs.filter((tab) => tab.key === "dashboard" || tab.key === "products" || tab.key === "categories" || tab.key === "public-data" || tab.key === "tables" || tab.key === "invoices" || tab.key === "users" || tab.key === "orders" || tab.key === "kitchen");
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
  }, [resolvedRole, businessId, isMounted]);

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
          : resolvedRole === "kitchen" || resolvedRole === "waiter"
            ? "Staff Portal"
            : "Admin Portal";

  const shellTitle = activeBusiness?.businessName || "DigiNizam";

  return (
    <div className="min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[#dbe4ef] bg-white transition-[width] duration-200 xl:flex",
          sidebarCollapsed ? "w-[4.5rem]" : "w-72",
        )}
      >
        <div className="border-b border-[#edf2f7] px-3 py-4">
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
            <Image
              src="/logo-mark.png"
              alt="DigiNizam"
              width={48}
              height={40}
              className="h-10 w-auto shrink-0 object-contain"
              priority
            />
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold leading-tight text-[#0f172a]">{shellTitle}</h1>
                <p className="truncate text-xs font-medium leading-tight text-[#667085]">{portalLabel}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-2 py-4">
          {!sidebarCollapsed ? (
            <div className="mb-3 px-2 text-xs font-semibold tracking-[0.12em] text-[#94a3b8] uppercase">Navigation</div>
          ) : null}
          <nav className="flex flex-1 flex-col gap-1">
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={isMounted ? tab.href : tab.href.split("?")[0]}
                  title={sidebarCollapsed ? tab.label : undefined}
                  className={cn(
                    "group flex min-w-0 items-center gap-3 py-3 text-sm font-semibold transition-all duration-200",
                    sidebarCollapsed ? "justify-center px-2" : "px-4",
                    active
                      ? "relative rounded-lg bg-[#001840] text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-[#0050F8]"
                      : "rounded-lg text-[#475569] hover:bg-[#f1f5f9] hover:text-[#001840]",
                  )}
                >
                  <span className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                    active ? "bg-white/15 text-white" : "bg-[#f1f5f9] text-[#64748b] group-hover:bg-white group-hover:text-[#0050F8]",
                  )}>{tab.icon}</span>
                  {!sidebarCollapsed ? (
                    <span className={cn("min-w-0 truncate", active ? "text-white" : "text-[#334155]")}>{tab.label}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 space-y-2 border-t border-[#edf2f7] pt-4">
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
        </div>
      </aside>

      <div className={cn("transition-[padding] duration-200", sidebarCollapsed ? "xl:pl-[4.5rem]" : "xl:pl-72")}>
        <header className="sticky top-0 z-30 border-b border-[#dbe4ef] bg-white py-3">
          <div className="flex w-full items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold leading-tight text-[#0f172a] md:text-xl">DigiNizam</h1>
                <p className="truncate text-xs font-medium leading-tight text-[#58657a] md:text-sm">{portalLabel}</p>
              </div>
              <div className="ml-auto hidden max-w-md flex-1 lg:block xl:max-w-sm">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="search"
                    placeholder="Search businesses, users, modules…"
                    className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] pl-9 pr-4 text-sm outline-none focus:border-[#0050f8] focus:ring-2 focus:ring-[#0050f8]/15"
                  />
                </label>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] sm:inline-flex"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7e1ed] bg-white text-[#334155] xl:hidden"
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

          <aside className="absolute left-0 top-0 flex h-full w-[88vw] max-w-sm flex-col border-r border-[#e5edf5] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-[#edf2f7] px-5 py-4">
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold leading-tight text-[#0f172a]">DigiNizam</h1>
                <p className="truncate text-xs font-medium leading-tight text-[#667085]">Platform Console</p>
              </div>

              <button
                type="button"
                onClick={closeMobileNav}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d7e1ed] bg-white text-[#334155]"
                aria-label="Close navigation menu"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col px-3 py-4">
              <div className="mb-3 px-2 text-xs font-semibold tracking-[0.12em] text-[#94a3b8] uppercase">Navigation</div>
              <nav className="flex flex-1 flex-col gap-1">
                {visibleTabs.map((tab) => {
                  const active = activeTab === tab.key;
                  return (
                    <Link
                      key={tab.key}
                      href={isMounted ? tab.href : tab.href.split("?")[0]}
                      onClick={closeMobileNav}
                      className={cn(
                        "group flex min-w-0 items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200",
                        active
                          ? "relative rounded-lg bg-[#001840] text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-[#0050F8]"
                          : "rounded-lg text-[#475569] hover:bg-[#f1f5f9] hover:text-[#001840]",
                      )}
                    >
                      <span className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                        active ? "bg-white/15 text-white" : "bg-[#f1f5f9] text-[#64748b] group-hover:bg-white group-hover:text-[#0050F8]",
                      )}>{tab.icon}</span>
                      <span className={cn("min-w-0 truncate", active ? "text-white" : "text-[#334155]")}>{tab.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-4 border-t border-[#edf2f7] pt-4">
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
