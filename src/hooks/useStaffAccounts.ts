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
import {
  asCredentialsResult,
  type CredentialsResult,
  type ResetCredentialsPayload,
} from "@/lib/credentials-result";

export type StaffAccount = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export type CreateStaffResult = {
  account: StaffAccount;
  temporaryPassword?: string;
  credentialsEmailSent?: boolean;
  credentialsEmailError?: string;
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

/** Same formula as backend generateEntityEmail: ownerlocal+staff_name@domain */
export function previewStaffLoginEmail(
  businessEmail: string | null | undefined,
  staffName: string,
  _role?: string,
): string {
  const trimmed = String(businessEmail || "").trim().toLowerCase();
  const at = trimmed.indexOf("@");
  const raw = at > 0 ? trimmed.slice(0, at) : "staff";
  const prefix =
    raw.replace(/[^a-z0-9._-]+/g, "").replace(/^\.+|\.+$/g, "") || "staff";
  const domain = at > 0 ? trimmed.slice(at + 1) : "gmail.com";
  const slug =
    staffName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "user";
  return `${prefix}+${slug}@${domain}`;
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
  const json = (await response.json()) as {
    data?: Record<string, unknown>[] | Record<string, unknown>;
  };
  const role = endpoint === "waiters" ? "waiter" : "kitchen";
  const raw = json.data;
  const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return rows.map((row) => normalizeRow(row, role));
}

async function parseFetchError(response: Response, fallback: string) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    const detail = parsed.message || parsed.error || text;
    return typeof detail === "string" ? detail : fallback;
  } catch {
    return text || fallback;
  }
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
      const result = await apiClient.get<
        { data?: Record<string, unknown>[] } | Record<string, unknown>[]
      >(`${path}?page=1&limit=100`, authToken, businessId);
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
    async (payload: {
      name: string;
      password: string;
      role: string;
      email?: string;
    }): Promise<CreateStaffResult> => {
      const authToken = getAuthToken(token);
      if (!authToken || !businessId) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        let created: Record<string, unknown> = {};

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
            throw new Error(await parseFetchError(response, "Failed to create staff"));
          }
          const json = (await response.json()) as {
            data?: Record<string, unknown>;
          } & Record<string, unknown>;
          created = (json.data ?? json) as Record<string, unknown>;
        } else {
          const path = family === "pharmacy" ? "/pharmacy/staff" : "/retail/staff";
          created = (await apiClient.post<Record<string, unknown>>(
            path,
            {
              name: payload.name,
              password: payload.password,
              role: payload.role,
              email: payload.email?.trim() || undefined,
            },
            authToken,
            businessId,
          )) as Record<string, unknown>;
        }

        await fetchUsers();
        return {
          account: normalizeRow(created, payload.role),
          temporaryPassword:
            typeof created.temporaryPassword === "string"
              ? created.temporaryPassword
              : payload.password,
          credentialsEmailSent: created.credentialsEmailSent === true,
          credentialsEmailError:
            typeof created.credentialsEmailError === "string"
              ? created.credentialsEmailError
              : undefined,
        };
      } finally {
        setActionLoading(false);
      }
    },
    [token, businessId, family, fetchUsers],
  );

  const updateStaff = useCallback(
    async (staff: StaffAccount, payload: { name?: string; role?: string }) => {
      const authToken = getAuthToken(token);
      if (!authToken || !businessId) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        if (family === "restaurant") {
          const endpoint = staff.role === "kitchen" ? "kitchens" : "waiters";
          const url = new URL(`${BASE_URL}/${endpoint}/${staff.id}`);
          url.searchParams.append("businessId", businessId);
          const response = await fetch(url.toString(), {
            method: "PATCH",
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: payload.name }),
          });
          if (!response.ok) {
            throw new Error(await parseFetchError(response, "Failed to update staff"));
          }
        } else {
          const path = family === "pharmacy" ? "/pharmacy/staff" : "/retail/staff";
          await apiClient.patch(
            `${path}/${staff.id}`,
            {
              name: payload.name,
              role: payload.role,
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

  const updatePassword = useCallback(
    async (
      staff: StaffAccount,
      password: string,
      options?: ResetCredentialsPayload,
    ): Promise<CredentialsResult | null> => {
      const authToken = getAuthToken(token);
      if (!authToken || !businessId) throw new Error("No authentication token available");

      const payload: ResetCredentialsPayload = {
        password: password || undefined,
        generate: options?.generate ?? !password,
        sendEmail: options?.sendEmail !== false,
      };

      setActionLoading(true);
      try {
        if (family === "restaurant") {
          const endpoint = staff.role === "kitchen" ? "kitchens" : "waiters";
          const url = new URL(`${BASE_URL}/${endpoint}/${staff.id}/password`);
          url.searchParams.append("businessId", businessId);
          const response = await fetch(url.toString(), {
            method: "PATCH",
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              newPassword: payload.password,
              password: payload.password,
              generate: payload.generate,
              sendEmail: payload.sendEmail,
            }),
          });
          if (!response.ok) {
            throw new Error(await parseFetchError(response, "Failed to update password"));
          }
          const json = await response.json().catch(() => null);
          return asCredentialsResult(json);
        }

        const path = family === "pharmacy" ? "/pharmacy/staff" : "/retail/staff";
        const raw = await apiClient.patch(
          `${path}/${staff.id}/password`,
          payload,
          authToken,
          businessId,
        );
        return asCredentialsResult(raw);
      } finally {
        setActionLoading(false);
      }
    },
    [token, businessId, family],
  );

  const setStatus = useCallback(
    async (staff: StaffAccount, isActive: boolean) => {
      const authToken = getAuthToken(token);
      if (!authToken || !businessId) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        if (family === "restaurant") {
          const endpoint = staff.role === "kitchen" ? "kitchens" : "waiters";
          const url = new URL(`${BASE_URL}/${endpoint}/${staff.id}/status`);
          url.searchParams.append("businessId", businessId);
          const response = await fetch(url.toString(), {
            method: "PATCH",
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ isActive }),
          });
          if (!response.ok) {
            throw new Error(await parseFetchError(response, "Failed to update status"));
          }
        } else {
          const path = family === "pharmacy" ? "/pharmacy/staff" : "/retail/staff";
          await apiClient.patch(
            `${path}/${staff.id}/status`,
            { isActive },
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

  const deleteStaff = useCallback(
    async (staff: StaffAccount) => {
      const authToken = getAuthToken(token);
      if (!authToken || !businessId) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        if (family === "restaurant") {
          const endpoint = staff.role === "kitchen" ? "kitchens" : "waiters";
          const url = new URL(`${BASE_URL}/${endpoint}/${staff.id}`);
          url.searchParams.append("businessId", businessId);
          const response = await fetch(url.toString(), {
            method: "DELETE",
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${authToken}`,
            },
          });
          if (!response.ok) {
            throw new Error(await parseFetchError(response, "Failed to remove staff"));
          }
        } else {
          const path = family === "pharmacy" ? "/pharmacy/staff" : "/retail/staff";
          await apiClient.delete(`${path}/${staff.id}`, authToken, businessId);
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
    updateStaff,
    updatePassword,
    setStatus,
    deleteStaff,
    refetch: fetchUsers,
  };
}
