"use client";

import Loading from "@/components/common/Loading";
import { BusinessActionLogsPanel } from "@/components/business/BusinessActionLogsPanel";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

export default function BusinessAdminSoftwareLogsPage() {
  const businessId = useActiveBusinessId();
  const { businessName } = useBusinessTemplate();

  if (!businessId) {
    return <p className="text-sm text-[#64748b]">No business selected.</p>;
  }

  return (
    <div className="space-y-4">
      <BusinessActionLogsPanel businessId={businessId} businessName={businessName} />
    </div>
  );
}
