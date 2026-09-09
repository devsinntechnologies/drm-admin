"use client";

import { SoftwarePrintersPanel } from "@/components/business/SoftwarePrintersPanel";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { appendBusinessId } from "@/lib/module-routes";

export default function BusinessAdminSoftwarePrintersPage() {
  const businessId = useActiveBusinessId();

  if (!businessId) {
    return <p className="text-sm text-[#64748b]">No business selected.</p>;
  }

  return (
    <SoftwarePrintersPanel
      businessId={businessId}
      controlHref={appendBusinessId("/dashboard/businessAdmin/software/control", businessId)}
    />
  );
}
