"use client";

import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { useAuth } from "@/hooks/useAuth";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { getStoredAuthToken } from "@/lib/utils";
import { hydrateWorkspaceTemplate } from "@/lib/hydrate-workspace-template";
import { buildWorkspaceThemeStyle } from "@/templates/modules";

type BusinessTemplateContextValue = {
  businessId: string | null;
  businessName: string;
  templateConfig: ApiTemplateConfig | null;
  primaryColor: string;
  secondaryColor: string;
  themeMode: "light" | "dark";
  logoUrl: string | null;
  currency: string;
  isLoading: boolean;
  isError: boolean;
  isUnauthorized: boolean;
  themeStyle: CSSProperties;
};

const DEFAULT_PRIMARY = "#001840";
const DEFAULT_SECONDARY = "#0050F8";

const BusinessTemplateContext = createContext<BusinessTemplateContextValue | null>(null);

type BusinessTemplateProviderProps = {
  children: ReactNode;
  businessId?: string | null;
};

export function BusinessTemplateProvider({ children, businessId = null }: BusinessTemplateProviderProps) {
  const router = useRouter();
  const { token: reduxToken } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Defer localStorage reads until after mount so SSR and the first client render match.
  const authToken = reduxToken || (hasHydrated ? getStoredAuthToken() : null);

  const { data: business, isLoading, isError, error } = useGetBusinessByIdQuery(businessId || "", {
    skip: !businessId || !authToken,
  });

  const isUnauthorized =
    isError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 401;

  useEffect(() => {
    if (!businessId) return;
    if (!authToken) {
      const returnTo = `/dashboard/businessAdmin?businessId=${encodeURIComponent(businessId)}`;
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [authToken, businessId, router]);

  const templateConfig = hydrateWorkspaceTemplate(business?.templateConfig ?? null);

  const value = useMemo<BusinessTemplateContextValue>(() => {
    const primaryColor = templateConfig?.primaryColor ?? DEFAULT_PRIMARY;
    const secondaryColor = templateConfig?.secondaryColor ?? DEFAULT_SECONDARY;
    const themeMode = templateConfig?.themeMode ?? "light";
    const isWorkspaceLoading = Boolean(businessId && authToken && !isError && isLoading);

    return {
      businessId: businessId ?? null,
      businessName: business?.businessName ?? templateConfig?.businessName ?? "Business",
      templateConfig,
      primaryColor,
      secondaryColor,
      themeMode,
      logoUrl: templateConfig?.logoUrl ?? business?.logo ?? null,
      currency: templateConfig?.currency ?? "PKR",
      isLoading: isWorkspaceLoading,
      isError,
      isUnauthorized,
      themeStyle: buildWorkspaceThemeStyle(primaryColor, secondaryColor, themeMode) as CSSProperties,
    };
  }, [authToken, business, businessId, isError, isLoading, isUnauthorized, templateConfig]);

  return (
    <BusinessTemplateContext.Provider value={value}>{children}</BusinessTemplateContext.Provider>
  );
}

export function useBusinessTemplate() {
  const ctx = useContext(BusinessTemplateContext);
  if (!ctx) {
    return {
      businessId: null,
      businessName: "Business",
      templateConfig: null,
      primaryColor: DEFAULT_PRIMARY,
      secondaryColor: DEFAULT_SECONDARY,
      themeMode: "light" as const,
      logoUrl: null,
      currency: "PKR",
      isLoading: false,
      isError: false,
      isUnauthorized: false,
      themeStyle: buildWorkspaceThemeStyle(DEFAULT_PRIMARY, DEFAULT_SECONDARY, "light") as CSSProperties,
    };
  }
  return ctx;
}
