"use client";

import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

/**
 * Hook to get the currently active businessId.
 * Prioritizes the businessId from the URL query parameter if the user is a super_admin.
 * Otherwise, falls back to the businessId stored in localStorage.
 */
export function useActiveBusinessId() {
  const { role } = useAuth();
  const searchParams = useSearchParams();

  const businessId = useMemo(() => {
    // 1. Check URL query parameters
    const urlBusinessId = searchParams.get("businessId");

    // 2. If present and user is super_admin, prioritize it
    // Note: We also check for 'business_admin' in case we want to show the ID in the URL for them too.
    if (urlBusinessId && (role === "super_admin" || role === "business_admin")) {
      return urlBusinessId;
    }

    // 3. Fallback to localStorage
    if (typeof window !== "undefined") {
      return localStorage.getItem("businessId");
    }

    return null;
  }, [searchParams, role]);

  return businessId;
}
