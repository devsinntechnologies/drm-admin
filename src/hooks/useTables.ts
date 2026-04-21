import { useCallback, useEffect, useState } from "react";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

export type TableStatus = "available" | "occupied" | "reserved";

export interface TableRecord {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  image?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

interface TablesResponse {
  data: TableRecord[];
  total: number;
  page: number;
  last_page: number;
}

const BASE_URL = "https://vendor.umazing.shop";

function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || localStorage.getItem("token");
}

export function useTables() {
  const activeBusinessId = useActiveBusinessId();

  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    last_page: 1,
  });

  const fetchTables = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("No authentication token available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Construction without page and limit as requested
      const url = new URL(`${BASE_URL}/tables`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.statusText}`);
      }

      const data: TablesResponse = await response.json();
      setTables(data.data ?? []);
      setPagination({
        total: data.total ?? 0,
        page: data.page ?? 1,
        last_page: data.last_page ?? 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const getTableById = useCallback(async (id: string) => {
    const token = getAuthToken();
    if (!token) throw new Error("No token");

    const url = new URL(`${BASE_URL}/tables/${id}`);
    if (activeBusinessId) {
      url.searchParams.append("businessId", activeBusinessId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { accept: "*/*", Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Fetch failed");
    return (await response.json()) as TableRecord;
  }, [activeBusinessId]);

  const createTable = useCallback(
    async (payload: { tableNumber: string; capacity: number; status: TableStatus; image?: File | null }) => {
      const token = getAuthToken();
      if (!token) throw new Error("No token");

      setActionLoading(true);
      try {
        const formData = new FormData();
        formData.append("tableNumber", payload.tableNumber);
        formData.append("capacity", String(payload.capacity));
        formData.append("status", payload.status);
        if (payload.image) formData.append("image", payload.image);

        const url = new URL(`${BASE_URL}/tables`);
        if (activeBusinessId) url.searchParams.append("businessId", activeBusinessId);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) throw new Error("Create failed");
        await fetchTables();
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTables, activeBusinessId],
  );

  const updateTable = useCallback(
    async (id: string, payload: { tableNumber: string; capacity: number; status: TableStatus; image?: File | null }) => {
      const token = getAuthToken();
      if (!token) throw new Error("No token");

      setActionLoading(true);
      try {
        const formData = new FormData();
        formData.append("tableNumber", payload.tableNumber);
        formData.append("capacity", String(payload.capacity));
        formData.append("status", payload.status);
        if (payload.image) formData.append("image", payload.image);

        const url = new URL(`${BASE_URL}/tables/${id}`);
        if (activeBusinessId) url.searchParams.append("businessId", activeBusinessId);

        const response = await fetch(url.toString(), {
          method: "PATCH",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) throw new Error("Update failed");
        await fetchTables();
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTables, activeBusinessId],
  );

  const deleteTable = useCallback(
    async (id: string) => {
      const token = getAuthToken();
      if (!token) throw new Error("No token");

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/tables/${id}`);
        if (activeBusinessId) url.searchParams.append("businessId", activeBusinessId);
        
        const response = await fetch(url.toString(), {
          method: "DELETE",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Delete failed");
        await fetchTables();
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTables, activeBusinessId],
  );

  return { tables, loading, actionLoading, error, pagination, fetchTables, getTableById, createTable, updateTable, deleteTable };
}
