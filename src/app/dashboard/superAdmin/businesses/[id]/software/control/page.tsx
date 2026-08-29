"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import { SoftwareAppUpdatePanel } from "@/components/business/SoftwareAppUpdatePanel";
import { SoftwareControlContent } from "@/components/business/SoftwareControlContent";
import { SoftwareSyncStatusPanel } from "@/components/business/SoftwareSyncStatusPanel";
import { SoftwareTemplateNotConfigured } from "@/components/business/SoftwareTemplateNotConfigured";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { hydrateWorkspaceTemplate } from "@/lib/hydrate-workspace-template";
import { getBusinessProfile } from "@/lib/business-profile";
import { getIndustryById } from "@/templates/industries";

export default function SoftwareControlPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  const { data: business, isLoading, isError } = useGetBusinessByIdQuery(businessId, {
    skip: !businessId,
  });

  if (!businessId) {
    return <p className="text-sm text-[#64748b]">Invalid business ID.</p>;
  }

  if (isLoading) {
    return <Loading className="py-16" label="Loading business…" />;
  }

  if (isError || !business) {
    return (
      <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-6 text-sm text-[#dc2626]">
        Could not load this business.
        <Link href="/dashboard/superAdmin/businesses" className="ml-2 font-semibold underline">
          Back to businesses
        </Link>
      </div>
    );
  }

  const profile = business.templateConfig
    ? { industryId: business.templateConfig.industryId }
    : getBusinessProfile(businessId, business.businessName);

  const industryId =
    getIndustryById(profile.industryId)?.id ??
    getBusinessProfile(businessId, business.businessName).industryId;

  const templateConfig = hydrateWorkspaceTemplate(business.templateConfig) ?? business.templateConfig;
  const hasTemplate = Boolean(templateConfig?.id);

  return (
    <div className="space-y-6">
      {!hasTemplate ? (
        <SoftwareTemplateNotConfigured
          businessId={businessId}
          businessName={business.businessName}
        />
      ) : null}

      <SoftwareAppUpdatePanel businessId={businessId} />

      {hasTemplate ? (
        <>
          <SoftwareSyncStatusPanel businessId={businessId} />
          <SoftwareControlContent
          businessId={businessId}
          businessName={business.businessName}
          templateConfig={templateConfig}
          industryId={industryId}
          />
        </>
      ) : null}
    </div>
  );
}
