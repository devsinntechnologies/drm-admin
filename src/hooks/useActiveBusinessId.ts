"use client";

import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";
import { useEffect } from "react";

/**
 * Hook to get the currently active businessId.
 * Prioritizes the businessId from the URL query parameter if the user is a super_admin.
 * Otherwise, falls back to the businessId stored in localStorage.
 */
export function useActiveBusinessId() {
  const { role } = useAuth();
  const [urlBusinessId, setUrlBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setUrlBusinessId(params.get("businessId"));
  }, []);

  const businessId = useMemo(() => {
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
  }, [urlBusinessId, role]);

  return businessId;
}
