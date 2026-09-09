"use client";

import { useParams } from "next/navigation";
import { SoftwarePrintersPanel } from "@/components/business/SoftwarePrintersPanel";

export default function SuperAdminBusinessSoftwarePrintersPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;

  return (
    <SoftwarePrintersPanel
      businessId={businessId}
      controlHref={`/dashboard/superAdmin/businesses/${businessId}/software/control`}
    />
  );
}
