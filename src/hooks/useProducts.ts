import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

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
  image: string;
  categoryId?: string;
  category?: ProductCategory | null;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  last_page: number;
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

  return localStorage.getItem("auth_token");
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

export interface UpdateProductPayload extends CreateProductPayload {}

export function useProducts(options: UseProductsOptions = {}) {
  const { page = 1, limit = 30 } = options;
  const { token } = useAuth();
  
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
      const url = new URL("https://vendor.umazing.shop/products");
      url.searchParams.append("page", pageNum.toString());
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
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data: ProductsResponse = await response.json();
      
      setProducts(data.data);
      setPagination({
        total: data.total,
        page: data.page,
        last_page: data.last_page,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching products";
      setError(errorMessage);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [token, limit]);

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

      const response = await fetch("https://vendor.umazing.shop/products", {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.statusText}`);
      }

      await fetchProducts(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts, pagination.page, token]);

  const getProductById = useCallback(async (id: string) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(`https://vendor.umazing.shop/products/${id}`, {
      method: "GET",
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    return (await response.json()) as Product;
  }, [token]);

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

      const response = await fetch(`https://vendor.umazing.shop/products/${id}`, {
        method: "PATCH",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`);
      }

      await fetchProducts(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts, pagination.page, token]);

  const deleteProduct = useCallback(async (id: string) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const response = await fetch(`https://vendor.umazing.shop/products/${id}`, {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.statusText}`);
      }

      await fetchProducts(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts, pagination.page, token]);

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
