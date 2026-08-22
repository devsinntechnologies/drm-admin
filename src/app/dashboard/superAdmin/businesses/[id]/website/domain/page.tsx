"use client";

import { useParams } from "next/navigation";
import { WebsiteDomainContent } from "@/components/business/website/WebsiteDomainContent";

export default function SuperAdminWebsiteDomainPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  return <WebsiteDomainContent businessId={businessId} />;
}
