"use client";

import Loading from "@/components/common/Loading";
import { SoftwareMobilePreview } from "@/components/business/SoftwareMobilePreview";
import { SoftwareTemplateNotConfigured } from "@/components/business/SoftwareTemplateNotConfigured";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

export default function BusinessAdminSoftwarePreviewPage() {
  const businessId = useActiveBusinessId();
  const { role } = useAuth();
  const { businessName, templateConfig, logoUrl, isLoading } = useBusinessTemplate();

  if (isLoading) return <Loading className="py-16" />;
  if (!businessId) return null;

  if (!templateConfig?.id) {
    return <SoftwareTemplateNotConfigured businessId={businessId} isSuperAdmin={role === "super_admin"} />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h3 className="text-lg font-semibold text-[#0f172a]">Mobile preview</h3>
        <p className="mt-1 text-sm text-[#64748b]">
          Preview of the Flutter app for {businessName}.
        </p>
      </section>
      <SoftwareMobilePreview
        businessName={businessName}
        templateConfig={templateConfig}
        logoUrl={logoUrl}
      />
    </div>
  );
}
