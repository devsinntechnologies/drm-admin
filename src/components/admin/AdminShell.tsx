// @ts-nocheck
"use client";
import Image from "next/image";
import Link from "next/link";
import { Activity, Building2, Crown, CreditCard, LayoutGrid, LogOut, Menu, ReceiptText, Shapes, Store, Users, UtensilsCrossed, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { toast } from "sonner";

type TabKey = "dashboard" | "businesses" | "subscriptions" | "action-logs" | "orders" | "kitchen" | "products" | "categories" | "tables" | "invoices" | "users";

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
    key: "tables",
    label: "Restaurant Tables",
    href: "/dashboard/businessAdmin/tables",
    icon: <Store className="h-5 w-5" />,
  },
  {
    key: "invoices",
    label: "Invoices",
    href: "/dashboard/businessAdmin/invoices",
    icon: <ReceiptText className="h-5 w-5" />,
  },
  {
    key: "orders",
    label: "Orders",
    href: "/dashboard/businessAdmin/orders",
    icon: <ReceiptText className="h-5 w-5" />,
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
    return tabs.filter((tab) => tab.key === "dashboard" || tab.key === "products" || tab.key === "categories" || tab.key === "tables" || tab.key === "invoices" || tab.key === "users" || tab.key === "orders" || tab.key === "kitchen");
  }

  if (role === "kitchen") {
    return tabs.filter((tab) => tab.key === "orders");
  }

  if (role === "waiter") {
    return tabs.filter((tab) => tab.key === "orders");
  }

  return tabs.filter((tab) => tab.key === "dashboard" || tab.key === "businesses" || tab.key === "subscriptions" || tab.key === "action-logs");
}

export default function AdminShell({ activeTab, children }: AdminShellProps) {
  const { role, user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      return tabs.filter((tab) => tab.key === "dashboard" || tab.key === "businesses" || tab.key === "subscriptions" || tab.key === "action-logs");
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
      baseTabs = tabs.filter((tab) => tab.key === "dashboard" || tab.key === "products" || tab.key === "categories" || tab.key === "tables" || tab.key === "invoices" || tab.key === "users" || tab.key === "orders" || tab.key === "kitchen");
    } else {
      baseTabs = tabs.filter((tab) => tab.key === "dashboard" || tab.key === "businesses" || tab.key === "subscriptions" || tab.key === "action-logs");
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

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-[#e5edf5] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:flex">
        <div className="border-b border-[#edf2f7] px-5 py-4">
          <div className="flex items-center gap-3">
            <div >
              <Image src="/logo.png" alt="Restaurant Manager logo" width={150} height={150} className="h-20 w-20 object-contain" priority />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight text-[#0f172a]">
                {activeBusiness?.name || "Restaurant Manager"}
              </h1>
              <p className="truncate text-xs font-medium leading-tight text-[#667085]">
                {!isMounted ? "..." :
                  (businessId && resolvedRole === "super_admin" && !window.location.pathname.includes("/superAdmin")) ? "Super Admin (Impersonating)" :
                    (resolvedRole === "super_admin" || window.location.pathname.includes("/superAdmin")) ? "Super Admin Portal" :
                      resolvedRole === "business_admin" ? "Business Admin" :
                        resolvedRole === "kitchen" || resolvedRole === "waiter" ? "Staff Portal" : "Admin Portal"}
              </p>
            </div>
          </div>
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
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-[#1E365B] text-[#ffffff] shadow-[0_10px_20px_rgba(31,42,86,0.18)]"
                      : "text-[#334155] hover:bg-[#f8fafc] hover:text-[#111827]",
                  )}
                >
                  <span className={cn("shrink-0", active ? "text-[#ffffff]" : "text-[#64748b]")}>{tab.icon}</span>
                  <span className={cn("shrink-0", active ? "text-[#ffffff]" : "text-[#64748b]")}>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-[#edf2f7] pt-4">
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success("Successfully logged out. See you soon!");
                router.push("/");
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7e1ed] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] shadow-[0_8px_16px_rgba(15,23,42,0.06)] transition hover:bg-[#f4f8fc]"
            >
              <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="relative overflow-hidden border-b border-[#dbe4ef] bg-[#f8fbff] py-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.14),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(15,118,110,0.12),transparent_42%)]" />
          <div className="relative flex w-full items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <div >
                <Image src="/logo.png" alt="Restaurant Manager logo" width={150} height={150} className="h-16 w-16 object-contain" priority />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold leading-tight text-[#0f172a] md:text-xl lg:text-2xl">Restaurant Manager</h1>
                <p className="truncate text-xs font-medium leading-tight text-[#58657a] md:text-sm">
                  {!isMounted ? "..." :
                    (businessId && resolvedRole === "super_admin" && !window.location.pathname.includes("/superAdmin")) ? "Super Admin (Impersonating)" :
                      (resolvedRole === "super_admin" || window.location.pathname.includes("/superAdmin")) ? "Super Admin Portal" :
                        resolvedRole === "business_admin" ? "Business Admin" :
                          resolvedRole === "kitchen" || resolvedRole === "waiter" ? "Staff Portal" : "Admin Portal"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7e1ed] bg-white text-[#334155] shadow-[0_8px_16px_rgba(15,23,42,0.06)] transition hover:bg-[#f4f8fc] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="pb-8 pt-6 lg:pb-11">
          {children}
        </main>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
            onClick={closeMobileNav}
          />

          <aside className="absolute left-0 top-0 flex h-full w-[82vw] max-w-xs flex-col border-r border-[#e5edf5] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-[#edf2f7] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(145deg,#0f172a,#155e75)] text-cyan-50 shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
                  <Image src="/logo.png" alt="Restaurant Manager logo" width={20} height={20} className="h-5 w-5 object-contain" priority />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-semibold leading-tight text-[#0f172a]">Restaurant Manager</h1>
                  <p className="truncate text-xs font-medium leading-tight text-[#667085]">
                    {!isMounted ? "..." :
                      resolvedRole === "business_admin" ? "Business Admin Portal" :
                        resolvedRole === "kitchen" || resolvedRole === "waiter" ? "Staff Portal" :
                          "Super Admin Portal"}
                  </p>
                </div>
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
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                        active
                          ? "bg-[#1f2a56] text-[#ffffff] shadow-[0_10px_20px_rgba(31,42,86,0.18)]"
                          : "text-[#334155] hover:bg-[#f8fafc] hover:text-[#111827]",
                      )}
                    >
                      <span className={cn("shrink-0", active ? "text-[#ffffff]" : "text-[#64748b]")}>{tab.icon}</span>
                      <span>{tab.label}</span>
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7e1ed] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] shadow-[0_8px_16px_rgba(15,23,42,0.06)] transition hover:bg-[#f4f8fc]"
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