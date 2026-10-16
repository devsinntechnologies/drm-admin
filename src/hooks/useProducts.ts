import { useCallback, useEffect, useRef, useState } from "react";
import { STAFF_REALTIME_EVENTS } from "@/lib/staff-realtime";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { buildApiUrl } from "@/lib/api";
import { apiClient } from "@/lib/api-client";
import { applySubsetOrder } from "@/lib/reorder";

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inStock: number;
  costPrice?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  CategoryName: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
  inStock: number;
  status: "ACTIVE" | "INACTIVE";
  image: string | null;
  categoryId?: string;
  category?: ProductCategory | null;
  isKitchen: boolean;
  isStockEnabled?: boolean;
  costPrice?: number | null;
  stockCount?: number | null;
  barcode?: string | null;
  variants: ProductVariant[];
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function parseStockFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function unwrapProductList(payload: unknown): Product[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as { data?: unknown };
    if (Array.isArray(record.data)) return record.data as Product[];
    if (
      record.data &&
      typeof record.data === "object" &&
      Array.isArray((record.data as { data?: unknown }).data)
    ) {
      return (record.data as { data: Product[] }).data;
    }
  }
  return [];
}

function normalizeProduct(raw: Product): Product {
  const nested = raw as Product & {
    is_stock_enabled?: unknown;
    trackStock?: unknown;
    stock_count?: number | null;
    instock?: number;
  };
  return {
    ...raw,
    status: String(raw.status || "ACTIVE").toUpperCase() as Product["status"],
    inStock: Number(raw.inStock ?? nested.instock ?? 0),
    stockCount: raw.stockCount ?? nested.stock_count ?? null,
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    isStockEnabled: parseStockFlag(
      raw.isStockEnabled ?? nested.is_stock_enabled ?? nested.trackStock,
    ),
  };
}

interface UseProductsOptions {
  page?: number;
  limit?: number;
  loadAll?: boolean;
}

function getAuthToken(reduxToken: string | null) {
  if (reduxToken) {
    return reduxToken.trim();
  }

  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  return token ? token.trim() : null;
}

export interface CreateProductVariantPayload {
  id?: string;
  name?: string;
  price?: number;
  inStock?: number;
  costPrice?: number;
  action?: "add" | "update" | "delete";
}

export interface CreateProductPayload {
  name: string;
  price: number;
  sortOrder: number;
  inStock: number;
  status: "ACTIVE" | "INACTIVE";
  categoryId: string;
  isKitchen: boolean;
  isStockEnabled?: boolean;
  isSessionService?: boolean;
  costPrice?: number | null;
  variants: CreateProductVariantPayload[];
  image?: File | null;
  customFields?: Record<string, unknown>;
}

export interface UpdateProductPayload extends Omit<CreateProductPayload, "variants" | "inStock"> {
  inStock?: number;
  variants?: CreateProductVariantPayload[];
}

export function useProducts(options: UseProductsOptions = {}) {
  const { page = 1, limit = 30, loadAll = false } = options;
  const requestVersion = useRef(0);
  const { token } = useAuth();
  const activeBusinessId = useActiveBusinessId();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    last_page: 1,
  });

  const fetchProducts = useCallback(async (pageNum: number = 1) => {
    const request = ++requestVersion.current;
    const authToken = getAuthToken(token);

    if (!authToken) {
      setError("No authentication token available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL(buildApiUrl("/products"));
      url.searchParams.append("page", (loadAll ? 1 : pageNum).toString());
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }
      if (limit) {
        url.searchParams.append("limit", limit.toString());
      }


      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        // Special case: Backend returns 404 if no products exist for a business
        if (response.status === 404 && request === requestVersion.current) {
          setProducts([]);
          setPagination({ total: 0, page: 1, last_page: 1 });
          setLoading(false);
          return;
        }

        // Try to extract backend error message
        let detail = response.statusText;
        try {
          const errJson = await response.json();
          detail = errJson?.message || errJson?.error || (typeof errJson === 'object' ? JSON.stringify(errJson) : String(errJson));
        } catch {
          // ignore parse errors
        }
        throw new Error(`Failed to fetch products: HTTP ${response.status} - ${detail}`);
      }

      const payload = await response.json();
      const rows = unwrapProductList(payload).map(normalizeProduct);
      const getPagination = (value: any) => value?.pagination ?? value?.data?.pagination;
      const firstPagination = getPagination(payload);
      if (loadAll && firstPagination) {
        const totalPages = Number(firstPagination.totalPages ?? Math.ceil(firstPagination.total / firstPagination.limit));
        for (let next = 2; next <= totalPages; next++) {
          if (request !== requestVersion.current) return;
          url.searchParams.set("page", String(next));
          const nextResponse = await fetch(url.toString(), {
            headers: { accept: "application/json", Authorization: `Bearer ${authToken}` },
          });
          if (!nextResponse.ok) throw new Error(`Failed to load product page ${next}`);
          rows.push(...unwrapProductList(await nextResponse.json()).map(normalizeProduct));
        }
      }
      if (request !== requestVersion.current) return;
      const uniqueRows = [...new Map(rows.map((row) => [row.id, row])).values()];
      if (loadAll && firstPagination?.total != null && uniqueRows.length !== Number(firstPagination.total)) {
        throw new Error("The product catalog changed while loading. Refresh to load the complete list.");
      }

      setProducts(uniqueRows);
      const pagination =
        payload && typeof payload === "object"
          ? getPagination(payload)
          : undefined;
      setPagination({
        total: pagination?.total ?? uniqueRows.length,
        page: pagination?.page ?? 1,
        last_page: pagination?.totalPages ?? 1,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching products";
      if (request === requestVersion.current) setError(errorMessage);
      console.error("[useProducts] Fetch error:", {
        message: errorMessage,
        error: err,
        url: buildApiUrl("/products"),
        activeBusinessId
      });
    } finally {
      if (request === requestVersion.current) setLoading(false);
    }
  }, [token, limit, activeBusinessId, loadAll]);

  useEffect(() => {
    fetchProducts(page);
    return () => { ++requestVersion.current; };
  }, [page, fetchProducts]);

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum > 0 && pageNum <= pagination.last_page) {
      fetchProducts(pageNum);
    }
  }, [fetchProducts, pagination.last_page]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refreshStock = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void fetchProducts(pagination.page ?? page), 150);
    };
    window.addEventListener(STAFF_REALTIME_EVENTS.INVOICES_CHANGED, refreshStock);
    window.addEventListener("products:refetch", refreshStock);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(STAFF_REALTIME_EVENTS.INVOICES_CHANGED, refreshStock);
      window.removeEventListener("products:refetch", refreshStock);
    };
  }, [fetchProducts, pagination.page, page]);

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

  const createProduct = useCallback(async (payload: CreateProductPayload) => {
    const authToken = getAuthToken(token);

    if (!authToken) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("price", String(payload.price));
      formData.append("name", payload.name);
      formData.append("variants", JSON.stringify(payload.variants));
      formData.append("sortOrder", String(payload.sortOrder));
      formData.append("inStock", String(payload.inStock));
      formData.append("status", payload.status);
      formData.append("categoryId", payload.categoryId);
      formData.append("isKitchen", String(payload.isKitchen));
      if (payload.isStockEnabled !== undefined) {
        formData.append("isStockEnabled", String(payload.isStockEnabled));
      }
      if (payload.isSessionService !== undefined) {
        formData.append("isSessionService", String(payload.isSessionService));
      }
      if (payload.costPrice !== undefined && payload.costPrice !== null) {
        formData.append("costPrice", String(payload.costPrice));
      }
      if (payload.image) {
        formData.append("image", payload.image);
      }
      if (payload.customFields) {
        formData.append("customFields", JSON.stringify(payload.customFields));
      }

      const url = new URL(buildApiUrl("/products"));
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
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

      await fetchProducts(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts, pagination.page, token, activeBusinessId]);

  const getProductById = useCallback(async (id: string) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    const url = new URL(buildApiUrl(`/products/${id}`));
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
    return (res.data ?? res) as Product;
  }, [token, activeBusinessId]);

  const updateProduct = useCallback(async (id: string, payload: UpdateProductPayload) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("price", String(payload.price));
      formData.append("name", payload.name);
      formData.append("variants", JSON.stringify(payload.variants));
      formData.append("sortOrder", String(payload.sortOrder));
      if (payload.inStock !== undefined) formData.append("inStock", String(payload.inStock));
      formData.append("status", payload.status);
      formData.append("categoryId", payload.categoryId);
      formData.append("isKitchen", String(payload.isKitchen));
      if (payload.isStockEnabled !== undefined) {
        formData.append("isStockEnabled", String(payload.isStockEnabled));
      }
      if (payload.isSessionService !== undefined) {
        formData.append("isSessionService", String(payload.isSessionService));
      }
      if (payload.costPrice !== undefined && payload.costPrice !== null) {
        formData.append("costPrice", String(payload.costPrice));
      }
      if (payload.image) {
        formData.append("image", payload.image);
      }
      if (payload.customFields) {
        formData.append("customFields", JSON.stringify(payload.customFields));
      }

      const url = new URL(buildApiUrl(`/products/${id}`));
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
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

      await fetchProducts(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts, pagination.page, token, activeBusinessId]);

  const deleteProduct = useCallback(async (id: string) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const url = new URL(buildApiUrl(`/products/${id}`));
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

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

      await fetchProducts(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts, pagination.page, token, activeBusinessId]);

  const reorderProducts = useCallback(
    async (ids: string[]) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      const previous = products;
      setProducts((prev) => {
        const order = applySubsetOrder(
          prev.map((product) => product.id),
          ids,
        );
        const byId = new Map(prev.map((product) => [product.id, product]));
        return order.map((id, index) => ({
          ...byId.get(id)!,
          sortOrder: index,
        }));
      });

      try {
        await apiClient.patch("/products/reorder", { ids }, authToken, activeBusinessId);
      } catch (err) {
        setProducts(previous);
        throw err;
      }
    },
    [activeBusinessId, products, token],
  );

  return {
    products,
    loading,
    actionLoading,
    error,
    pagination,
    goToPage,
    nextPage,
    prevPage,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    reorderProducts,
    refetch: fetchProducts,
  };
}
