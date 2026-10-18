"use client";

import { SoftwareInvoiceTemplatesPanel } from "@/components/business/SoftwareInvoiceTemplatesPanel";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

export default function BusinessAdminSoftwareInvoiceTemplatesPage() {
  const businessId = useActiveBusinessId();

  if (!businessId) {
    return <p className="text-sm text-[#64748b]">No business selected.</p>;
  }

  return <SoftwareInvoiceTemplatesPanel businessId={businessId} />;
}
