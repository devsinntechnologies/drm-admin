export type BusinessProductId = "website" | "portal" | "software";

export type BusinessProductFlags = {
  websiteEnabled?: boolean;
  portalEnabled?: boolean;
  softwareEnabled?: boolean;
};

/** Missing flags (legacy API) count as on so existing businesses stay usable. */
export function isBusinessProductEnabled(value: boolean | undefined): boolean {
  return value !== false;
}

export const BUSINESS_PRODUCTS: Array<{
  id: BusinessProductId;
  label: string;
  flag: keyof BusinessProductFlags;
}> = [
  { id: "website", label: "Website", flag: "websiteEnabled" },
  { id: "portal", label: "Portal", flag: "portalEnabled" },
  { id: "software", label: "Software", flag: "softwareEnabled" },
];
