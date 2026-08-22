"use client";

import { useParams } from "next/navigation";
import { WebsiteThemeContent } from "@/components/business/website/WebsiteThemeContent";

export default function SuperAdminWebsiteThemePage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  return <WebsiteThemeContent businessId={businessId} />;
}
