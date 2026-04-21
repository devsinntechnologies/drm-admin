import { useCallback, useEffect, useState } from "react";
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
  total: number;
  page: number;
  last_page: number;
}

interface UseCategoriesOptions {
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

export function useCategories(options: UseCategoriesOptions = {}) {
  const { page = 1, limit = 10 } = options;
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
    const token = getAuthToken();
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
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const data: CategoriesResponse = await response.json();
      setCategories(data.data ?? []);
      setPagination({
        total: data.total ?? 0,
        page: data.page ?? pageNum,
        last_page: data.last_page ?? 1,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred while fetching categories";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit, activeBusinessId]);

  useEffect(() => {
    fetchCategories(page);
  }, [page, fetchCategories]);

  const getCategoryById = useCallback(async (id: string) => {
    const token = getAuthToken();
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
      throw new Error(`Failed to fetch category: ${response.statusText}`);
    }

    return (await response.json()) as CategoryRecord;
  }, [activeBusinessId]);

  const createCategory = useCallback(async (payload: { categoryName: string; sortOrder: number; image?: File | null }) => {
    const token = getAuthToken();
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
        throw new Error(`Failed to create category: ${response.statusText}`);
      }

      await fetchCategories(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchCategories, pagination.page, activeBusinessId]);

  const updateCategory = useCallback(async (id: string, payload: { categoryName: string; sortOrder: number; image?: File | null }) => {
    const token = getAuthToken();
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
        method: "PATCH",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.statusText}`);
      }

      await fetchCategories(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchCategories, pagination.page, activeBusinessId]);

  const deleteCategory = useCallback(async (id: string) => {
    const token = getAuthToken();
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
        throw new Error(`Failed to delete category: ${response.statusText}`);
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
