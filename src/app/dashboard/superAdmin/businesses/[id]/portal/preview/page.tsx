"use client";

import { useParams } from "next/navigation";
import { PortalPreviewContent } from "@/components/business/PortalPreviewContent";

export default function PortalPreviewPage() {
  const params = useParams();
  const businessId = typeof params.id === "string" ? params.id : "";
  return <PortalPreviewContent businessId={businessId} />;
}
