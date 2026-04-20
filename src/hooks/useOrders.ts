import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const BASE_URL = "https://vendor.umazing.shop";

function getAuthToken(reduxToken: string | null) {
  if (reduxToken) {
    return reduxToken;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("auth_token") || localStorage.getItem("token");
}

export interface CreateOrderItemPayload {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderPayload {
  tableId: string;
  items: CreateOrderItemPayload[];
  totalPrice: number;
  deliveryCharges: number;
  packagingPrice: number;
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
  total: number;
  page: number;
  last_page: number;
}

interface UseOrdersOptions {
  range?: string;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { range = "day" } = options;
  const { token } = useAuth();
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
    async (nextRange: string = range) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        setError("No authentication token available");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = new URL(`${BASE_URL}/orders`);
        if (nextRange) {
          url.searchParams.append("range", nextRange);
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
          throw new Error(text || `Failed to fetch orders: ${response.statusText}`);
        }

        const data: OrdersResponse = await response.json();
        setOrders(data.data ?? []);
        setPagination({
          total: data.total ?? 0,
          page: data.page ?? 1,
          last_page: data.last_page ?? 1,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch orders";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [range, token],
  );

  useEffect(() => {
    fetchOrders(range);
  }, [fetchOrders, range]);

  const createOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/orders/create`, {
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
          throw new Error(text || `Failed to create order: ${response.statusText}`);
        }

        const createdOrder = await response.json();
        await fetchOrders(range);
        return createdOrder;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchOrders, range, token],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      const authToken = getAuthToken(token);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      setActionLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
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
          throw new Error(text || `Failed to update order: ${response.statusText}`);
        }

        await fetchOrders(range);
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchOrders, range, token],
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
    actionLoading,
  };
}
