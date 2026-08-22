"use client";

import { useParams } from "next/navigation";
import { WebsitePagesContent } from "@/components/business/website/WebsitePagesContent";

export default function SuperAdminWebsitePagesPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  return <WebsitePagesContent businessId={businessId} />;
}
