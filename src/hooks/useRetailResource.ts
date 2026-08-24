"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import { getStoredAuthToken } from "@/lib/utils";

interface Paginated<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

/** Generic list + create + update + remove hook for a simple retail CRUD endpoint. */
export function useRetailResource<T extends { id: string }>(basePath: string) {
  const { token: reduxToken } = useAuth();
  const businessId = useActiveBusinessId();
  const token = reduxToken || getStoredAuthToken();

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const refresh = useCallback(
    async (pageNum: number = page) => {
      if (!businessId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<Paginated<T> | T[]>(
          `${basePath}?page=${pageNum}&limit=20`,
          token,
          businessId,
        );
        if (Array.isArray(result)) {
          setItems(result);
          setTotalPages(1);
        } else {
          setItems(result.data ?? []);
          setTotalPages(result.pagination?.totalPages ?? 1);
        }
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [basePath, businessId, token, page],
  );

  useEffect(() => {
    if (businessId) refresh(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, basePath]);

  const create = useCallback(
    async (body: unknown) => {
      setActionLoading(true);
      try {
        const created = await apiClient.post<T>(basePath, body, token, businessId);
        await refresh(1);
        return created;
      } finally {
        setActionLoading(false);
      }
    },
    [basePath, token, businessId, refresh],
  );

  const update = useCallback(
    async (id: string, body: unknown) => {
      setActionLoading(true);
      try {
        const updated = await apiClient.put<T>(`${basePath}/${id}`, body, token, businessId);
        await refresh(page);
        return updated;
      } finally {
        setActionLoading(false);
      }
    },
    [basePath, token, businessId, refresh, page],
  );

  const patch = useCallback(
    async (id: string, body: unknown) => {
      setActionLoading(true);
      try {
        const updated = await apiClient.patch<T>(`${basePath}/${id}`, body, token, businessId);
        await refresh(page);
        return updated;
      } finally {
        setActionLoading(false);
      }
    },
    [basePath, token, businessId, refresh, page],
  );

  const remove = useCallback(
    async (id: string) => {
      setActionLoading(true);
      try {
        await apiClient.delete(`${basePath}/${id}`, token, businessId);
        await refresh(page);
      } finally {
        setActionLoading(false);
      }
    },
    [basePath, token, businessId, refresh, page],
  );

  return {
    items,
    loading,
    actionLoading,
    error,
    page,
    totalPages,
    businessId,
    token,
    refresh,
    create,
    update,
    patch,
    remove,
  };
}
