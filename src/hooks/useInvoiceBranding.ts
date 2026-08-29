"use client";

import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { resolveMediaUrl } from "@/lib/media-url";

export const DIGINIZAM_WEBSITE = "diginizam.com";

export function useInvoiceBranding() {
  const { logoUrl, businessName, businessId } = useBusinessTemplate();
  const { data: business } = useGetBusinessByIdQuery(businessId || "", {
    skip: !businessId,
  });

  const resolvedLogo = resolveMediaUrl(logoUrl || business?.logo || null);
  const phone = (business?.phone || "").trim();
  const email = (business?.email || "").trim();
  const address = (business?.address || "").trim();

  return {
    logoUrl: resolvedLogo,
    businessName: business?.businessName || businessName || "DigiNizam Business",
    contactPhone: phone,
    contactEmail: email,
    address,
    website: DIGINIZAM_WEBSITE,
  };
}
