"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import type { PrinterDraft, PrinterRole, PrintersPayload } from "@/lib/printers";

export function usePrinters(businessId: string | null) {
  const { token } = useAuth();
  const [data, setData] = useState<PrintersPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token || !businessId) return;
    setLoading(true);
    setError(null);
    try {
      const next = await apiClient.get<PrintersPayload>("/printers", token, businessId);
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load printers");
    } finally {
      setLoading(false);
    }
  }, [token, businessId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const save = useCallback(
    async (printers: PrinterDraft[]) => {
      if (!token || !businessId) return;
      setSaving(true);
      setError(null);
      try {
        const next = await apiClient.put<PrintersPayload>(
          "/printers",
          {
            printers: printers.map((item) => ({
              id: item.id,
              role: item.role,
              name: item.name,
              connectionType: item.connectionType,
              ipMode: item.ipMode,
              ip: item.ip.trim() || null,
              port: item.port,
              isEnabled: item.isEnabled,
              paperWidth: item.paperWidth,
            })),
          },
          token,
          businessId,
        );
        setData(next);
        return next;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save printers");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token, businessId],
  );

  return { data, loading, saving, error, refetch, save };
}

export function useIndustryPrinterDefaults() {
  const { token } = useAuth();
  const [savingId, setSavingId] = useState<string | null>(null);

  const saveDefaults = useCallback(
    async (industryId: string, defaultPrinterRoles: PrinterRole[]) => {
      if (!token) return;
      setSavingId(industryId);
      try {
        return await apiClient.patch<{ id: string; defaultPrinterRoles: PrinterRole[] }>(
          `/printers/industry/${industryId}/defaults`,
          { defaultPrinterRoles },
          token,
        );
      } finally {
        setSavingId(null);
      }
    },
    [token],
  );

  return { saveDefaults, savingId };
}
