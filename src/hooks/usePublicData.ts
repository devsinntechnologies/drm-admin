"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";
import { getStoredAuthToken } from "@/lib/utils";
import { applySubsetOrder } from "@/lib/reorder";

export type PublicSourceType = "operational" | "manual";
export type PublicSyncStatus = "pending" | "synced" | "failed" | "detached";

export interface PublicCatalogSettings {
  businessId: string;
  enabled: boolean;
  syncOperationalCatalog: boolean;
  displayName?: string | null;
  description?: string | null;
  logo?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  allowedOrigins: string[];
  lastSyncedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedPublicRecord {
  id: string;
  businessId: string;
  sourceType: PublicSourceType;
  sourceId?: string | null;
  sourceVersion?: string;
  syncStatus: PublicSyncStatus;
  syncSuppressed: boolean;
  overriddenFields: string[];
  isPublished: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicCategoryRecord extends ManagedPublicRecord {
  name: string;
  description?: string | null;
  image?: string | null;
  sortOrder: number;
}

export interface PublicVariantRecord extends ManagedPublicRecord {
  publicProductId?: string;
  name: string;
  price?: number | null;
  sortOrder: number;
  available: boolean;
}

export interface PublicProductRecord extends ManagedPublicRecord {
  publicCategoryId: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  sortOrder: number;
  available: boolean;
  category?: Pick<PublicCategoryRecord, "id" | "name" | "description" | "image" | "sortOrder"> | null;
  variants?: PublicVariantRecord[];
}

export interface CatalogSyncQueueResponse {
  eventId: string;
  status: string;
}

export interface CatalogSyncStatusResponse {
  counts: Record<string, number>;
  failures: Record<string, unknown>[];
}

export interface UpdatePublicCatalogSettingsPayload {
  enabled?: boolean;
  syncOperationalCatalog?: boolean;
  displayName?: string;
  description?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  allowedOrigins?: string[];
  logoFile?: File | null;
}

export interface PublicCategoryPayload {
  name: string;
  description?: string;
  sortOrder?: number;
  isPublished?: boolean;
  image?: File | null;
  convertToManual?: boolean;
}

export interface PublicProductPayload {
  publicCategoryId: string;
  name: string;
  description?: string;
  price: number;
  sortOrder?: number;
  available?: boolean;
  isPublished?: boolean;
  image?: File | null;
  convertToManual?: boolean;
}

export interface PublicVariantPayload {
  name: string;
  price?: number;
  sortOrder?: number;
  available?: boolean;
  isPublished?: boolean;
  convertToManual?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UsePublicDataListOptions {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}

function getAuthToken(reduxToken: string | null) {
  if (reduxToken) return reduxToken;
  return getStoredAuthToken();
}

function parseApiError(text: string, fallback: string) {
  try {
    const parsed = JSON.parse(text);
    let detail = parsed.message || parsed.error || text;
    if (typeof detail === "object" && detail?.message) detail = detail.message;
    if (Array.isArray(detail)) detail = detail.join(", ");
    return typeof detail === "string" ? detail : fallback;
  } catch {
    return text || fallback;
  }
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseApiError(text, fallback));
  }
  return response.json();
}

function appendBusinessId(url: URL, businessId: string | null) {
  if (businessId) {
    url.searchParams.set("businessId", businessId);
  }
}

export function usePublicDataSettings() {
  const { token: reduxToken } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const [settings, setSettings] = useState<PublicCatalogSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    const token = getAuthToken(reduxToken);
    if (!token) {
      setError("No authentication token available");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${BASE_URL}/public-data/settings`);
      appendBusinessId(url, activeBusinessId);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { accept: "*/*", Authorization: `Bearer ${token}` },
      });
      const json = await readJson<{ data?: PublicCatalogSettings } | PublicCatalogSettings>(
        response,
        "Failed to load public catalog settings",
      );
      setSettings(("data" in json && json.data ? json.data : json) as PublicCatalogSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId, reduxToken]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (payload: UpdatePublicCatalogSettingsPayload) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/public-data/settings`);
        appendBusinessId(url, activeBusinessId);
        const { logoFile, ...fields } = payload;
        if (logoFile) {
          const logoUrl = new URL(`${BASE_URL}/public-data/settings/logo`);
          appendBusinessId(logoUrl, activeBusinessId);
          const form = new FormData();
          form.append("logoFile", logoFile);
          const logoResponse = await fetch(logoUrl.toString(), {
            method: "POST",
            headers: { accept: "*/*", Authorization: `Bearer ${token}` },
            body: form,
          });
          await readJson(logoResponse, "Failed to upload logo");
        }
        const response = await fetch(url.toString(), {
          method: "PATCH",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(fields),
        });
        const json = await readJson<{ data?: PublicCatalogSettings } | PublicCatalogSettings>(
          response,
          "Failed to update settings",
        );
        const next = ("data" in json && json.data ? json.data : json) as PublicCatalogSettings;
        setSettings(next);
        return next;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, reduxToken],
  );

  const queueSync = useCallback(async () => {
    const token = getAuthToken(reduxToken);
    if (!token) throw new Error("No authentication token available");

    setActionLoading(true);
    try {
      const url = new URL(`${BASE_URL}/public-data/sync`);
      appendBusinessId(url, activeBusinessId);
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { accept: "*/*", Authorization: `Bearer ${token}` },
      });
      const json = await readJson<{ data?: CatalogSyncQueueResponse } | CatalogSyncQueueResponse>(
        response,
        "Failed to queue catalog sync",
      );
      return ("data" in json && json.data ? json.data : json) as CatalogSyncQueueResponse;
    } finally {
      setActionLoading(false);
    }
  }, [activeBusinessId, reduxToken]);

  const fetchSyncStatus = useCallback(async () => {
    const token = getAuthToken(reduxToken);
    if (!token) throw new Error("No authentication token available");

    const url = new URL(`${BASE_URL}/public-data/sync/status`);
    appendBusinessId(url, activeBusinessId);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { accept: "*/*", Authorization: `Bearer ${token}` },
    });
    const json = await readJson<{ data?: CatalogSyncStatusResponse } | CatalogSyncStatusResponse>(
      response,
      "Failed to load sync status",
    );
    return ("data" in json && json.data ? json.data : json) as CatalogSyncStatusResponse;
  }, [activeBusinessId, reduxToken]);

  return {
    settings,
    loading,
    actionLoading,
    error,
    fetchSettings,
    updateSettings,
    queueSync,
    fetchSyncStatus,
  };
}

export function usePublicCategories(options: UsePublicDataListOptions = {}) {
  const { page = 1, limit = 20, search = "", enabled = true } = options;
  const { token: reduxToken } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const [categories, setCategories] = useState<PublicCategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, last_page: 1 });

  const fetchCategories = useCallback(
    async (pageNum: number = page, searchQuery: string = search) => {
      const token = getAuthToken(reduxToken);
      if (!token) {
        setError("No authentication token available");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${BASE_URL}/public-data/categories`);
        url.searchParams.set("page", String(pageNum));
        url.searchParams.set("limit", String(limit));
        if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());
        appendBusinessId(url, activeBusinessId);

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) {
          setCategories([]);
          setPagination({ total: 0, page: 1, last_page: 1 });
          return;
        }

        const json = await readJson<PaginatedResponse<PublicCategoryRecord>>(
          response,
          "Failed to fetch public categories",
        );
        setCategories(json.data ?? []);
        setPagination({
          total: json.pagination?.total ?? 0,
          page: json.pagination?.page ?? pageNum,
          last_page: json.pagination?.totalPages ?? 1,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch public categories");
      } finally {
        setLoading(false);
      }
    },
    [activeBusinessId, limit, page, reduxToken, search],
  );

  useEffect(() => {
    if (enabled) fetchCategories(page, search);
  }, [enabled, fetchCategories, page, search]);

  const getCategoryById = useCallback(
    async (id: string) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      const url = new URL(`${BASE_URL}/public-data/categories/${id}`);
      appendBusinessId(url, activeBusinessId);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { accept: "*/*", Authorization: `Bearer ${token}` },
      });
      const json = await readJson<{ data?: PublicCategoryRecord } | PublicCategoryRecord>(
        response,
        "Failed to load category",
      );
      return ("data" in json && json.data ? json.data : json) as PublicCategoryRecord;
    },
    [activeBusinessId, reduxToken],
  );

  const createCategory = useCallback(
    async (payload: PublicCategoryPayload) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const formData = new FormData();
        formData.append("name", payload.name);
        if (payload.description !== undefined) formData.append("description", payload.description);
        if (payload.sortOrder !== undefined) formData.append("sortOrder", String(payload.sortOrder));
        if (payload.isPublished !== undefined) formData.append("isPublished", String(payload.isPublished));
        if (payload.image) formData.append("image", payload.image);

        const url = new URL(`${BASE_URL}/public-data/categories`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "POST",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
          body: formData,
        });
        await readJson(response, "Failed to create category");
        await fetchCategories(pagination.page, search);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchCategories, pagination.page, reduxToken, search],
  );

  const updateCategory = useCallback(
    async (id: string, payload: Partial<PublicCategoryPayload>) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const formData = new FormData();
        if (payload.name !== undefined) formData.append("name", payload.name);
        if (payload.description !== undefined) formData.append("description", payload.description);
        if (payload.sortOrder !== undefined) formData.append("sortOrder", String(payload.sortOrder));
        if (payload.isPublished !== undefined) formData.append("isPublished", String(payload.isPublished));
        if (payload.convertToManual !== undefined) {
          formData.append("convertToManual", String(payload.convertToManual));
        }
        if (payload.image) formData.append("image", payload.image);

        const url = new URL(`${BASE_URL}/public-data/categories/${id}`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "PATCH",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
          body: formData,
        });
        await readJson(response, "Failed to update category");
        await fetchCategories(pagination.page, search);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchCategories, pagination.page, reduxToken, search],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/public-data/categories/${id}`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "DELETE",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
        });
        await readJson(response, "Failed to delete category");
        await fetchCategories(pagination.page, search);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchCategories, pagination.page, reduxToken, search],
  );

  return {
    categories,
    loading,
    actionLoading,
    error,
    pagination,
    fetchCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export function usePublicProducts(options: UsePublicDataListOptions = {}) {
  const { page = 1, limit = 20, search = "", enabled = true } = options;
  const { token: reduxToken } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const [products, setProducts] = useState<PublicProductRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, last_page: 1 });

  const fetchProducts = useCallback(
    async (pageNum: number = page, searchQuery: string = search) => {
      const token = getAuthToken(reduxToken);
      if (!token) {
        setError("No authentication token available");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${BASE_URL}/public-data/products`);
        url.searchParams.set("page", String(pageNum));
        url.searchParams.set("limit", String(limit));
        if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());
        appendBusinessId(url, activeBusinessId);

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) {
          setProducts([]);
          setPagination({ total: 0, page: 1, last_page: 1 });
          return;
        }

        const json = await readJson<PaginatedResponse<PublicProductRecord>>(
          response,
          "Failed to fetch public products",
        );
        setProducts(json.data ?? []);
        setPagination({
          total: json.pagination?.total ?? 0,
          page: json.pagination?.page ?? pageNum,
          last_page: json.pagination?.totalPages ?? 1,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch public products");
      } finally {
        setLoading(false);
      }
    },
    [activeBusinessId, limit, page, reduxToken, search],
  );

  useEffect(() => {
    if (enabled) fetchProducts(page, search);
  }, [enabled, fetchProducts, page, search]);

  const getProductById = useCallback(
    async (id: string) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      const url = new URL(`${BASE_URL}/public-data/products/${id}`);
      appendBusinessId(url, activeBusinessId);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { accept: "*/*", Authorization: `Bearer ${token}` },
      });
      const json = await readJson<{ data?: PublicProductRecord } | PublicProductRecord>(
        response,
        "Failed to load product",
      );
      return ("data" in json && json.data ? json.data : json) as PublicProductRecord;
    },
    [activeBusinessId, reduxToken],
  );

  const createProduct = useCallback(
    async (payload: PublicProductPayload) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const formData = new FormData();
        formData.append("publicCategoryId", payload.publicCategoryId);
        formData.append("name", payload.name);
        formData.append("price", String(payload.price));
        if (payload.description !== undefined) formData.append("description", payload.description);
        if (payload.sortOrder !== undefined) formData.append("sortOrder", String(payload.sortOrder));
        if (payload.available !== undefined) formData.append("available", String(payload.available));
        if (payload.isPublished !== undefined) formData.append("isPublished", String(payload.isPublished));
        if (payload.image) formData.append("image", payload.image);

        const url = new URL(`${BASE_URL}/public-data/products`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "POST",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
          body: formData,
        });
        await readJson(response, "Failed to create product");
        await fetchProducts(pagination.page, search);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchProducts, pagination.page, reduxToken, search],
  );

  const updateProduct = useCallback(
    async (id: string, payload: Partial<PublicProductPayload>) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const formData = new FormData();
        if (payload.publicCategoryId !== undefined) {
          formData.append("publicCategoryId", payload.publicCategoryId);
        }
        if (payload.name !== undefined) formData.append("name", payload.name);
        if (payload.description !== undefined) formData.append("description", payload.description);
        if (payload.price !== undefined) formData.append("price", String(payload.price));
        if (payload.sortOrder !== undefined) formData.append("sortOrder", String(payload.sortOrder));
        if (payload.available !== undefined) formData.append("available", String(payload.available));
        if (payload.isPublished !== undefined) formData.append("isPublished", String(payload.isPublished));
        if (payload.convertToManual !== undefined) {
          formData.append("convertToManual", String(payload.convertToManual));
        }
        if (payload.image) formData.append("image", payload.image);

        const url = new URL(`${BASE_URL}/public-data/products/${id}`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "PATCH",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
          body: formData,
        });
        await readJson(response, "Failed to update product");
        await fetchProducts(pagination.page, search);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchProducts, pagination.page, reduxToken, search],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/public-data/products/${id}`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "DELETE",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
        });
        await readJson(response, "Failed to delete product");
        await fetchProducts(pagination.page, search);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchProducts, pagination.page, reduxToken, search],
  );

  const reorderProducts = useCallback(
    async (ids: string[]) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      const previous = products;
      setProducts((prev) => {
        const order = applySubsetOrder(
          prev.map((product) => product.id),
          ids,
        );
        const byId = new Map(prev.map((product) => [product.id, product]));
        return order.flatMap((id) => {
          const product = byId.get(id);
          return product ? [product] : [];
        });
      });

      try {
        const url = new URL(`${BASE_URL}/public-data/products/reorder`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "PATCH",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids }),
        });
        await readJson(response, "Failed to reorder products");
      } catch (err) {
        setProducts(previous);
        throw err;
      }
    },
    [activeBusinessId, products, reduxToken],
  );

  const listVariants = useCallback(
    async (productId: string) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      const url = new URL(`${BASE_URL}/public-data/products/${productId}/variants`);
      appendBusinessId(url, activeBusinessId);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { accept: "*/*", Authorization: `Bearer ${token}` },
      });
      const json = await readJson<{ data?: PublicVariantRecord[] } | PublicVariantRecord[]>(
        response,
        "Failed to load variants",
      );
      return (Array.isArray(json) ? json : json.data ?? []) as PublicVariantRecord[];
    },
    [activeBusinessId, reduxToken],
  );

  const createVariant = useCallback(
    async (productId: string, payload: PublicVariantPayload) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/public-data/products/${productId}/variants`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        await readJson(response, "Failed to create variant");
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, reduxToken],
  );

  const updateVariant = useCallback(
    async (productId: string, id: string, payload: Partial<PublicVariantPayload>) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/public-data/products/${productId}/variants/${id}`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "PATCH",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        await readJson(response, "Failed to update variant");
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, reduxToken],
  );

  const deleteVariant = useCallback(
    async (productId: string, id: string) => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/public-data/products/${productId}/variants/${id}`);
        appendBusinessId(url, activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "DELETE",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
        });
        await readJson(response, "Failed to delete variant");
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, reduxToken],
  );

  return {
    products,
    loading,
    actionLoading,
    error,
    pagination,
    fetchProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    reorderProducts,
    listVariants,
    createVariant,
    updateVariant,
    deleteVariant,
  };
}
