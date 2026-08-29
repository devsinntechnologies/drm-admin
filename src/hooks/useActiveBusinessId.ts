"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { normalizePortalRole } from "@/lib/role-access";
import { useMemo } from "react";

/**
 * Hook to get the currently active businessId.
 * Prioritizes the businessId from the URL query parameter if present.
 * Otherwise, falls back to the businessId stored in localStorage for business
 * staff, and for super_admin while impersonating a business workspace.
 */
export function useActiveBusinessId() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const businessId = useMemo(() => {
    const urlBusinessId = searchParams.get("businessId");

    if (urlBusinessId) {
      return urlBusinessId.trim();
    }

    if (typeof window === "undefined") return null;

    const storedId = localStorage.getItem("businessId");
    if (!storedId) return null;

    const normalized = normalizePortalRole(role);
    const onBusinessWorkspace = pathname.includes("/businessAdmin");
    const isStaff =
      normalized === "business_admin" ||
      normalized === "kitchen" ||
      normalized === "waiter" ||
      normalized === "pharmacist" ||
      normalized === "cashier" ||
      normalized === "inventory_manager" ||
      normalized === "pharmacy_manager" ||
      normalized === "shift_incharge" ||
      normalized === "store_manager" ||
      normalized === "inventory_clerk";

    if (isStaff || (normalized === "super_admin" && onBusinessWorkspace)) {
      return storedId.trim();
    }

    return null;
  }, [searchParams, role, pathname]);

  return businessId;
}
