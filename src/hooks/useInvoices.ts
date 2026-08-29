import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";

export type InvoiceStatus = "pending" | "paid" | "overdue" | string;

export interface InvoiceItem {
  productname: string;
  variantName?: string;
  image?: string;
  quantity: number;
  price: string | number;
  total?: number;
}

export interface InvoiceRecord {
  uuid: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  orderNumber: string;
  businessName: string;
  businessLogo?: string | null;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  orderId: string;
  totalPrice: string | number;
  subtotal?: number;
  deliveryCharges: string | number | null;
  packagingPrice: string | number | null;
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
  range?: "day" | "week" | "month";
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const { page = 1, limit = 20, range = "day" } = options;
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
      const url = new URL(`${BASE_URL}/invoice`);
      url.searchParams.append("page", String(pageNum));
      if (limit) {
        url.searchParams.append("limit", String(limit));
      }
      if (range) {
        url.searchParams.append("range", range);
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
  }, [token, limit, range, activeBusinessId]);

  useEffect(() => {
    fetchInvoices(page);
  }, [page, fetchInvoices]);

  // Listen for external signals to refetch invoices (e.g. after invoice creation)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      fetchInvoices(pagination.page ?? page);
    };

    window.addEventListener("invoices:refetch", handler as EventListener);
    return () => {
      window.removeEventListener("invoices:refetch", handler as EventListener);
    };
  }, [fetchInvoices, pagination.page, page]);

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
      const url = new URL(`${BASE_URL}/invoice/${invoiceUuid}`);
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

  const deleteInvoice = useCallback(async (invoiceUuid: string) => {
    let authToken = token;
    if (!authToken && typeof window !== "undefined") {
      authToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
    }

    if (!authToken) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const url = new URL(`${BASE_URL}/invoice/${invoiceUuid}`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to delete invoice: ${response.statusText}`);
      }

      await fetchInvoices(pagination.page);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [fetchInvoices, pagination.page, token, activeBusinessId]);

  const exportExcel = useCallback(async (options?: { range?: "day" | "week" | "month"; status?: string }) => {
    let authToken = token;
    if (!authToken && typeof window !== "undefined") {
      authToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
    }
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    const url = new URL(`${BASE_URL}/invoice/export`);
    if (options?.range) url.searchParams.append("range", options.range);
    if (options?.status && options.status !== "all") {
      url.searchParams.append("status", options.status);
    }
    if (activeBusinessId) {
      url.searchParams.append("businessId", activeBusinessId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Failed to export invoices: ${response.statusText}`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="?([^"]+)"?/i);
    const filename = match?.[1] ?? `invoices-${options?.range ?? "all"}-${Date.now()}.xlsx`;
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
    return true;
  }, [token, activeBusinessId]);

  return {
    invoices,
    loading,
    actionLoading,
    error,
    pagination,
    nextPage,
    prevPage,
    updateInvoiceStatus,
    deleteInvoice,
    exportExcel,
    refetch: fetchInvoices,
  };
}
