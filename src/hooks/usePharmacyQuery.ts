"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

function coercePharmacyQueryData<T>(result: T): T {
  if (Array.isArray(result) || result == null) return result;
  if (typeof result !== "object") return result;
  const record = result as { data?: unknown };
  if (Array.isArray(record.data)) return record.data as T;
  if (record.data && typeof record.data === "object" && Array.isArray((record.data as { data?: unknown }).data)) {
    return (record.data as { data: T }).data;
  }
  return result;
}

type UsePharmacyQueryOptions = {
  /** Refetch when the browser tab becomes visible again */
  refetchOnFocus?: boolean;
  /** Skip fetch until businessId is available */
  requireBusinessId?: boolean;
};

export function usePharmacyQuery<T>(
  path: string | null,
  refreshKey: string | number = 0,
  options: UsePharmacyQueryOptions = {},
) {
  const { refetchOnFocus = true, requireBusinessId = true } = options;
  const pathname = usePathname();
  const { token } = useAuth();
  const businessId = useActiveBusinessId();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }
    if (requireBusinessId && !businessId) {
      setLoading(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<T>(path, token, businessId);
      setData(coercePharmacyQueryData(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [path, token, businessId, refreshKey, requireBusinessId, pathname]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!refetchOnFocus || !path) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void reload();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [path, reload, refetchOnFocus]);

  return { data, rows: asList<T extends unknown[] ? T[number] : T>(data), loading, error, reload, businessId, token };
}

export function usePharmacyAction() {
  const { token } = useAuth();
  const businessId = useActiveBusinessId();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>) => {
      setPending(true);
      try {
        return await fn();
      } finally {
        setPending(false);
      }
    },
    [],
  );

  return { token, businessId, pending, run };
}
