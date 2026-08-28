"use client";

import { useParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import { SoftwareMobilePreview } from "@/components/business/SoftwareMobilePreview";
import { SoftwareTemplateNotConfigured } from "@/components/business/SoftwareTemplateNotConfigured";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { hydrateWorkspaceTemplate } from "@/lib/hydrate-workspace-template";

export default function SoftwarePreviewPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  const { data: business, isLoading } = useGetBusinessByIdQuery(businessId, { skip: !businessId });

  if (isLoading) return <Loading className="py-16" />;
  if (!business) return null;

  const templateConfig = hydrateWorkspaceTemplate(business.templateConfig) ?? business.templateConfig;

  if (!templateConfig?.id) {
    return <SoftwareTemplateNotConfigured businessId={businessId} businessName={business.businessName} />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h3 className="text-lg font-semibold text-[#0f172a]">Mobile preview</h3>
        <p className="mt-1 text-sm text-[#64748b]">
          How the Flutter app bottom navigation and home screen will look for {business.businessName}.
        </p>
      </section>
      <SoftwareMobilePreview businessName={business.businessName} templateConfig={templateConfig} />
    </div>
  );
}
