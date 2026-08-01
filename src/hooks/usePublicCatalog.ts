"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

export interface PublicStorefront {
  businessId: string;
  displayName: string;
  description?: string | null;
  logo?: string | null;
  updatedAt?: string | null;
}

export interface PublicCatalogCategory {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sortOrder: number;
}

export interface PublicCatalogVariant {
  id: string;
  name: string;
  price?: number | null;
  available: boolean;
  sortOrder: number;
}

export interface PublicCatalogProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  sortOrder: number;
  available: boolean;
  category?: PublicCatalogCategory | null;
  variants: PublicCatalogVariant[];
}

interface PaginatedResponse<T> {
  data?: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UsePublicCatalogOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  available?: boolean;
  enabled?: boolean;
}

function parseApiError(payload: unknown, fallback: string) {
  if (typeof payload === "string") {
    try {
      return parseApiError(JSON.parse(payload), fallback);
    } catch {
      return payload || fallback;
    }
  }
  if (!payload || typeof payload !== "object") return fallback;
  const parsed = payload as { message?: unknown; error?: unknown };
  let detail: unknown = parsed.message || parsed.error || fallback;
  if (typeof detail === "object" && detail !== null && "message" in detail) {
    detail = (detail as { message?: unknown }).message;
  }
  if (Array.isArray(detail)) detail = detail.join(", ");
  return typeof detail === "string" ? detail : fallback;
}

function unwrapList<T>(json: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(json)) return json;
  return Array.isArray(json.data) ? json.data : [];
}

async function proxyGet(path: string, signal?: AbortSignal) {
  const response = await fetch(path, {
    method: "GET",
    headers: { accept: "*/*" },
    cache: "no-store",
    signal,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseApiError(json, "Failed to load public catalog"));
  }
  return json;
}

export function usePublicCatalog(options: UsePublicCatalogOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search = "",
    categoryId,
    available,
    enabled = true,
  } = options;
  const businessId = useActiveBusinessId();

  const [storefront, setStorefront] = useState<PublicStorefront | null>(null);
  const [categories, setCategories] = useState<PublicCatalogCategory[]>([]);
  const [products, setProducts] = useState<PublicCatalogProduct[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, last_page: 1 });
  const hasLoadedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const metaLoadedForBusiness = useRef<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    if (!businessId) {
      setError("Business ID is required to preview the public catalog");
      setStorefront(null);
      setCategories([]);
      setProducts([]);
      setPagination({ total: 0, page: 1, last_page: 1 });
      hasLoadedRef.current = false;
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) setInitialLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const needsMeta = metaLoadedForBusiness.current !== businessId;

      if (needsMeta) {
        const [storefrontJson, categoriesJson] = await Promise.all([
          proxyGet(`/api/public-catalog/${businessId}`, controller.signal),
          proxyGet(
            `/api/public-catalog/${businessId}/categories?page=1&limit=100`,
            controller.signal,
          ),
        ]);

        if (controller.signal.aborted) return;

        setStorefront((storefrontJson.data ?? storefrontJson) as PublicStorefront);
        setCategories(unwrapList(categoriesJson as PaginatedResponse<PublicCatalogCategory>));
        metaLoadedForBusiness.current = businessId;
      }

      const productsUrl = new URL(
        `/api/public-catalog/${businessId}/products`,
        window.location.origin,
      );
      productsUrl.searchParams.set("page", String(page));
      productsUrl.searchParams.set("limit", String(limit));
      if (search.trim()) productsUrl.searchParams.set("search", search.trim());
      if (categoryId) productsUrl.searchParams.set("categoryId", categoryId);
      if (available !== undefined) productsUrl.searchParams.set("available", String(available));

      const productsJson = (await proxyGet(
        `${productsUrl.pathname}${productsUrl.search}`,
        controller.signal,
      )) as PaginatedResponse<PublicCatalogProduct>;

      if (controller.signal.aborted) return;

      setProducts(unwrapList(productsJson));
      setPagination({
        total: productsJson.pagination?.total ?? 0,
        page: productsJson.pagination?.page ?? page,
        last_page: productsJson.pagination?.totalPages ?? 1,
      });
      hasLoadedRef.current = true;
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load public catalog");
      if (!hasLoadedRef.current) {
        setStorefront(null);
        setCategories([]);
        setProducts([]);
        setPagination({ total: 0, page: 1, last_page: 1 });
      }
    } finally {
      if (!controller.signal.aborted) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [available, businessId, categoryId, limit, page, search]);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      return;
    }
    fetchCatalog();
    return () => abortRef.current?.abort();
  }, [enabled, fetchCatalog]);

  useEffect(() => {
    metaLoadedForBusiness.current = null;
    hasLoadedRef.current = false;
  }, [businessId]);

  return {
    businessId,
    storefront,
    categories,
    products,
    loading: initialLoading,
    refreshing,
    error,
    pagination,
    fetchCatalog,
  };
}
