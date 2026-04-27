import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";

export type InvoiceStatus = "pending" | "paid" | "overdue" | string;

export interface InvoiceItem {
  productname: string;
  image?: string;
  quantity: number;
  price: string;
}

export interface InvoiceRecord {
  uuid: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  orderNumber: string;
  businessName: string;
  orderId: string;
  totalPrice: string;
  deliveryCharges: string | null;
  packagingPrice: string | null;
  Items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoicesResponse {
  data: InvoiceRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseInvoicesOptions {
  page?: number;
  limit?: number;
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const { page = 1, limit = 20 } = options;
  const { token } = useAuth();
  const activeBusinessId = useActiveBusinessId();

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    last_page: 1,
  });

  const fetchInvoices = useCallback(async (pageNum: number = 1) => {
    let authToken = token;
    if (!authToken && typeof window !== "undefined") {
      authToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
    }

    if (!authToken) {
      setError("No authentication token available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`https://${BASE_URL}/invoice`);
      url.searchParams.append("page", String(pageNum));
      if (limit) {
        url.searchParams.append("limit", String(limit));
      }
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setInvoices([]);
          setPagination({ total: 0, page: 1, last_page: 1 });
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch invoices: ${response.statusText}`);
      }

      const payload: InvoicesResponse = await response.json();
      setInvoices(payload.data ?? []);
      setPagination({
        total: payload.pagination?.total ?? 0,
        page: payload.pagination?.page ?? pageNum,
        last_page: payload.pagination?.totalPages ?? 1,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred while fetching invoices";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, limit, activeBusinessId]);

  useEffect(() => {
    fetchInvoices(page);
  }, [page, fetchInvoices]);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.last_page) {
      fetchInvoices(pagination.page + 1);
    }
  }, [fetchInvoices, pagination.last_page, pagination.page]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchInvoices(pagination.page - 1);
    }
  }, [fetchInvoices, pagination.page]);

  const updateInvoiceStatus = useCallback(async (invoiceUuid: string, status: InvoiceStatus) => {
    let authToken = token;
    if (!authToken && typeof window !== "undefined") {
      authToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
    }

    if (!authToken) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const url = new URL(`https://${BASE_URL}/invoice/${invoiceUuid}`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to update invoice: ${response.statusText}`);
      }

      await fetchInvoices(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchInvoices, pagination.page, token, activeBusinessId]);

  return {
    invoices,
    loading,
    actionLoading,
    error,
    pagination,
    nextPage,
    prevPage,
    updateInvoiceStatus,
    refetch: fetchInvoices,
  };
}
