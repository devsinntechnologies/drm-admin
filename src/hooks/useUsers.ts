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
  total: number;
  page: number;
  last_page: number;
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
        total: waitersResponse.total ?? 0,
        page: waitersResponse.page ?? 1,
        last_page: waitersResponse.last_page ?? 1,
      });
      setKitchensMeta({
        total: kitchensResponse.total ?? 0,
        page: kitchensResponse.page ?? 1,
        last_page: kitchensResponse.last_page ?? 1,
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

      setActionLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/${endpoint}`, {
          method: "POST",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Failed to create ${payload.role}: ${response.statusText}`);
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
    refetch: fetchUsers,
  };
}
