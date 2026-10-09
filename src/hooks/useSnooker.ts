"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import { getStoredAuthToken } from "@/lib/utils";

export type SnookerCategory = {
  id: string;
  name: string;
  description?: string | null;
  defaultSingleRate: number;
  defaultDoubleRate: number;
  defaultCenturyPerMinute: number;
  minDurationMinutes: number;
  roundingSeconds: number;
  pauseStopsBilling: boolean;
  isActive: boolean;
  sortOrder?: number;
};

export type SnookerGameTypeRow = {
  id: string;
  code: string;
  name: string;
  billingMode: "flat" | "per_frame" | "per_minute";
  billingMethod?: "fixed" | "fixed_plus_overtime" | "per_minute";
  basePrice?: number;
  includedMinutes?: number;
  maxDurationMinutes?: number | null;
  perMinuteRate?: number;
  overtimeEnabled?: boolean;
  overtimeRate?: number;
  pauseBillable?: boolean;
  allowManualAdjust?: boolean;
  autoStopAtMax?: boolean;
  roundingMode?: "ceil_minute" | "floor_minute" | "nearest_minute";
  isActive: boolean;
  sortOrder?: number;
};

export type SnookerSessionDecorated = {
  id: string;
  tableId: string;
  gameTypeCode: string;
  billingKind: string;
  billingUnit?: "session" | "hour" | "minute";
  orderCategoryId?: string | null;
  customFixedPrice?: number | null;
  customHourlyRate?: number | null;
  customRatePerMinute?: number | null;
  categoryReview?: string | null;
  packageSeconds?: number | null;
  status: "scheduled" | "active" | "paused" | "time_expired" | "ended";
  timingMode?: "timed" | "open";
  listBucket?: "upcoming" | "running" | "awaiting_checkout" | "ended";
  playerLabel?: string | null;
  startedAt: string;
  endsAt?: string | null;
  expiredAt?: string | null;
  expiryAckAt?: string | null;
  conflictFlag?: boolean;
  conflictNote?: string | null;
  rateSnapshot?: Record<string, unknown>;
  timing?: {
    elapsedSeconds: number;
    billableSeconds: number;
    remainingSeconds: number | null;
    isExpired: boolean;
  };
  amounts?: {
    gameAmount: number;
    extensionAmount: number;
    refreshmentAmount: number;
    discountAmount: number;
    currentAmount: number;
  };
  bill?: SnookerBill | null;
};

export type SnookerTableRow = {
  id: string;
  name: string;
  categoryId?: string | null;
  status: "available" | "occupied" | "reserved" | "maintenance";
  isActive: boolean;
  singleRate?: number | null;
  doubleRate?: number | null;
  centuryPerMinute?: number | null;
  allowedGameTypes?: string[] | null;
  session?: SnookerSessionDecorated | null;
};

export type SnookerBill = {
  id: string;
  sessionId: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  gameAmount: number;
  extensionAmount: number;
  refreshmentAmount: number;
  discountAmount: number;
};

export type SnookerDashboard = {
  tablesTotal: number;
  tablesAvailable: number;
  tablesOccupied: number;
  tablesMaintenance: number;
  activeSessions: number;
  awaitingCheckout?: number;
  alerts?: Array<{
    id: string;
    sessionId: string;
    tableId: string;
    tableName: string;
    message: string;
    expiredAt?: string | null;
    acknowledged: boolean;
  }>;
  salesToday: number;
  collectionsToday: number;
  creditSalesToday: number;
};

function auth(token: string | null) {
  return token || getStoredAuthToken();
}

export function useSnooker(pollMs = 8000) {
  const { token: reduxToken } = useAuth();
  const businessId = useActiveBusinessId();
  const token = auth(reduxToken);

  const [tables, setTables] = useState<SnookerTableRow[]>([]);
  const [categories, setCategories] = useState<SnookerCategory[]>([]);
  const [gameTypes, setGameTypes] = useState<SnookerGameTypeRow[]>([]);
  const [dashboard, setDashboard] = useState<SnookerDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!businessId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const [t, c, g, d] = await Promise.all([
        apiClient.get<SnookerTableRow[]>("/snooker/tables", token, businessId),
        apiClient.get<SnookerCategory[]>("/snooker/categories", token, businessId),
        apiClient.get<SnookerGameTypeRow[]>("/snooker/game-types", token, businessId),
        apiClient.get<SnookerDashboard>("/snooker/dashboard", token, businessId),
      ]);
      setTables(Array.isArray(t) ? t : []);
      setCategories(Array.isArray(c) ? c : []);
      setGameTypes(Array.isArray(g) ? g : []);
      setDashboard(d ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load snooker data");
    } finally {
      setLoading(false);
    }
  }, [businessId, token]);

  useEffect(() => {
    void refresh();
    if (!pollMs) return;
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [refresh, pollMs]);

  const createTable = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      try {
        await apiClient.post("/snooker/tables", body, token, businessId);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const updateCategory = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      setBusy(true);
      try {
        await apiClient.patch(`/snooker/categories/${id}`, body, token, businessId);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const createCategory = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      try {
        await apiClient.post("/snooker/categories", body, token, businessId);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const updateGameType = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      setBusy(true);
      try {
        await apiClient.patch(`/snooker/game-types/${id}`, body, token, businessId);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const startSession = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      try {
        const session = await apiClient.post<SnookerSessionDecorated>(
          "/snooker/sessions/start",
          body,
          token,
          businessId,
        );
        await refresh();
        return session;
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const previewSession = useCallback(
    async (body: Record<string, unknown>) => {
      return apiClient.post<{ estimatedAmount: number; rateSnapshot: Record<string, unknown> }>(
        "/snooker/sessions/preview",
        body,
        token,
        businessId,
      );
    },
    [token, businessId],
  );

  const pauseSession = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        await apiClient.post(`/snooker/sessions/${id}/pause`, {}, token, businessId);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const resumeSession = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        await apiClient.post(`/snooker/sessions/${id}/resume`, {}, token, businessId);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const extendSession = useCallback(
    async (id: string, body: { extraMinutes: number; agreedAmount: number; reason?: string }) => {
      setBusy(true);
      try {
        await apiClient.post(`/snooker/sessions/${id}/extend`, body, token, businessId);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const endSession = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        const result = await apiClient.post<{
          session: SnookerSessionDecorated;
          bill: SnookerBill;
        }>(`/snooker/sessions/${id}/end`, {}, token, businessId);
        await refresh();
        return result;
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const addLineItem = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      setBusy(true);
      try {
        await apiClient.post(`/snooker/sessions/${id}/line-items`, body, token, businessId);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const payBill = useCallback(
    async (billId: string, body: Record<string, unknown>) => {
      setBusy(true);
      try {
        const bill = await apiClient.post<SnookerBill>(
          `/snooker/bills/${billId}/pay`,
          body,
          token,
          businessId,
        );
        await refresh();
        return bill;
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const resolveConflict = useCallback(
    async (id: string, note: string) => {
      setBusy(true);
      try {
        await apiClient.post(
          `/snooker/sessions/${id}/resolve-conflict`,
          { note },
          token,
          businessId,
        );
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  const acknowledgeExpiry = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        await apiClient.post(`/snooker/sessions/${id}/ack-expiry`, {}, token, businessId);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [token, businessId, refresh],
  );

  return {
    tables,
    categories,
    gameTypes,
    dashboard,
    loading,
    error,
    busy,
    refresh,
    createTable,
    createCategory,
    updateCategory,
    updateGameType,
    startSession,
    previewSession,
    pauseSession,
    resumeSession,
    extendSession,
    endSession,
    addLineItem,
    payBill,
    acknowledgeExpiry,
    resolveConflict,
    businessId,
  };
}
