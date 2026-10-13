"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import { SoftwareAppUpdatePanel } from "@/components/business/SoftwareAppUpdatePanel";
import { SoftwareControlContent } from "@/components/business/SoftwareControlContent";
import { SoftwareSyncStatusPanel } from "@/components/business/SoftwareSyncStatusPanel";
import { SoftwareTemplateNotConfigured } from "@/components/business/SoftwareTemplateNotConfigured";
import { FbrSettingsPanel } from "@/components/business/FbrSettingsPanel";
import { FbrActivityPanel } from "@/components/business/FbrActivityPanel";
import { CrmSchemaPanel } from "@/components/crm/CrmSchemaPanel";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { getBusinessProfile } from "@/lib/business-profile";
import { normalizeErrorMessage } from "@/lib/utils";
import { getIndustryById } from "@/templates/industries";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

function describeBusinessLoadError(error: unknown): string {
  if (error && typeof error === "object" && "status" in error) {
    const fetchError = error as FetchBaseQueryError;
    if (fetchError.status === "FETCH_ERROR") {
      return "Cannot reach the API. Confirm Nest is running on port 6000 and drm-admin .env.local proxies /backend to it.";
    }
    if (fetchError.status === 401) {
      return "Session expired or invalid. Sign in again as super admin.";
    }
    if (fetchError.status === 403) {
      return "Your account cannot access this business.";
    }
    if (fetchError.status === 404) {
      return "Business not found (wrong ID or deleted).";
    }
    if (typeof fetchError.status === "number") {
      return normalizeErrorMessage(fetchError.data, `Request failed (HTTP ${fetchError.status}).`);
    }
  }
  return normalizeErrorMessage(error, "Could not load this business.");
}

export default function SoftwareControlPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  const { data: business, isLoading, isError, error } = useGetBusinessByIdQuery(businessId, {
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
        <p className="font-semibold">Could not load this business.</p>
        <p className="mt-2 text-[#991b1b]">{describeBusinessLoadError(error)}</p>
        {businessId ? (
          <p className="mt-2 text-xs text-[#7f1d1d]">
            Business ID: <code className="rounded bg-white/80 px-1">{businessId}</code>
          </p>
        ) : null}
        <Link href="/dashboard/superAdmin/businesses" className="mt-3 inline-block font-semibold underline">
          Back to businesses
        </Link>
      </div>
    );
  }

  const profile = business.templateConfig
    ? { industryId: business.templateConfig.industryId }
    : getBusinessProfile(businessId, business.businessName);

  const templateConfig = business.templateConfig ?? null;

  const industryId =
    getIndustryById(templateConfig?.industryId ?? profile.industryId)?.id ??
    getIndustryById(profile.industryId)?.id ??
    getBusinessProfile(businessId, business.businessName).industryId;
  const hasTemplate = Boolean(templateConfig?.id);

  return (
    <div className="space-y-6">
      <FbrSettingsPanel
        sectionIndex={1}
        businessId={businessId}
        businessName={business.businessName}
        address={business.address}
        fbrSettings={business.fbrSettings}
      />
      <FbrActivityPanel sectionIndex={2} businessId={businessId} />
      <CrmSchemaPanel sectionIndex={3} businessId={businessId} />

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
            uploadedLogoUrl={business.logo}
            platformAdmin
          />
        </>
      ) : null}
    </div>
  );
}
