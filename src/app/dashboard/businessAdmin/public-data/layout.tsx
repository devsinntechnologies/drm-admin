"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import { Eye, FolderTree, Globe2, Package, Settings2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

const PUBLIC_DATA_BASE = "/dashboard/businessAdmin/public-data";

const tabs = [
  {
    key: "settings",
    href: PUBLIC_DATA_BASE,
    label: "Settings & Sync",
    icon: Settings2,
  },
  {
    key: "categories",
    href: `${PUBLIC_DATA_BASE}/categories`,
    label: "Categories",
    icon: FolderTree,
  },
  {
    key: "products",
    href: `${PUBLIC_DATA_BASE}/products`,
    label: "Products",
    icon: Package,
  },
  {
    key: "catalog",
    href: `${PUBLIC_DATA_BASE}/catalog`,
    label: "Catalog Preview",
    icon: Eye,
  },
] as const;

function isTabActive(pathname: string, tabHref: string, tabKey: string) {
  const path = tabHref.split("?")[0];
  if (tabKey === "settings") {
    return pathname === PUBLIC_DATA_BASE || pathname.startsWith(`${PUBLIC_DATA_BASE}/settings`);
  }
  return pathname.startsWith(path);
}

function PublicDataLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role } = useAuth();
  const businessId = useActiveBusinessId();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    const impersonatedBusinessId = searchParams.get("businessId");

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    const isBusinessRole = currentRole === "business_admin";
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;

    if (!isBusinessRole && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [role, router, searchParams]);

  const tabLinks = useMemo(() => {
    return tabs.map((tab) => {
      if (!businessId) return tab;
      const separator = tab.href.includes("?") ? "&" : "?";
      return { ...tab, href: `${tab.href}${separator}businessId=${businessId}` };
    });
  }, [businessId]);

  if (!isAuthorized) {
    return <Loading fullScreen />;
  }

  return (
    <AdminShell activeTab="public-data">
      <section className="mb-6 flex w-full flex-col gap-4 rounded-3xl border border-white bg-[linear-gradient(120deg,rgba(255,255,255,0.95),rgba(241,245,249,0.9))] px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#001840] text-white shadow-[0_10px_20px_rgba(0,24,64,0.28)]">
            <Globe2 className="h-7 w-7" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[1.65rem] font-semibold leading-tight text-[#181d2c] sm:text-[1.85rem]">
              Public Catalog
            </h2>
            <p className="truncate text-[0.92rem] text-[#6c7890] sm:text-[0.98rem]">
              Manage storefront settings, synced catalog data, and published website content
            </p>
          </div>
        </div>
      </section>

      <section className="dn-tab-bar mb-5">
        {tabLinks.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(pathname, tab.href, tab.key);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              data-active={active ? "true" : "false"}
              className="dn-tab"
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </section>

      {children}
    </AdminShell>
  );
}

export default function PublicDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <PublicDataLayoutContent>{children}</PublicDataLayoutContent>
    </Suspense>
  );
}
