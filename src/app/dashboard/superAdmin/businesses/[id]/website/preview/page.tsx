"use client";

import { useParams } from "next/navigation";
import { WebsitePreviewContent } from "@/components/business/website/WebsitePreviewContent";

export default function WebsitePreviewPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  return <WebsitePreviewContent businessId={businessId} />;
}
