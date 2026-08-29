"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Globe2, LayoutDashboard, Smartphone } from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { BusinessBasicInfoForm } from "@/components/business/BusinessBasicInfoForm";
import { BusinessSectionTabs } from "@/components/business/BusinessSectionTabs";
import { BusinessWorkspaceActions } from "@/components/business/BusinessWorkspaceActions";
import { SoftwareStaffOverview } from "@/components/business/SoftwareStaffOverview";
import { Breadcrumbs } from "@/components/design-system/Breadcrumbs";
import { getIndustryLabel } from "@/lib/business-profile";
import { hydrateWorkspaceTemplate } from "@/lib/hydrate-workspace-template";
import { isBusinessProductEnabled } from "@/lib/business-products";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { cn } from "@/lib/utils";

function BusinessProfileContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: business, isLoading, isError } = useGetBusinessByIdQuery(id, { skip: !id });

  const workspaceTemplateConfig = useMemo(
    () => hydrateWorkspaceTemplate(business?.templateConfig) ?? business?.templateConfig ?? null,
    [business?.templateConfig],
  );

  if (!id) {
    return (
      <AdminShell activeTab="businesses">
        <p className="text-[#64748b]">Invalid business ID.</p>
      </AdminShell>
    );
  }

  if (isLoading || !business) {
    return (
      <AdminShell activeTab="businesses">
        <Loading className="py-20" />
      </AdminShell>
    );
  }

  if (isError) {
    return (
      <AdminShell activeTab="businesses">
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-6 text-[#dc2626]">
          Business not found.
          <Link href="/dashboard/superAdmin/businesses" className="ml-2 font-semibold underline">
            Back to businesses
          </Link>
        </div>
      </AdminShell>
    );
  }

  const enabledModules = workspaceTemplateConfig?.enabledModules ?? [];
  const industryId = workspaceTemplateConfig?.industryId;

  return (
    <AdminShell activeTab="businesses">
      <Breadcrumbs
        items={[
          { label: "Platform", href: "/dashboard/superAdmin" },
          { label: "Businesses", href: "/dashboard/superAdmin/businesses" },
          { label: business.businessName },
        ]}
        className="mb-4"
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[#0f172a]">{business.businessName}</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            {industryId ? getIndustryLabel(industryId) : "Business"} · {business.planName} plan
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold capitalize",
                business.status?.toLowerCase() === "active"
                  ? "border-[#bbf7d0] bg-[#ecfdf5] text-[#059669]"
                  : "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]",
              )}
            >
              {business.status}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
              <Calendar className="h-3.5 w-3.5" />
              Created {new Date(business.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <BusinessWorkspaceActions
          businessId={id}
          business={business}
          area="profile"
        />
      </div>

      <div className="mb-6">
        <BusinessSectionTabs
          businessId={id}
          active="profile"
          websiteEnabled={business.websiteEnabled}
          portalEnabled={business.portalEnabled}
          softwareEnabled={business.softwareEnabled}
        />
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link
          href={`/dashboard/superAdmin/businesses/${id}/website`}
          className="group rounded-xl border border-[#e2e8f0] bg-white p-4 transition-all hover:border-[var(--brand-secondary)] hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Globe2 className="h-5 w-5 text-[var(--brand-secondary)]" />
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isBusinessProductEnabled(business.websiteEnabled) ? "bg-[#059669]" : "bg-[#cbd5e1]",
              )}
            />
          </div>
          <p className="mt-2 font-semibold text-[#0f172a]">Website</p>
          <p className="text-sm text-[#64748b]">
            {isBusinessProductEnabled(business.websiteEnabled)
              ? "Active — pages, theme and domain"
              : "Turn on from the Website tab"}
          </p>
        </Link>
        <Link
          href={`/dashboard/superAdmin/businesses/${id}/portal`}
          className="group rounded-xl border border-[#e2e8f0] bg-white p-4 transition-all hover:border-[var(--brand-secondary)] hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <LayoutDashboard className="h-5 w-5 text-[var(--brand-secondary)]" />
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isBusinessProductEnabled(business.portalEnabled) ? "bg-[#059669]" : "bg-[#cbd5e1]",
              )}
            />
          </div>
          <p className="mt-2 font-semibold text-[#0f172a]">Portal</p>
          <p className="text-sm text-[#64748b]">
            {isBusinessProductEnabled(business.portalEnabled)
              ? "Active — staff workspace and operations"
              : "Turn on from the Portal tab"}
          </p>
        </Link>
        <Link
          href={`/dashboard/superAdmin/businesses/${id}/software`}
          className="group rounded-xl border border-[#e2e8f0] bg-white p-4 transition-all hover:border-[var(--brand-secondary)] hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Smartphone className="h-5 w-5 text-[var(--brand-secondary)]" />
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isBusinessProductEnabled(business.softwareEnabled) ? "bg-[#059669]" : "bg-[#cbd5e1]",
              )}
            />
          </div>
          <p className="mt-2 font-semibold text-[#0f172a]">Software & Mobile</p>
          <p className="text-sm text-[#64748b]">
            {isBusinessProductEnabled(business.softwareEnabled)
              ? "Active — Flutter app features and roles"
              : "Turn on from the Software tab"}
          </p>
        </Link>
      </section>

      <section className="mb-6 rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-[#0f172a]">Business profile</h2>
        <BusinessBasicInfoForm business={business} />
      </section>

      <SoftwareStaffOverview
        businessId={id}
        business={business}
        industryId={industryId}
        enabledModules={enabledModules}
        hidePortalLink
      />
    </AdminShell>
  );
}

export default function BusinessProfilePage() {
  return <BusinessProfileContent />;
}
