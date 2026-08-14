"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";
import { STAFF_REALTIME_EVENTS } from "@/lib/staff-realtime";

function getAuthToken(reduxToken: string | null) {
  if (reduxToken) return reduxToken;
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || localStorage.getItem("token");
}

function parseApiError(text: string, fallback: string) {
  try {
    const parsed = JSON.parse(text);
    let detail: unknown = parsed.message ?? parsed.error ?? text;
    if (detail && typeof detail === "object" && "message" in (detail as object)) {
      detail = (detail as { message?: unknown }).message ?? detail;
    }
    if (Array.isArray(detail)) return detail.join(", ");
    if (typeof detail === "string" && detail.trim()) return detail;
    return fallback;
  } catch {
    return text || fallback;
  }
}

export type SelfOrderStatus = "pending" | "approved" | "rejected";

export interface SelfOrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  productName: string;
  variantName?: string | null;
}

export interface SelfOrderRequest {
  id: string;
  businessId: string;
  tableId: string;
  tableNumber: string | null;
  status: SelfOrderStatus;
  customerName?: string | null;
  notes?: string | null;
  totalPrice: number;
  approvedOrderId?: string | null;
  reviewedBy?: string | null;
  rejectedReason?: string | null;
  items: SelfOrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface UseSelfOrdersOptions {
  status?: SelfOrderStatus;
  pollMs?: number;
}

export function useSelfOrders(options: UseSelfOrdersOptions = {}) {
  const { status = "pending", pollMs = 0 } = options;
  const { token } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const [requests, setRequests] = useState<SelfOrderRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const authToken = getAuthToken(token);
    if (!authToken || !activeBusinessId) return;

    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${BASE_URL}/self-orders`);
      url.searchParams.set("status", status);
      url.searchParams.set("businessId", activeBusinessId);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(parseApiError(await response.text(), "Failed to load self-orders"));
      }
      const json = await response.json();
      const data = (json.data ?? json) as SelfOrderRequest[];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load self-orders");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId, status, token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const refresh = () => {
      void fetchRequests();
    };
    window.addEventListener(STAFF_REALTIME_EVENTS.SELF_ORDERS_CHANGED, refresh);
    return () => window.removeEventListener(STAFF_REALTIME_EVENTS.SELF_ORDERS_CHANGED, refresh);
  }, [fetchRequests]);

  useEffect(() => {
    if (!pollMs) return;
    const timer = window.setInterval(() => {
      void fetchRequests();
    }, pollMs);
    return () => window.clearInterval(timer);
  }, [fetchRequests, pollMs]);

  const approve = useCallback(
    async (id: string) => {
      const authToken = getAuthToken(token);
      if (!authToken) throw new Error("No token");
      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/self-orders/${id}/approve`);
        if (activeBusinessId) url.searchParams.set("businessId", activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!response.ok) {
          throw new Error(parseApiError(await response.text(), "Failed to approve request"));
        }
        await fetchRequests();
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchRequests, token],
  );

  const reject = useCallback(
    async (id: string, reason?: string) => {
      const authToken = getAuthToken(token);
      if (!authToken) throw new Error("No token");
      setActionLoading(true);
      try {
        const url = new URL(`${BASE_URL}/self-orders/${id}/reject`);
        if (activeBusinessId) url.searchParams.set("businessId", activeBusinessId);
        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ reason }),
        });
        if (!response.ok) {
          throw new Error(parseApiError(await response.text(), "Failed to reject request"));
        }
        await fetchRequests();
      } finally {
        setActionLoading(false);
      }
    },
    [activeBusinessId, fetchRequests, token],
  );

  return {
    requests,
    loading,
    actionLoading,
    error,
    fetchRequests,
    approve,
    reject,
  };
}
