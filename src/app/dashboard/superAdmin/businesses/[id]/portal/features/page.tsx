"use client";

import { useParams } from "next/navigation";
import { BusinessEntitlements } from "@/components/business/BusinessEntitlements";
import { PortalFeaturesContent } from "@/components/business/PortalFeaturesContent";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { hydrateWorkspaceTemplate } from "@/lib/hydrate-workspace-template";
import { getBusinessProfile } from "@/lib/business-profile";

export default function PortalFeaturesPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  const { data: business } = useGetBusinessByIdQuery(businessId, { skip: !businessId });

  if (!business) return null;

  const profile = business.templateConfig
    ? { industryId: business.templateConfig.industryId }
    : getBusinessProfile(businessId, business.businessName);

  const templateConfig = hydrateWorkspaceTemplate(business.templateConfig) ?? business.templateConfig;

  return (
    <div className="space-y-5">
      <BusinessEntitlements templateConfig={templateConfig} industryId={profile.industryId} />
      <PortalFeaturesContent
        businessId={businessId}
        businessName={business.businessName}
        templateConfig={templateConfig}
        industryId={profile.industryId}
      />
    </div>
  );
}
