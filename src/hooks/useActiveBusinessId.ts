"use client";

import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

/**
 * Hook to get the currently active businessId.
 * Prioritizes the businessId from the URL query parameter if present.
 * Otherwise, falls back to the businessId stored in localStorage for business staff.
 */
export function useActiveBusinessId() {
  const { role } = useAuth();
  const searchParams = useSearchParams();

  const businessId = useMemo(() => {
    // 1. Check URL query parameters
    const urlBusinessId = searchParams.get("businessId");

    // 2. If present, prioritize it
    if (urlBusinessId) {
      return urlBusinessId.trim();
    }

    // 3. Fallback to localStorage ONLY for business-related roles
    if (typeof window !== "undefined") {
      const isStaff = role === "business_admin" || role === "kitchen" || role === "waiter";
      if (isStaff) {
        const storedId = localStorage.getItem("businessId");
        return storedId ? storedId.trim() : null;
      }
    }

    return null;
  }, [searchParams, role]);

  return businessId;
}
