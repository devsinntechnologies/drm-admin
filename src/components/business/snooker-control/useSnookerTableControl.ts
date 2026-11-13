"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { getStoredAuthToken, normalizeErrorMessage } from "@/lib/utils";
import { asRowList } from "@/lib/snooker-session-options";
import type { SnookerGameTypeRow } from "@/hooks/useSnooker";
import type { GameTypePayload } from "./game-type-form";

/**
 * Super-admin data access for one business's game types.
 * Backend: /admin/businesses/:businessId/snooker/game-types (role super_admin).
 */
export function useSnookerTableControl(businessId: string) {
  const { token: reduxToken } = useAuth();
  const token = reduxToken || getStoredAuthToken();
  const base = `/admin/businesses/${businessId}/snooker/game-types`;

  const [rows, setRows] = useState<SnookerGameTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(asRowList<SnookerGameTypeRow>(await apiClient.get<unknown>(base, token)));
    } catch (err) {
      setError(normalizeErrorMessage(err, "Could not load game types."));
    } finally {
      setLoading(false);
    }
  }, [base, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const replace = (saved: SnookerGameTypeRow) =>
    setRows((current) => current.map((r) => (r.id === saved.id ? { ...r, ...saved } : r)));

  const create = useCallback(
    async (payload: GameTypePayload) => {
      const saved = await apiClient.post<SnookerGameTypeRow>(base, payload, token);
      setRows((current) =>
        [...current, saved].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      );
      return saved;
    },
    [base, token],
  );

  const update = useCallback(
    async (id: string, patch: Partial<GameTypePayload>) => {
      const saved = await apiClient.patch<SnookerGameTypeRow>(`${base}/${id}`, patch, token);
      replace(saved);
      return saved;
    },
    [base, token],
  );

  const remove = useCallback(
    async (id: string) => {
      await apiClient.delete(`${base}/${id}`, token);
      setRows((current) => current.filter((r) => r.id !== id));
    },
    [base, token],
  );

  return { rows, loading, error, reload, create, update, remove };
}
