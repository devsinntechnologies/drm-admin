"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Loading from "@/components/common/Loading";
import { BusinessSectionTabs, OpenPortalButton } from "@/components/business/BusinessSectionTabs";
import { PortalSubTabs } from "@/components/business/PortalSubTabs";
import { Breadcrumbs } from "@/components/design-system/Breadcrumbs";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";

function PortalLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  const { data: business, isLoading } = useGetBusinessByIdQuery(businessId, { skip: !businessId });

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
          { label: "Portal" },
        ]}
        className="mb-4"
      />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">
            {isLoading ? "Portal" : `${business?.businessName ?? "Business"} · Portal`}
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">Staff workspace — stock, sales and daily operations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OpenPortalButton businessId={businessId} />
          <Link
            href={`/dashboard/superAdmin/businesses/${businessId}`}
            className="dn-btn dn-btn-outline inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Profile
          </Link>
        </div>
      </div>

      <div className="mb-5 space-y-4">
        <BusinessSectionTabs businessId={businessId} active="portal" />
        <PortalSubTabs businessId={businessId} />
      </div>

      {children}
    </AdminShell>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <PortalLayoutContent>{children}</PortalLayoutContent>
    </Suspense>
  );
}
