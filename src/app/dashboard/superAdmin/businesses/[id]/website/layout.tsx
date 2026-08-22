"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { FileText, Globe2, LayoutTemplate, Link2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Loading from "@/components/common/Loading";
import { Breadcrumbs } from "@/components/design-system/Breadcrumbs";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";

function tabsFor(base: string) {
  return [
    { key: "overview", href: base, label: "Overview", icon: Globe2 },
    { key: "pages", href: `${base}/pages`, label: "Pages", icon: FileText },
    { key: "theme", href: `${base}/theme`, label: "Theme", icon: LayoutTemplate },
    { key: "domain", href: `${base}/domain`, label: "Domain", icon: Link2 },
  ] as const;
}

function isTabActive(pathname: string, tabHref: string, tabKey: string, base: string) {
  if (tabKey === "overview") return pathname === base;
  return pathname.startsWith(tabHref);
}

function WebsiteLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const businessId = typeof params.id === "string" ? params.id : "";
  const { data: business, isLoading } = useGetBusinessByIdQuery(businessId, { skip: !businessId });
  const base = `/dashboard/superAdmin/businesses/${businessId}/website`;
  const tabs = tabsFor(base);

  return (
    <AdminShell activeTab="businesses">
      <Breadcrumbs
        items={[
          { label: "Platform", href: "/dashboard/superAdmin" },
          { label: "Businesses", href: "/dashboard/superAdmin/businesses" },
          {
            label: business?.businessName ?? "Business",
            href: `/dashboard/superAdmin/businesses/${businessId}`,
          },
          { label: "Website" },
        ]}
        className="mb-4"
      />

      <section className="portal-header mb-6 flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#001840] text-white shadow-[0_10px_20px_rgba(0,24,64,0.28)]">
            <Globe2 className="h-7 w-7" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[1.65rem] font-semibold leading-tight text-[#181d2c] sm:text-[1.85rem]">
              DigiNizam Website
            </h2>
            <p className="truncate text-[0.92rem] text-[#6c7890] sm:text-[0.98rem]">
              {isLoading
                ? "Loading business..."
                : `Managing the website for ${business?.businessName ?? "this business"}`}
            </p>
          </div>
        </div>
      </section>

      <section className="dn-tab-bar mb-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(pathname, tab.href, tab.key, base);
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

export default function SuperAdminWebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <WebsiteLayoutContent>{children}</WebsiteLayoutContent>
    </Suspense>
  );
}
