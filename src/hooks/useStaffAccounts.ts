"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BASE_URL } from "@/lib/constant";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import {
  getCreatableStaffRoles,
  getStaffCreateFamily,
  type StaffCreateFamily,
} from "@/lib/staff-role-catalog";
import { getStoredAuthToken } from "@/lib/utils";
import type { ModuleId } from "@/templates/types";

export type StaffAccount = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

function getAuthToken(reduxToken: string | null) {
  return reduxToken || getStoredAuthToken();
}

function normalizeStatus(raw: unknown): string {
  if (typeof raw === "boolean") return raw ? "active" : "inactive";
  const value = String(raw ?? "active").toLowerCase();
  return value === "inactive" || value === "disabled" ? "inactive" : "active";
}

function normalizeRow(row: Record<string, unknown>, fallbackRole?: string): StaffAccount {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    role: String(row.role ?? fallbackRole ?? ""),
    status: normalizeStatus(row.status ?? row.isActive ?? "active"),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
  };
}

async function fetchRestaurantRole(
  endpoint: string,
  authToken: string,
  businessId: string,
): Promise<StaffAccount[]> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.append("businessId", businessId);
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { accept: "*/*", Authorization: `Bearer ${authToken}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Failed to fetch ${endpoint}`);
  }
  const json = (await response.json()) as { data?: Record<string, unknown>[] };
  const role = endpoint === "waiters" ? "waiter" : "kitchen";
  return (json.data ?? []).map((row) => normalizeRow(row, role));
}

export function useStaffAccounts(
  businessId: string | null | undefined,
  industryId: string | null | undefined,
  enabledModules?: ModuleId[] | string[] | null,
) {
  const { token } = useAuth();
  const family: StaffCreateFamily = getStaffCreateFamily(industryId);
  const creatableRoles = useMemo(
    () => getCreatableStaffRoles(industryId, enabledModules),
    [industryId, enabledModules],
  );

  const [users, setUsers] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const authToken = getAuthToken(token);
    if (!authToken || !businessId) {
      setError(!authToken ? "No authentication token available" : null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (family === "restaurant") {
        const [waiters, kitchens] = await Promise.all([
          fetchRestaurantRole("waiters", authToken, businessId),
          fetchRestaurantRole("kitchens", authToken, businessId),
        ]);
        setUsers(
          [...waiters, ...kitchens].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
        return;
      }

      const path = family === "pharmacy" ? "/pharmacy/staff" : "/retail/staff";
      const result = await apiClient.get<{ data?: Record<string, unknown>[] } | Record<string, unknown>[]>(
        `${path}?page=1&limit=100`,
        authToken,
        businessId,
      );
      const rows = Array.isArray(result) ? result : (result?.data ?? []);
      setUsers(
        rows
          .map((row) => normalizeRow(row as Record<string, unknown>))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  }, [token, businessId, family]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const createStaff = useCallback(
    async (payload: { name: string; password: string; role: string; email?: string }) => {
      const authToken = getAuthToken(token);
      if (!authToken || !businessId) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        if (family === "restaurant") {
          const endpoint = payload.role === "kitchen" ? "kitchens" : "waiters";
          const url = new URL(`${BASE_URL}/${endpoint}`);
          url.searchParams.append("businessId", businessId);
          const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: payload.name,
              password: payload.password,
              businessId,
            }),
          });
          if (!response.ok) {
            const text = await response.text();
            let detail: unknown = text;
            try {
              const parsed = JSON.parse(text);
              detail = parsed.message || parsed.error || text;
            } catch {
              /* keep text */
            }
            throw new Error(typeof detail === "string" ? detail : "Failed to create staff");
          }
        } else {
          const path = family === "pharmacy" ? "/pharmacy/staff" : "/retail/staff";
          await apiClient.post(
            path,
            {
              name: payload.name,
              password: payload.password,
              role: payload.role,
              email: payload.email?.trim() || undefined,
            },
            authToken,
            businessId,
          );
        }
        await fetchUsers();
      } finally {
        setActionLoading(false);
      }
    },
    [token, businessId, family, fetchUsers],
  );

  const byRole = useMemo(() => {
    const map: Record<string, number> = {};
    for (const role of creatableRoles) map[role.key] = 0;
    for (const user of users) {
      map[user.role] = (map[user.role] ?? 0) + 1;
    }
    return map;
  }, [users, creatableRoles]);

  return {
    family,
    creatableRoles,
    users,
    byRole,
    loading,
    actionLoading,
    error,
    createStaff,
    refetch: fetchUsers,
  };
}
