"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import Loading from "@/components/common/Loading";
import { BusinessSectionTabs } from "@/components/business/BusinessSectionTabs";
import { BusinessWorkspaceActions } from "@/components/business/BusinessWorkspaceActions";
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[#0f172a]">
            {isLoading ? "Portal" : `${business?.businessName ?? "Business"} · Portal`}
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">Staff workspace — stock, sales and daily operations.</p>
        </div>
        <BusinessWorkspaceActions
          businessId={businessId}
          business={business}
          area="portal"
        />
      </div>

      <div className="mb-5 space-y-4">
        <BusinessSectionTabs
          businessId={businessId}
          active="portal"
          websiteEnabled={business?.websiteEnabled}
          portalEnabled={business?.portalEnabled}
          softwareEnabled={business?.softwareEnabled}
        />
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
