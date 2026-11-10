"use client";

import { useParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import { SnookerTableControlPanel } from "@/components/business/snooker-control/SnookerTableControlPanel";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";

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

  return <SnookerTableControlPanel businessId={businessId} businessName={business?.businessName ?? undefined} />;
}
