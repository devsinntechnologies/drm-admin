import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  success: boolean;
  statusCode: number;
  message: string;
  data: TableRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const BASE_URL = "https://vendor.umazing.shop";

function getAuthToken(reduxToken: string | null) {
  if (reduxToken) return reduxToken;
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || localStorage.getItem("token");
}

interface UseTablesOptions {
  page?: number;
  limit?: number;
}

export function useTables(options: UseTablesOptions = {}) {
  const { page = 1, limit = 10 } = options;
  const { token: reduxToken } = useAuth();
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

  const fetchTables = useCallback(async (pageNum: number = 1) => {
    const token = getAuthToken(reduxToken);
    if (!token) {
      setError("No authentication token available");
      return;
    }

    if (!activeBusinessId) {
      setTables([]);
      setPagination({ total: 0, page: 1, last_page: 1 });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${BASE_URL}/tables`);
      url.searchParams.append("page", pageNum.toString());
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("businessId", activeBusinessId);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setTables([]);
          setPagination({ total: 0, page: 1, last_page: 1 });
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch tables: ${response.statusText}`);
      }

      const res: TablesResponse = await response.json();
      setTables(res.data ?? []);
      setPagination({
        total: res.pagination?.total ?? 0,
        page: res.pagination?.page ?? 1,
        last_page: res.pagination?.totalPages ?? 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId, reduxToken, limit]);

  useEffect(() => {
    fetchTables(page);
  }, [page, fetchTables]);

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum > 0 && pageNum <= pagination.last_page) {
      fetchTables(pageNum);
    }
  }, [fetchTables, pagination.last_page]);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.last_page) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.page, pagination.last_page, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.page, goToPage]);

  const getTableById = useCallback(async (id: string) => {
    const token = getAuthToken(reduxToken);
    if (!token) throw new Error("No token");

    const url = new URL(`${BASE_URL}/tables/${id}`);
    if (activeBusinessId) {
      url.searchParams.append("businessId", activeBusinessId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { accept: "*/*", Authorization: `Bearer ${token}` },
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
    const res = await response.json();
    // Backend wraps response in { success, data, meta } envelope
    return (res.data ?? res) as TableRecord;
  }, [activeBusinessId, reduxToken]);

  const createTable = useCallback(
    async (payload: { tableNumber: string; capacity: number; status: TableStatus; image?: File | null }) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No token");

      setActionLoading(true);
      try {
        const useJson = !payload.image;
        let body: any;
        let contentType: string | undefined;

        if (useJson) {
          contentType = "application/json";
          body = JSON.stringify({
            tableNumber: payload.tableNumber,
            capacity: Number(payload.capacity),
            status: payload.status,
            businessId: activeBusinessId,
          });
        } else {
          const formData = new FormData();
          formData.append("tableNumber", payload.tableNumber);
          formData.append("capacity", String(payload.capacity));
          formData.append("status", payload.status);
          if (payload.image) formData.append("image", payload.image);
          if (activeBusinessId) formData.append("businessId", activeBusinessId);
          body = formData;
        }

        const url = new URL(`${BASE_URL}/tables/tables`);
        if (activeBusinessId) {
          url.searchParams.append("businessId", activeBusinessId);
        }

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
            ...(contentType ? { "Content-Type": contentType } : {}),
          },
          body,
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
        await fetchTables();
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTables, activeBusinessId, reduxToken],
  );

  const updateTable = useCallback(
    async (id: string, payload: { tableNumber: string; capacity: number; status: TableStatus; image?: File | null }) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No token");

      setActionLoading(true);
      try {
        const useJson = !payload.image;
        let body: any;
        let contentType: string | undefined;

        if (useJson) {
          contentType = "application/json";
          body = JSON.stringify({
            tableNumber: payload.tableNumber,
            capacity: Number(payload.capacity),
            status: payload.status,
            businessId: activeBusinessId,
          });
        } else {
          const formData = new FormData();
          formData.append("tableNumber", payload.tableNumber);
          formData.append("capacity", String(payload.capacity));
          formData.append("status", payload.status);
          if (payload.image) formData.append("image", payload.image);
          if (activeBusinessId) formData.append("businessId", activeBusinessId);
          body = formData;
        }

        const url = new URL(`${BASE_URL}/tables/${id}`);
        if (activeBusinessId) {
          url.searchParams.append("businessId", activeBusinessId);
        }

        const response = await fetch(url.toString(), {
          method: "PATCH",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
            ...(contentType ? { "Content-Type": contentType } : {}),
          },
          body,
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
        await fetchTables();
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTables, activeBusinessId, reduxToken],
  );

  const deleteTable = useCallback(
    async (id: string) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No token");

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/tables/${id}`);
        if (activeBusinessId) url.searchParams.append("businessId", activeBusinessId);

        const response = await fetch(url.toString(), {
          method: "DELETE",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
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
        await fetchTables();
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTables, activeBusinessId, reduxToken],
  );

  return { tables, loading, actionLoading, error, pagination, fetchTables, goToPage, nextPage, prevPage, getTableById, createTable, updateTable, deleteTable };
}
