import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";

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
  variantId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderPayload {
  tableId?: string;
  items: CreateOrderItemPayload[];
  totalPrice: number;
  deliveryCharges: number;
  packagingPrice: number;
}

export interface UpdateOrderPayload {
  tableId?: string;
  status?: string;
  items?: Array<CreateOrderItemPayload & { id?: string; action?: "add" | "update" | "remove" }>;
  totalPrice?: number;
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
        setOrders(data.data ?? []);
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
    async (orderId: string, status: string) => {
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

        // If the order was marked as served or completed, attempt to create an invoice.
        // This is best-effort: failures shouldn't block the order status update.
        try {
          const statusLower = status && status.toLowerCase();
          if (statusLower === "served" || statusLower === "completed") {
            const invoiceUrl = new URL(`${BASE_URL}/invoice`);
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
    [fetchOrders, range, token, activeBusinessId],
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

      await fetchOrders(1, range);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [activeBusinessId, fetchOrders, range, token]);

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
    actionLoading,
  };
}
