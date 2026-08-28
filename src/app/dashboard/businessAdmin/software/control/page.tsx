"use client";

import { Building2 } from "lucide-react";
import Loading from "@/components/common/Loading";
import { ControlSection } from "@/components/business/ControlSection";
import { SoftwareControlContent } from "@/components/business/SoftwareControlContent";
import { SoftwareStaffOverview } from "@/components/business/SoftwareStaffOverview";
import { SoftwareSyncStatusPanel } from "@/components/business/SoftwareSyncStatusPanel";
import { SoftwareTemplateNotConfigured } from "@/components/business/SoftwareTemplateNotConfigured";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { getBusinessProfile } from "@/lib/business-profile";
import { getIndustryById } from "@/templates/industries";

export default function BusinessAdminSoftwareControlPage() {
  const businessId = useActiveBusinessId();
  const { businessName, templateConfig } = useBusinessTemplate();
  const { data: business, isLoading, isError } = useGetBusinessByIdQuery(businessId || "", {
    skip: !businessId,
  });

  if (!businessId) {
    return <p className="text-sm text-[#64748b]">No business selected.</p>;
  }

  if (isLoading) {
    return <Loading className="py-16" label="Loading workspace…" />;
  }

  if (isError || !business) {
    return (
      <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-6 text-sm text-[#dc2626]">
        Could not load your business workspace. Try refreshing the page.
      </div>
    );
  }

  const profile = templateConfig
    ? { industryId: templateConfig.industryId }
    : getBusinessProfile(businessId, businessName);

  const industryId =
    getIndustryById(profile.industryId)?.id ??
    getBusinessProfile(businessId, businessName).industryId;

  const hasTemplate = Boolean(templateConfig?.id);

  return (
    <div className="space-y-6">
      <ControlSection
        index={0}
        title="Business profile"
        description="Contact and plan details for this business. To change these, contact support."
        icon={Building2}
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Business name</dt>
            <dd className="mt-0.5 text-sm text-[#0f172a]">{business.businessName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Plan</dt>
            <dd className="mt-0.5 text-sm text-[#0f172a]">{business.planName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Address</dt>
            <dd className="mt-0.5 text-sm text-[#0f172a]">{business.address || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Phone</dt>
            <dd className="mt-0.5 text-sm text-[#0f172a]">{business.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Email</dt>
            <dd className="mt-0.5 text-sm text-[#0f172a]">{business.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Owner</dt>
            <dd className="mt-0.5 text-sm text-[#0f172a]">{business.ownerName || "—"}</dd>
          </div>
        </dl>
      </ControlSection>

      <SoftwareStaffOverview
        businessId={businessId}
        business={business}
        industryId={industryId}
        enabledModules={templateConfig?.enabledModules}
      />

      {!hasTemplate ? <SoftwareTemplateNotConfigured businessId={businessId} isSuperAdmin={false} /> : null}

      {hasTemplate ? (
        <>
          <SoftwareSyncStatusPanel businessId={businessId} />
          <SoftwareControlContent
          businessId={businessId}
          businessName={businessName}
          templateConfig={templateConfig}
          industryId={industryId}
          />
        </>
      ) : null}
    </div>
  );
}
