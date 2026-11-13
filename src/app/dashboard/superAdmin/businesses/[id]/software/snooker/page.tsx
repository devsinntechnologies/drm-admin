"use client";

import { useParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import { SnookerTableControlPanel } from "@/components/business/snooker-control/SnookerTableControlPanel";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { isSnookerIndustry } from "@/lib/industry-workspace";

export default function SuperAdminSnookerTableControlPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { data: business, isLoading } = useGetBusinessByIdQuery(businessId, {
    skip: !businessId,
  });

  if (!businessId) {
    return <p className="text-sm text-[#64748b]">Invalid business ID.</p>;
  }
  if (isLoading) {
    return <Loading className="py-16" label="Loading business…" />;
  }

  // Snooker Table Control is specific to the snooker industry; other
  // industries (restaurant, retail, pharmacy…) must not get this screen.
  if (!isSnookerIndustry(business?.templateConfig?.industryId)) {
    return (
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#475569]">
        <p className="font-semibold text-[#0f172a]">Snooker Table Control is not available</p>
        <p className="mt-2">
          This control is only for businesses on the Snooker industry template.
        </p>
      </div>
    );
  }

  return <SnookerTableControlPanel businessId={businessId} businessName={business?.businessName ?? undefined} />;
}
