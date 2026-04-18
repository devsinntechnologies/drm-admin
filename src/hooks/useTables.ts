import { useCallback, useEffect, useState } from "react";

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

interface UseTablesOptions {
  page?: number;
  limit?: number;
}

const BASE_URL = "https://vendor.umazing.shop";

function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("auth_token") || localStorage.getItem("token");
}

export function useTables(options: UseTablesOptions = {}) {
  const { page = 1, limit = 10 } = options;

  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    last_page: 1,
  });

  const fetchTables = useCallback(async (pageNum: number = 1) => {
    const token = getAuthToken();
    if (!token) {
      setError("No authentication token available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${BASE_URL}/tables`);
      url.searchParams.append("page", String(pageNum));
      if (limit) {
        url.searchParams.append("limit", String(limit));
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
        page: data.page ?? pageNum,
        last_page: data.last_page ?? 1,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred while fetching tables";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTables(page);
  }, [page, fetchTables]);

  const getTableById = useCallback(async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(`${BASE_URL}/tables/${id}`, {
      method: "GET",
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch table: ${response.statusText}`);
    }

    return (await response.json()) as TableRecord;
  }, []);

  const createTable = useCallback(
    async (payload: { tableNumber: string; capacity: number; status: TableStatus; image?: File | null }) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        const formData = new FormData();
        formData.append("tableNumber", payload.tableNumber);
        formData.append("capacity", String(payload.capacity));
        formData.append("status", payload.status);
        if (payload.image) {
          formData.append("image", payload.image);
        }

        const response = await fetch(`${BASE_URL}/tables/tables`, {
          method: "POST",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to create table: ${response.statusText}`);
        }

        await fetchTables(pagination.page);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTables, pagination.page],
  );

  const updateTable = useCallback(
    async (id: string, payload: { tableNumber: string; capacity: number; status: TableStatus; image?: File | null }) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        const formData = new FormData();
        formData.append("tableNumber", payload.tableNumber);
        formData.append("capacity", String(payload.capacity));
        formData.append("status", payload.status);
        if (payload.image) {
          formData.append("image", payload.image);
        }

        const response = await fetch(`${BASE_URL}/tables/${id}`, {
          method: "PATCH",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to update table: ${response.statusText}`);
        }

        await fetchTables(pagination.page);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTables, pagination.page],
  );

  const deleteTable = useCallback(
    async (id: string) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/tables/${id}`, {
          method: "DELETE",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete table: ${response.statusText}`);
        }

        await fetchTables(pagination.page);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTables, pagination.page],
  );

  return {
    tables,
    loading,
    actionLoading,
    error,
    pagination,
    fetchTables,
    getTableById,
    createTable,
    updateTable,
    deleteTable,
  };
}
