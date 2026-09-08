"use client";

import { Building2, Archive } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { ControlSection } from "@/components/business/ControlSection";
import { LogoPickerField } from "@/components/business/LogoPickerField";
import { SoftwareAppUpdatePanel } from "@/components/business/SoftwareAppUpdatePanel";
import { SoftwareControlContent } from "@/components/business/SoftwareControlContent";
import { SoftwareStaffOverview } from "@/components/business/SoftwareStaffOverview";
import { SoftwareSyncStatusPanel } from "@/components/business/SoftwareSyncStatusPanel";
import { SoftwareTemplateNotConfigured } from "@/components/business/SoftwareTemplateNotConfigured";
import { BusinessDataTransferPanel } from "@/components/business/BusinessDataTransferPanel";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { useGetBusinessByIdQuery, useUploadBusinessLogoMutation } from "@/hooks/useBusiness";
import { getBusinessProfile } from "@/lib/business-profile";
import { resolveMediaUrl } from "@/lib/media-url";
import { getIndustryById } from "@/templates/industries";

export default function BusinessAdminSoftwareControlPage() {
  const businessId = useActiveBusinessId();
  const { role } = useAuth();
  const { businessName, templateConfig } = useBusinessTemplate();
  const { data: business, isLoading, isError, refetch } = useGetBusinessByIdQuery(businessId || "", {
    skip: !businessId,
  });
  const [uploadLogo, { isLoading: uploadingLogo }] = useUploadBusinessLogoMutation();

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
        <div className="mb-5">
          <LogoPickerField
            src={resolveMediaUrl(business.logo || templateConfig?.logoUrl || null)}
            hint="This logo is the app icon, portal favicon, login mark, splash, nav, and invoices."
            busy={uploadingLogo}
            onFile={async (file) => {
              await uploadLogo({ id: business.id, file }).unwrap();
              await refetch();
              toast.success("Logo saved");
            }}
          />
        </div>
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

      <ControlSection
        index={1}
        title="Export & import"
        description="Download a ZIP of this business (including product, category, and logo images) or restore one. Import appends; it does not wipe existing records."
        icon={Archive}
      >
        <BusinessDataTransferPanel
          businessId={businessId}
          businessName={business.businessName}
        />
      </ControlSection>

      {!hasTemplate ? (
        <SoftwareTemplateNotConfigured
          businessId={businessId}
          isSuperAdmin={role === "super_admin"}
        />
      ) : null}

      <SoftwareAppUpdatePanel businessId={businessId} />

      {hasTemplate ? (
        <>
          <SoftwareSyncStatusPanel businessId={businessId} />
          <SoftwareControlContent
          businessId={businessId}
          businessName={businessName}
          templateConfig={templateConfig}
          industryId={industryId}
          uploadedLogoUrl={business.logo}
          />
        </>
      ) : null}
    </div>
  );
}
