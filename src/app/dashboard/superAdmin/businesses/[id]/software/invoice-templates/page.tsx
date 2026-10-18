"use client";

import { useParams } from "next/navigation";
import { SoftwareInvoiceTemplatesPanel } from "@/components/business/SoftwareInvoiceTemplatesPanel";

export default function SuperAdminBusinessSoftwareInvoiceTemplatesPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;

  return <SoftwareInvoiceTemplatesPanel businessId={businessId} />;
}
