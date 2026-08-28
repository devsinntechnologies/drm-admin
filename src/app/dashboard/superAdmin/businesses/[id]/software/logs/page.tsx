"use client";

import { useParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import { BusinessActionLogsPanel } from "@/components/business/BusinessActionLogsPanel";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";

export default function SuperAdminBusinessSoftwareLogsPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { data: business, isLoading } = useGetBusinessByIdQuery(businessId, {
    skip: !businessId,
  });

  if (isLoading) {
    return <Loading className="py-16" label="Loading business…" />;
  }

  return (
    <BusinessActionLogsPanel
      businessId={businessId}
      businessName={business?.businessName ?? undefined}
    />
  );
}
