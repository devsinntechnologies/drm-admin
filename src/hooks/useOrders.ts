import { useCallback, useEffect, useState } from "react";
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
    async (pageNum: number = 1, nextRange: string = range) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        setError("No authentication token available");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = new URL(`${BASE_URL}/orders`);
        url.searchParams.append("page", String(pageNum));
        url.searchParams.append("limit", "20");
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
          if (response.status === 404) {
            setOrders([]);
            setPagination({ total: 0, page: 1, last_page: 1 });
            setLoading(false);
            return;
          }
          const text = await response.text();
          throw new Error(text || `Failed to fetch orders: ${response.statusText}`);
        }

        const data: OrdersResponse = await response.json();
        const rows = data.data ?? [];
        setOrders((prev) => (prev.length ? mergeOrderLists(prev, rows) : rows));
        setPagination({
          total: data.pagination?.total ?? 0,
          page: data.pagination?.page ?? pageNum,
          last_page: data.pagination?.totalPages ?? 1,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch orders";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [range, token, activeBusinessId],
  );

  useEffect(() => {
    fetchOrders(1, range);
  }, [fetchOrders, range]);

  useEffect(() => {
    const refresh = () => {
      void fetchOrders(1, range);
    };
    window.addEventListener(STAFF_REALTIME_EVENTS.ORDERS_CHANGED, refresh);
    return () => window.removeEventListener(STAFF_REALTIME_EVENTS.ORDERS_CHANGED, refresh);
  }, [fetchOrders, range]);

  useEffect(() => {
    const onPatch = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const patch = orderFromSocketPayload(detail);
      if (!patch) return;

      setOrders((prev) => {
        if (isTerminalOrderStatus(patch.status)) {
          return prev.filter((o) => o.id !== patch.id);
        }
        const idx = prev.findIndex((o) => o.id === patch.id);
        if (idx === -1) {
          return patch.Items.length > 0 ? [patch, ...prev] : prev;
        }
        const merged = mergeOrderSessionFields(prev[idx], patch);
        return prev.map((o, i) =>
          i === idx
            ? {
                ...merged,
                Items: patch.Items.length ? patch.Items : o.Items,
              }
            : o,
        );
      });
    };
    window.addEventListener(STAFF_REALTIME_EVENTS.ORDERS_PATCH, onPatch);
    return () => window.removeEventListener(STAFF_REALTIME_EVENTS.ORDERS_PATCH, onPatch);
  }, []);

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
