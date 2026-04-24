import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

export interface CategoryProduct {
  id: string;
  categoryId: string;
  name: string;
  isKitchen: boolean;
  price: number;
  sortOrder: number;
  inStock: number;
  status: "ACTIVE" | "INACTIVE";
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  id: string;
  CategoryName: string;
  sortOrder: number;
  businessId: string;
  businessName: string;
  products: CategoryProduct[];
  image?: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesResponse {
  data: CategoryRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseCategoriesOptions {
  page?: number;
  limit?: number;
}

const BASE_URL = "https://vendor.umazing.shop";

function getAuthToken(reduxToken: string | null) {
  if (reduxToken) return reduxToken;
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || localStorage.getItem("token");
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { page = 1, limit = 10 } = options;
  const { token: reduxToken } = useAuth();
  const activeBusinessId = useActiveBusinessId();

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    last_page: 1,
  });

  const fetchCategories = useCallback(async (pageNum: number = 1) => {
    const token = getAuthToken(reduxToken);
    if (!token) {
      setError("No authentication token available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${BASE_URL}/category`);
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
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setCategories([]);
          setPagination({ total: 0, page: 1, last_page: 1 });
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const data: CategoriesResponse = await response.json();
      setCategories(data.data ?? []);
      setPagination({
        total: data.pagination?.total ?? 0,
        page: data.pagination?.page ?? pageNum,
        last_page: data.pagination?.totalPages ?? 1,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred while fetching categories";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit, activeBusinessId, reduxToken]);

  useEffect(() => {
    fetchCategories(page);
  }, [page, fetchCategories]);

  const getCategoryById = useCallback(async (id: string) => {
    const token = getAuthToken(reduxToken);
    if (!token) {
      throw new Error("No authentication token available");
    }

    const url = new URL(`${BASE_URL}/category/${id}`);
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
    return (res.data ?? res) as CategoryRecord;
  }, [activeBusinessId]);

  const createCategory = useCallback(async (payload: { categoryName: string; sortOrder: number; image?: File | null }) => {
    const token = getAuthToken(reduxToken);
    if (!token) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("categoryName", payload.categoryName);
      formData.append("sortOrder", String(payload.sortOrder));
      if (payload.image) {
        formData.append("image", payload.image);
      }

      const url = new URL(`${BASE_URL}/category`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
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

      await fetchCategories(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchCategories, pagination.page, activeBusinessId]);

  const updateCategory = useCallback(async (id: string, payload: { categoryName: string; sortOrder: number; image?: File | null }) => {
    const token = getAuthToken(reduxToken);
    if (!token) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("categoryName", payload.categoryName);
      formData.append("sortOrder", String(payload.sortOrder));
      if (payload.image) {
        formData.append("image", payload.image);
      }

      const url = new URL(`${BASE_URL}/category/${id}`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
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

      await fetchCategories(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchCategories, pagination.page, activeBusinessId]);

  const deleteCategory = useCallback(async (id: string) => {
    const token = getAuthToken(reduxToken);
    if (!token) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const url = new URL(`${BASE_URL}/category/${id}`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
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

      await fetchCategories(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchCategories, pagination.page, activeBusinessId]);

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
