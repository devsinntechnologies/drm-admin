"use client";

import { useEffect, useMemo, useState } from "react";
import Loading from "@/components/common/Loading";
import { BusinessTemplatePreview } from "@/components/business/BusinessTemplatePreview";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { getBusinessProfile, type BusinessProfileConfig } from "@/lib/business-profile";

type PortalPreviewContentProps = {
  businessId: string;
};

export function PortalPreviewContent({ businessId }: PortalPreviewContentProps) {
  const { data: business, isLoading } = useGetBusinessByIdQuery(businessId, { skip: !businessId });
  const [profile, setProfile] = useState<BusinessProfileConfig | null>(null);

  useEffect(() => {
    if (!business) return;
    const templateConfig = business.templateConfig;
    if (templateConfig) {
      setProfile({
        industryId: templateConfig.industryId,
        primaryColor: templateConfig.primaryColor,
        secondaryColor: templateConfig.secondaryColor,
        themeMode: templateConfig.themeMode,
        typography: "Poppins",
        layoutStyle: "comfortable",
      });
      return;
    }
    setProfile(getBusinessProfile(businessId, business.businessName));
  }, [business, businessId]);

  const ready = useMemo(() => Boolean(business && profile), [business, profile]);

  if (isLoading || !ready || !business || !profile) {
    return <Loading className="py-16" />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h3 className="text-lg font-semibold text-[#0f172a]">Portal preview</h3>
        <p className="mt-1 text-sm text-[#64748b]">
          How the staff workspace looks — menu, colours and home dashboard for {business.businessName}.
        </p>
      </section>
      <BusinessTemplatePreview profile={profile} businessName={business.businessName} />
    </div>
  );
}
