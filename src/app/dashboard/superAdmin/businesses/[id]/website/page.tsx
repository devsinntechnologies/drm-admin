"use client";

import { useParams } from "next/navigation";
import { WebsiteOverviewContent } from "@/components/business/website/WebsiteOverviewContent";

export default function SuperAdminWebsiteOverviewPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  return <WebsiteOverviewContent businessId={businessId} websiteBasePath={`/dashboard/superAdmin/businesses/${businessId}/website`} />;
}
