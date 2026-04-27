import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inStock: number;
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
  variants: ProductVariant[];
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

interface UseProductsOptions {
  page?: number;
  limit?: number;
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

export interface CreateProductVariantPayload {
  name: string;
  price: number;
  inStock: number;
}

export interface CreateProductPayload {
  name: string;
  price: number;
  sortOrder: number;
  inStock: number;
  status: "ACTIVE" | "INACTIVE";
  categoryId: string;
  isKitchen: boolean;
  variants: CreateProductVariantPayload[];
  image?: File | null;
}

export interface UpdateProductPayload extends CreateProductPayload { }

export function useProducts(options: UseProductsOptions = {}) {
  const { page = 1, limit = 30 } = options;
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
    const authToken = getAuthToken(token);

    if (!authToken) {
      setError("No authentication token available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${BASE_URL}/products`);
      url.searchParams.append("page", pageNum.toString());
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
        if (response.status === 404) {
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

      const data: ProductsResponse = await response.json();

      setProducts(data.data ?? []);
      setPagination({
        total: data.pagination?.total ?? 0,
        page: data.pagination?.page ?? 1,
        last_page: data.pagination?.totalPages ?? 1,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching products";
      setError(errorMessage);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [token, limit, activeBusinessId]);

  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum > 0 && pageNum <= pagination.last_page) {
      fetchProducts(pageNum);
    }
  }, [fetchProducts, pagination.last_page]);

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
      if (payload.image) {
        formData.append("image", payload.image);
      }

      const url = new URL(`${BASE_URL}/products`);
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

    const url = new URL(`${BASE_URL}/products/${id}`);
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
      formData.append("inStock", String(payload.inStock));
      formData.append("status", payload.status);
      formData.append("categoryId", payload.categoryId);
      formData.append("isKitchen", String(payload.isKitchen));
      if (payload.image) {
        formData.append("image", payload.image);
      }

      const url = new URL(`${BASE_URL}/products/${id}`);
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
      const url = new URL(`${BASE_URL}/products/${id}`);
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
    refetch: fetchProducts,
  };
}
