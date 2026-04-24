import { useCallback, useEffect, useMemo, useState } from "react";
import { BASE_URL } from "@/lib/constant";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

export type UserRole = "waiter" | "kitchen";

export interface CreateStaffPayload {
  name: string;
  password: string;
  role: UserRole;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessName: string;
  businessId: string;
  status: string;
  createdAt: string;
}

interface StaffListResponse {
  data: StaffUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface RoleMeta {
  total: number;
  page: number;
  last_page: number;
}

function getAuthToken(reduxToken: string | null) {
  if (reduxToken) {
    return reduxToken;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("auth_token") || localStorage.getItem("token");
}


async function fetchRoleUsers(endpoint: string, authToken: string, activeBusinessId?: string | null) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  if (activeBusinessId) {
    url.searchParams.append("businessId", activeBusinessId);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to fetch ${endpoint}: ${response.statusText}`);
  }

  return (await response.json()) as StaffListResponse;
}

export function useUsers() {
  const { token } = useAuth();
  const activeBusinessId = useActiveBusinessId();

  const [waiters, setWaiters] = useState<StaffUser[]>([]);
  const [kitchens, setKitchens] = useState<StaffUser[]>([]);
  const [waitersMeta, setWaitersMeta] = useState<RoleMeta>({ total: 0, page: 1, last_page: 1 });
  const [kitchensMeta, setKitchensMeta] = useState<RoleMeta>({ total: 0, page: 1, last_page: 1 });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const authToken = getAuthToken(token);

    if (!authToken) {
      setError("No authentication token available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [waitersResponse, kitchensResponse] = await Promise.all([
        fetchRoleUsers("waiters", authToken, activeBusinessId),
        fetchRoleUsers("kitchens", authToken, activeBusinessId),
      ]);

      setWaiters(waitersResponse.data ?? []);
      setKitchens(kitchensResponse.data ?? []);
      setWaitersMeta({
        total: waitersResponse.pagination?.total ?? 0,
        page: waitersResponse.pagination?.page ?? 1,
        last_page: waitersResponse.pagination?.totalPages ?? 1,
      });
      setKitchensMeta({
        total: kitchensResponse.pagination?.total ?? 0,
        page: kitchensResponse.pagination?.page ?? 1,
        last_page: kitchensResponse.pagination?.totalPages ?? 1,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch users";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, activeBusinessId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = useCallback(
    async (payload: CreateStaffPayload) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      const endpoint = payload.role === "waiter" ? "waiters" : "kitchens";
      const requestBody: Record<string, string> = {
        name: payload.name,
        password: payload.password,
      };

      if (activeBusinessId) {
        requestBody.businessId = activeBusinessId;
      }

      const url = new URL(`${BASE_URL}/${endpoint}`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      setActionLoading(true);
      try {
        const bodyStr = JSON.stringify(requestBody);
        console.log(`[createUser] POST ${url.toString()} body:`, bodyStr);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: bodyStr,
        });

        if (!response.ok) {
          const text = await response.text();
          let detail: any = text;
          try {
            const parsed = JSON.parse(text);
            detail = parsed.message || parsed.error || text;
            if (typeof detail === 'object' && detail.message) {
              detail = detail.message;
            }
            if (Array.isArray(detail)) detail = detail.join(", ");
          } catch (e) { /* not json */ }
          throw new Error(detail);
        }

        const created = await response.json().catch(() => null);
        await fetchUsers();
        return created;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchUsers, token, activeBusinessId],
  );

  const users = useMemo(
    () => [...waiters, ...kitchens].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [kitchens, waiters],
  );

  const updatePassword = useCallback(
    async (user: { id: string; role: UserRole }, newPassword: string) => {
      const authToken = getAuthToken(token);
      if (!authToken) throw new Error("No authentication token available");

      // Swagger: PATCH /waiters/{waiterId}/password  or  /kitchens/{id}/password
      const endpoint = user.role === "waiter"
        ? `waiters/${user.id}/password`
        : `kitchens/${user.id}/password`;

      const url = new URL(`${BASE_URL}/${endpoint}`);
      if (activeBusinessId) url.searchParams.append("businessId", activeBusinessId);

      setActionLoading(true);
      try {
        const payload: Record<string, any> = { 
          password: newPassword,
          newPassword: newPassword
        };
        if (activeBusinessId) {
          payload.businessId = activeBusinessId;
        }

        const response = await fetch(url.toString(), {
          method: "PATCH",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          let detail: any = text;
          try {
            const parsed = JSON.parse(text);
            detail = parsed.message || parsed.error || text;
            if (typeof detail === 'object' && detail.message) {
              detail = detail.message;
            }
            if (Array.isArray(detail)) detail = detail.join(", ");
          } catch (e) { /* not json */ }
          throw new Error(detail);
        }

        await fetchUsers();
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchUsers, token, activeBusinessId],
  );

  const deleteUser = useCallback(
    async (user: { id: string; role: UserRole }) => {
      const authToken = getAuthToken(token);
      if (!authToken) throw new Error("No authentication token available");

      const endpoint = user.role === "waiter" ? `waiters/${user.id}` : `kitchens/${user.id}`;
      const url = new URL(`${BASE_URL}/${endpoint}`);
      if (activeBusinessId) url.searchParams.append("businessId", activeBusinessId);

      setActionLoading(true);
      try {
        const response = await fetch(url.toString(), {
          method: "DELETE",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          let detail: any = text;
          try {
            const parsed = JSON.parse(text);
            detail = parsed.message || parsed.error || text;
            if (typeof detail === 'object' && detail.message) {
              detail = detail.message;
            }
            if (Array.isArray(detail)) detail = detail.join(", ");
          } catch (e) { /* not json */ }
          throw new Error(detail);
        }

        await fetchUsers();
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchUsers, token, activeBusinessId],
  );

  return {
    users,
    waiters,
    kitchens,
    waitersMeta,
    kitchensMeta,
    loading,
    actionLoading,
    error,
    createUser,
    updatePassword,
    deleteUser,
    refetch: fetchUsers,
  };
}
