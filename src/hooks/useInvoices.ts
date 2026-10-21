import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";
import { STAFF_REALTIME_EVENTS } from "@/lib/staff-realtime";
import { DIGINIZAM_CLIENT, DIGINIZAM_CLIENT_HEADER } from "@/lib/diginizam-client";
import { machineTzOffsetMinutes } from "@/lib/invoice-datetime";

export type InvoiceStatus = "pending" | "paid" | "overdue" | string;

export interface InvoiceItem {
  productname: string;
  variantName?: string;
  image?: string;
  quantity: number;
  price: string | number;
  total?: number;
  isSessionService?: boolean;
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
  tableGuestName?: string | null;
  gameType?: string | null;
  sessionMinutes?: number | null;
  orderPlacedAt?: string | null;
  sessionBookedEndAt?: string | null;
  sessionEndedAt?: string | null;
  totalPrice: string | number;
  subtotal?: number;
  deliveryCharges: string | number | null;
  packagingPrice: string | number | null;
  Items: InvoiceItem[];
  items?: InvoiceItem[];
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
  loadAll?: boolean;
}

function normalizeInvoice(raw: unknown): InvoiceRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as InvoiceRecord;
  return {
    ...row,
    Items: row.Items ?? row.items ?? [],
  };
}

function unwrapInvoiceList(payload: unknown): {
  invoices: InvoiceRecord[];
  pagination: { total?: number; page?: number; totalPages?: number; limit?: number };
} {
  if (Array.isArray(payload)) {
    return {
      invoices: payload.map(normalizeInvoice).filter(Boolean) as InvoiceRecord[],
      pagination: {},
    };
  }
  if (!payload || typeof payload !== "object") {
    return { invoices: [], pagination: {} };
  }

  const root = payload as Record<string, unknown>;
  const nested = root.data;
  const list = Array.isArray(nested)
    ? nested
    : nested && typeof nested === "object" && Array.isArray((nested as Record<string, unknown>).data)
      ? ((nested as Record<string, unknown>).data as unknown[])
      : [];

  const paginationSource =
    (root.pagination as Record<string, unknown> | undefined) ??
    (nested && typeof nested === "object"
      ? ((nested as Record<string, unknown>).pagination as Record<string, unknown> | undefined)
      : undefined);

  return {
    invoices: list.map(normalizeInvoice).filter(Boolean) as InvoiceRecord[],
    pagination: {
      total: Number(paginationSource?.total) || undefined,
      page: Number(paginationSource?.page) || undefined,
      totalPages: Number(paginationSource?.totalPages ?? paginationSource?.last_page) || undefined,
      limit: Number(paginationSource?.limit) || undefined,
    },
  };
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const { page = 1, limit = 20, range = "day", loadAll = false } = options;
  const { token } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const requestVersion = useRef(0);
  const requestedPage = useRef(page);

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
    const request = ++requestVersion.current;
    requestedPage.current = loadAll ? 1 : pageNum;
    let authToken = token;
    if (!authToken && typeof window !== "undefined") {
      authToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
    }

    if (!authToken) {
      setError("No authentication token available");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${BASE_URL}/software/invoices`);
      if (!loadAll) {
        url.searchParams.append("page", String(pageNum));
        if (limit) url.searchParams.append("limit", String(limit));
      }
      if (range) {
        url.searchParams.append("range", range);
      }
      url.searchParams.append("tzOffsetMinutes", String(machineTzOffsetMinutes()));
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
          [DIGINIZAM_CLIENT_HEADER]: DIGINIZAM_CLIENT,
        },
      });

      if (request !== requestVersion.current) return;

      if (!response.ok) {
        if (response.status === 404) {
          setInvoices([]);
          setPagination({ total: 0, page: 1, last_page: 1 });
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch invoices: ${response.statusText}`);
      }

      const payload = await response.json();
      if (request !== requestVersion.current) return;
      const unwrapped = unwrapInvoiceList(payload);
      let loaded = unwrapped.invoices;
      if (loadAll) {
        // This API returns all rows when limit is omitted. Also support servers
        // that enforce a default page size, without exposing pages in the UI.
        const batchSize = unwrapped.pagination.limit ?? loaded.length;
        const pages = unwrapped.pagination.totalPages ??
          (batchSize > 0 ? Math.ceil((unwrapped.pagination.total ?? loaded.length) / batchSize) : 1);
        for (let nextPage = 2; nextPage <= pages; nextPage++) {
          if (request !== requestVersion.current) return;
          const nextUrl = new URL(url);
          nextUrl.searchParams.set("page", String(nextPage));
          if (batchSize > 0) nextUrl.searchParams.set("limit", String(batchSize));
          const nextResponse = await fetch(nextUrl.toString(), {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${authToken}`,
              [DIGINIZAM_CLIENT_HEADER]: DIGINIZAM_CLIENT,
            },
          });
          if (request !== requestVersion.current) return;
          if (!nextResponse.ok) throw new Error("Could not load all invoices. Please refresh to try again.");
          const next = unwrapInvoiceList(await nextResponse.json());
          if (request !== requestVersion.current) return;
          loaded = [...loaded, ...next.invoices];
        }
        const seen = new Set<string>();
        loaded = loaded.filter((invoice) => {
          if (!invoice.uuid) return true;
          if (seen.has(invoice.uuid)) return false;
          seen.add(invoice.uuid);
          return true;
        });
        if (unwrapped.pagination.total !== undefined && loaded.length < unwrapped.pagination.total) {
          throw new Error("Some invoices could not be loaded. Please refresh to try again.");
        }
      }
      setInvoices(loaded);
      setPagination({
        total: unwrapped.pagination.total ?? loaded.length,
        page: loadAll ? 1 : unwrapped.pagination.page ?? pageNum,
        last_page: loadAll ? 1 : unwrapped.pagination.totalPages ?? 1,
      });
    } catch (err) {
      if (request === requestVersion.current) {
        const message = err instanceof Error ? err.message : "An error occurred while fetching invoices";
        setError(message);
      }
    } finally {
      if (request === requestVersion.current) setLoading(false);
    }
  }, [token, limit, range, activeBusinessId, loadAll]);

  useEffect(() => {
    fetchInvoices(page);
    return () => { requestVersion.current += 1; };
  }, [page, fetchInvoices]);

  // Listen for external signals to refetch invoices (e.g. after invoice creation)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      fetchInvoices(requestedPage.current);
    };

    window.addEventListener("invoices:refetch", handler as EventListener);
    window.addEventListener(STAFF_REALTIME_EVENTS.INVOICES_CHANGED, handler as EventListener);
    return () => {
      window.removeEventListener("invoices:refetch", handler as EventListener);
      window.removeEventListener(STAFF_REALTIME_EVENTS.INVOICES_CHANGED, handler as EventListener);
    };
  }, [fetchInvoices]);

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
      const url = new URL(`${BASE_URL}/software/invoices/${invoiceUuid}`);
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
      const url = new URL(`${BASE_URL}/software/invoices/${invoiceUuid}`);
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

  const returnInvoice = useCallback(
    async (invoiceUuid: string, options?: { clientReturnId?: string; reason?: string }) => {
      let authToken = token;
      if (!authToken && typeof window !== "undefined") {
        authToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
      }

      if (!authToken) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/software/invoices/${invoiceUuid}/return`);
        if (activeBusinessId) {
          url.searchParams.append("businessId", activeBusinessId);
        }

        const clientReturnId =
          options?.clientReturnId ||
          (typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `ret-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            [DIGINIZAM_CLIENT_HEADER]: DIGINIZAM_CLIENT,
          },
          body: JSON.stringify({
            clientReturnId,
            source: "web",
            ...(options?.reason ? { reason: options.reason } : {}),
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          let message = text || `Failed to return invoice: ${response.statusText}`;
          try {
            const parsed = JSON.parse(text);
            if (parsed?.message) {
              message = Array.isArray(parsed.message)
                ? parsed.message.join(", ")
                : String(parsed.message);
            }
          } catch {
            /* keep message */
          }
          throw new Error(message);
        }

        await fetchInvoices(pagination.page);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("invoices:refetch"));
          window.dispatchEvent(new Event(STAFF_REALTIME_EVENTS.INVOICES_CHANGED));
        }
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchInvoices, pagination.page, token, activeBusinessId],
  );

  const exportExcel = useCallback(async (options?: { range?: "day" | "week" | "month"; status?: string }) => {
    let authToken = token;
    if (!authToken && typeof window !== "undefined") {
      authToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
    }
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    const url = new URL(`${BASE_URL}/software/invoices/export`);
    if (options?.range) url.searchParams.append("range", options.range);
    if (options?.status && options.status !== "all") {
      url.searchParams.append("status", options.status);
    }
    if (activeBusinessId) {
      url.searchParams.append("businessId", activeBusinessId);
    }
    url.searchParams.append("tzOffsetMinutes", String(machineTzOffsetMinutes()));

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
    returnInvoice,
    exportExcel,
    refetch: fetchInvoices,
  };
}
