import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { useDashboardRefresh } from "@/contexts/DashboardRefreshContext";
import { BASE_URL } from "@/lib/constant";
import { STAFF_REALTIME_EVENTS } from "@/lib/staff-realtime";
import { parseApiErrorText } from "@/lib/format-api-error";
import type { OrderCreditDetails } from "@/lib/credit-types";
import {
  isTerminalOrderStatus,
  mergeOrderSessionFields,
} from "@/lib/merge-order-session";

function parseApiError(text: string, fallback: string) {
  return parseApiErrorText(text, fallback);
}

function mergeOrderLists(previous: OrderRecord[], incoming: OrderRecord[]): OrderRecord[] {
  const byId = new Map(previous.map((o) => [o.id, o]));
  const next: OrderRecord[] = [];
  for (const row of incoming) {
    const existing = byId.get(row.id);
    if (existing) {
      next.push(mergeOrderSessionFields(existing, row));
      byId.delete(row.id);
    } else {
      next.push(row);
    }
  }
  return next;
}

function orderFromSocketPayload(raw: unknown): OrderRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = String(data.id ?? data.orderId ?? "").trim();
  if (!id) return null;
  const itemsRaw = (data.Items ?? data.items) as OrderRecord["Items"] | undefined;
  return {
    id,
    orderNumber: String(data.orderNumber ?? ""),
    Items: Array.isArray(itemsRaw) ? itemsRaw : [],
    totalPrice: String(data.totalPrice ?? "0"),
    deliveryCharges: String(data.deliveryCharges ?? "0"),
    packagingPrice: String(data.packagingPrice ?? "0"),
    status: String(data.status ?? "pending"),
    isPriceOverridden: Boolean(data.isPriceOverridden),
    priceSource: String(data.priceSource ?? ""),
    table: data.table != null ? String(data.table) : null,
    tableGuestName: (data.tableGuestName as string | null) ?? null,
    sessionMinutes:
      data.sessionMinutes == null || data.sessionMinutes === ""
        ? null
        : Math.round(Number(data.sessionMinutes)),
    sessionPausedAt: (data.sessionPausedAt as string | null) ?? null,
    sessionPausedMs: (data.sessionPausedMs as number | null) ?? null,
    gameType: (data.gameType as string | null) ?? null,
    orderType: String(data.orderType ?? ""),
    createdBy: String(data.createdBy ?? ""),
    creatorRole: String(data.creatorRole ?? ""),
    businessId: data.businessId != null ? String(data.businessId) : null,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    updatedAt: String(data.updatedAt ?? new Date().toISOString()),
  };
}

export type CompleteOrderOptions = {
  status: string;
  paymentMethod?: string;
  credit?: OrderCreditDetails | null;
  totalPrice?: number;
  sessionTableCharge?: number;
};
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

export interface CreateOrderItemPayload {
  productId: string;
  variantId?: string;
  quantity: number;
  price?: number;
}

export interface CreateOrderPayload {
  tableId?: string;
  items: CreateOrderItemPayload[];
  totalPrice: number;
  deliveryCharges: number;
  packagingPrice: number;
  tableGuestName?: string;
  gameType?: string;
  sessionMinutes?: number;
}

export interface UpdateOrderPayload {
  items?: Array<Record<string, unknown>>;
  deliveryCharges?: number;
  packagingPrice?: number;
}

export interface OrderVariant {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: string;
  originalPrice: string;
  total: string;
  variant: OrderVariant;
  image?: string;
  quantity: number;
  discount?: number | string;
  isSessionService?: boolean;
  unitPriceSnapshot?: number | string | null;
  totalPriceSnapshot?: number | string | null;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  Items: OrderItem[];
  totalPrice: string;
  deliveryCharges: string;
  packagingPrice: string;
  status: string;
  isPriceOverridden: boolean;
  priceSource: string;
  table: string | null;
  tableGuestName?: string | null;
  sessionMinutes?: number | null;
  sessionPausedAt?: string | null;
  sessionPausedMs?: number | null;
  gameType?: string | null;
  orderType: string;
  createdBy: string;
  creatorRole: string;
  businessId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  data: OrderRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseOrdersOptions {
  range?: string;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { range = "day" } = options;
  const { token } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const { bumpDashboardRefresh } = useDashboardRefresh();
  const requestVersion = useRef(0);
  const currentPage = useRef(1);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    last_page: 1,
  });

  const fetchOrders = useCallback(
    async (pageNum: number = 1, nextRange: string = range, background = false) => {
      const request = ++requestVersion.current;
      const authToken = getAuthToken(token);
      if (!authToken) {
        setError("No authentication token available");
        return;
      }

      if (!background) setLoading(true);
      setError(null);

      try {
        const url = new URL(`${BASE_URL}/orders`);
        url.searchParams.append("page", String(pageNum));
        url.searchParams.append("limit", "100");
        url.searchParams.append("includeActive", "true");
        if (nextRange) {
          url.searchParams.append("range", nextRange);
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
          if (response.status === 404 && request === requestVersion.current) {
            setOrders([]);
            setPagination({ total: 0, page: 1, last_page: 1 });
            setLoading(false);
            return;
          }
          const text = await response.text();
          throw new Error(text || `Failed to fetch orders: ${response.statusText}`);
        }

        const data: OrdersResponse = await response.json();
        if (request !== requestVersion.current) return;
        const rows = data.data ?? [];
        // Active queues have no page controls: load every API page before
        // filtering tabs so older active orders cannot be hidden by history.
        for (let nextPage = pageNum + 1; nextPage <= (data.pagination?.totalPages ?? 1); nextPage++) {
          if (request !== requestVersion.current) return;
          url.searchParams.set("page", String(nextPage));
          const nextResponse = await fetch(url.toString(), {
            headers: { accept: "application/json", Authorization: `Bearer ${authToken}` },
          });
          if (!nextResponse.ok) throw new Error(`Failed to refresh order page ${nextPage}`);
          const nextData: OrdersResponse = await nextResponse.json();
          rows.push(...(nextData.data ?? []));
        }
        if (request !== requestVersion.current) return;
        const uniqueRows = [...new Map(rows.map((row) => [row.id, row])).values()];
        currentPage.current = data.pagination?.page ?? pageNum;
        setOrders((prev) => (prev.length ? mergeOrderLists(prev, uniqueRows) : uniqueRows));
        setPagination({
          total: data.pagination?.total ?? 0,
          page: data.pagination?.page ?? pageNum,
          last_page: data.pagination?.totalPages ?? 1,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch orders";
        if (request === requestVersion.current) setError(message);
      } finally {
        if (request === requestVersion.current) setLoading(false);
      }
    },
    [range, token, activeBusinessId],
  );

  useEffect(() => {
    setOrders([]);
    fetchOrders(1, range);
    return () => { ++requestVersion.current; };
  }, [fetchOrders, range]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void fetchOrders(currentPage.current, range, true);
    };
    window.addEventListener(STAFF_REALTIME_EVENTS.ORDERS_CHANGED, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const interval = window.setInterval(refresh, 15000);
    return () => {
      window.removeEventListener(STAFF_REALTIME_EVENTS.ORDERS_CHANGED, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(interval);
    };
  }, [fetchOrders, range]);

  useEffect(() => {
    const onPatch = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const patch = orderFromSocketPayload(detail);
      if (!patch) return;
      // Timer/status events can omit prices and items. Reload the authoritative
      // order instead of replacing its amount with the parser's zero defaults.
      const payload = detail as Record<string, unknown>;
      if (!isTerminalOrderStatus(patch.status) &&
          (payload.totalPrice == null || !Array.isArray(payload.Items ?? payload.items))) {
        void fetchOrders(currentPage.current, range, true);
        return;
      }

      setOrders((prev) => {
        if (isTerminalOrderStatus(patch.status)) {
          return prev.filter((o) => o.id !== patch.id);
        }
        const idx = prev.findIndex((o) => o.id === patch.id);
        if (idx === -1) {
          return patch.Items.length > 0 ? [patch, ...prev] : prev;
        }
        const merged = mergeOrderSessionFields(prev[idx], patch);
        return prev.map((o, i) => i === idx ? merged : o);
      });
    };
    window.addEventListener(STAFF_REALTIME_EVENTS.ORDERS_PATCH, onPatch);
    return () => window.removeEventListener(STAFF_REALTIME_EVENTS.ORDERS_PATCH, onPatch);
  }, [fetchOrders, range]);

  const createOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/orders/create`);
        if (activeBusinessId) {
          url.searchParams.append("businessId", activeBusinessId);
        }

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
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

        const createdOrder = await response.json();
        await fetchOrders(1, range);
        return createdOrder;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchOrders, range, token, activeBusinessId],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, statusOrOptions: string | CompleteOrderOptions) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      const body =
        typeof statusOrOptions === "string"
          ? { status: statusOrOptions }
          : {
              status: statusOrOptions.status,
              ...(statusOrOptions.paymentMethod
                ? { paymentMethod: statusOrOptions.paymentMethod }
                : {}),
              ...(statusOrOptions.credit
                ? {
                    credit: {
                      name: statusOrOptions.credit.name,
                      phone: statusOrOptions.credit.phone,
                      email: statusOrOptions.credit.email,
                      dueDate: statusOrOptions.credit.dueDate,
                      partyId: statusOrOptions.credit.partyId,
                      clientCreditId: statusOrOptions.credit.clientCreditId,
                    },
                  }
                : {}),
              ...(statusOrOptions.totalPrice != null &&
              Number.isFinite(statusOrOptions.totalPrice)
                ? { totalPrice: statusOrOptions.totalPrice }
                : {}),
              ...(statusOrOptions.sessionTableCharge != null &&
              Number.isFinite(statusOrOptions.sessionTableCharge)
                ? { sessionTableCharge: statusOrOptions.sessionTableCharge }
                : {}),
            };
      const status = body.status;

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/orders/${orderId}`);
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
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(parseApiError(text, `Failed to update order: ${response.statusText}`));
        }

        // If the order was marked as served or completed, attempt to create an invoice.
        // This is best-effort: failures shouldn't block the order status update.
        try {
          const statusLower = status && status.toLowerCase();
          if (statusLower === "completed") {
            const invoiceUrl = new URL(`${BASE_URL}/software/invoices`);
            if (activeBusinessId) invoiceUrl.searchParams.append("businessId", activeBusinessId);

            await fetch(invoiceUrl.toString(), {
              method: "POST",
              headers: {
                accept: "application/json",
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ orderId }),
            });

            // notify other parts of the app (best-effort) so invoices can refresh
            // and pages can auto-remove completed orders
            try {
              if (typeof window !== "undefined" && window?.dispatchEvent) {
                window.dispatchEvent(new CustomEvent("invoices:refetch", { detail: { orderId } }));
                // Notify pages to remove order (works for both kitchen and orders pages)
                window.dispatchEvent(new CustomEvent("order:served", { detail: { orderId } }));
              }
            } catch (e) {
              console.error("Failed to dispatch events", e);
            }
            bumpDashboardRefresh();
          }
        } catch (err) {
          console.error("Failed to create invoice for order", orderId, err);
        }

        await fetchOrders(1, range);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [bumpDashboardRefresh, fetchOrders, range, token, activeBusinessId],
  );

  const getOrderById = useCallback(async (orderId: string) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    const url = new URL(`${BASE_URL}/orders/${orderId}`);
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

    const responseData = await response.json();
    return (responseData.data ?? responseData) as OrderRecord;
  }, [activeBusinessId, token]);

  const updateOrderById = useCallback(async (orderId: string, payload: UpdateOrderPayload) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    setActionLoading(true);
    try {
      const url = new URL(`${BASE_URL}/orders/${orderId}`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(parseApiError(text, `Failed to update order: ${response.statusText}`));
      }

      await fetchOrders(1, range);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [activeBusinessId, fetchOrders, range, token]);

  const updateSessionTimer = useCallback(
    async (
      orderId: string,
      payload: { paused?: boolean; sessionMinutes?: number },
    ) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);

      const applyOptimistic = (patch: { paused?: boolean; sessionMinutes?: number }) => {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== orderId) return o;
            const nowIso = new Date().toISOString();
            if (patch.paused === true && !o.sessionPausedAt) {
              return { ...o, sessionPausedAt: nowIso, updatedAt: nowIso };
            }
            if (patch.paused === false && o.sessionPausedAt) {
              return {
                ...o,
                sessionPausedAt: null,
                updatedAt: nowIso,
              };
            }
            if (patch.sessionMinutes != null) {
              return { ...o, sessionMinutes: patch.sessionMinutes, updatedAt: nowIso };
            }
            return o;
          }),
        );
      };

      applyOptimistic(payload);

      try {
        const url = new URL(`${BASE_URL}/orders/${orderId}/session-timer`);
        if (activeBusinessId) {
          url.searchParams.append("businessId", activeBusinessId);
        }

        const response = await fetch(url.toString(), {
          method: "PATCH",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          void fetchOrders(1, range);
          throw new Error(parseApiError(text, "Failed to update session timer"));
        }

        const raw = (await response.json()) as OrderRecord | { data?: OrderRecord };
        const updated =
          raw && typeof raw === "object" && "data" in raw && raw.data
            ? raw.data
            : (raw as OrderRecord);

        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? mergeOrderSessionFields(o, {
                  ...updated,
                  Items: updated.Items?.length ? updated.Items : o.Items,
                })
              : o,
          ),
        );

        return updated;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchOrders, range, token],
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/orders/${orderId}`);
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
          throw new Error(parseApiError(text, "Failed to remove order"));
        }

        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchOrders, range, token],
  );

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    refetch: fetchOrders,
    createOrder,
    updateOrderStatus,
    updateOrderById,
    getOrderById,
    updateSessionTimer,
    deleteOrder,
    actionLoading,
  };
}
