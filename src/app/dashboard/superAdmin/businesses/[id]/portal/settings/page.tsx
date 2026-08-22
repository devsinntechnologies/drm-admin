"use client";

import { useParams } from "next/navigation";
import { BusinessWorkspaceSettings } from "@/components/business/BusinessWorkspaceSettings";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { hydrateWorkspaceTemplate } from "@/lib/hydrate-workspace-template";
import { getBusinessProfile } from "@/lib/business-profile";

export default function PortalSettingsPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  const { data: business } = useGetBusinessByIdQuery(businessId, { skip: !businessId });

  if (!business) return null;

  const profile = business.templateConfig
    ? { industryId: business.templateConfig.industryId }
    : getBusinessProfile(businessId, business.businessName);

  const templateConfig = hydrateWorkspaceTemplate(business.templateConfig) ?? business.templateConfig;

  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold text-[#475569]">Portal appearance & features</h2>
      <p className="mb-4 text-sm text-[#64748b]">
        Logo, colours, dark mode, and which menu items staff can see in the portal.
      </p>
      <BusinessWorkspaceSettings
        businessId={businessId}
        businessName={business.businessName}
        templateConfig={templateConfig}
        fallbackIndustryId={profile.industryId}
      />
    </section>
  );
}
